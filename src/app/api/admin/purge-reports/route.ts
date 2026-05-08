/**
 * Super-admin endpoint to purge all DMARC report data for the currently
 * active tenant (the super-admin's first membership).
 *
 * Scope: deletes records/reports/raw_files/senders/sender_classifications/
 * ip_enrichments/risk_scores/action_items/ingestion_logs that belong to
 * this tenant. Tenant, users, domains, alias_mappings and all configuration
 * are preserved.
 *
 * Requires body { confirm: 'PURGE' }. Anything else returns 400.
 *
 * Future: when multiple tenants exist, accept an explicit { tenantId } and
 * verify the caller has access to it. For now the endpoint is intentionally
 * scoped to the caller's own tenant context.
 */

import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body?.confirm !== 'PURGE') {
    return NextResponse.json(
      { error: 'Confirmation required: body must include { confirm: "PURGE" }' },
      { status: 400 }
    )
  }

  const ctx = await resolveTenantContext(guard.userId)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant context for this user' }, { status: 400 })
  }
  const tenantId = ctx.tenantId

  // Domains belonging to this tenant — used to scope per-domain tables.
  const domains = await prisma.domain.findMany({
    where: { tenantId },
    select: { id: true },
  })
  const domainIds = domains.map((d) => d.id)

  // Senders belonging to this tenant's domains — used to scope sender_classifications.
  const senders = await prisma.sender.findMany({
    where: { domainId: { in: domainIds } },
    select: { id: true },
  })
  const senderIds = senders.map((s) => s.id)

  // ip_enrichments are global rows (no tenantId / no domainId). Scope by usage:
  // delete only enrichments referenced by records belonging to this tenant's
  // reports. Resolve the referenced ids before deleting the records.
  const enrichmentRows = await prisma.dmarcRecord.findMany({
    where: {
      report: { domainId: { in: domainIds } },
      ipEnrichmentId: { not: null },
    },
    select: { ipEnrichmentId: true },
    distinct: ['ipEnrichmentId'],
  })
  const enrichmentIds = enrichmentRows
    .map((r) => r.ipEnrichmentId)
    .filter((v): v is string => !!v)

  const result = await prisma.$transaction(async (tx) => {
    const records = await tx.dmarcRecord.deleteMany({
      where: { report: { domainId: { in: domainIds } } },
    })
    const reports = await tx.dmarcReport.deleteMany({
      where: { domainId: { in: domainIds } },
    })
    const rawFiles = await tx.rawFile.deleteMany({
      where: { tenantId },
    })
    const senderClassifications = await tx.senderClassification.deleteMany({
      where: { senderId: { in: senderIds } },
    })
    const sendersDel = await tx.sender.deleteMany({
      where: { domainId: { in: domainIds } },
    })
    const ipEnrichments = enrichmentIds.length
      ? await tx.ipEnrichment.deleteMany({ where: { id: { in: enrichmentIds } } })
      : { count: 0 }
    const riskScores = await tx.riskScore.deleteMany({
      where: { domainId: { in: domainIds } },
    })
    const actionItems = await tx.actionItem.deleteMany({
      where: { tenantId },
    })
    const ingestionLogs = await tx.ingestionLog.deleteMany({
      where: { tenantId },
    })

    return {
      dmarcRecords: records.count,
      dmarcReports: reports.count,
      rawFiles: rawFiles.count,
      senderClassifications: senderClassifications.count,
      senders: sendersDel.count,
      ipEnrichments: ipEnrichments.count,
      riskScores: riskScores.count,
      actionItems: actionItems.count,
      ingestionLogs: ingestionLogs.count,
    }
  })

  return NextResponse.json({ ok: true, tenantId, deleted: result })
}
