import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { evaluateDeliveryOutcome } from '@/lib/delivery-engine'
import { calculateBusinessImpact } from '@/lib/impact-engine'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getDomainIds } from '@/lib/services/domain.service'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // INMYBOX ENHANCEMENT — Phase 2 M2: Validate export format enum
  const validFormats = ['csv', 'pdf']
  const rawFormat = new URL(req.url).searchParams.get('format') || 'csv'
  const format = validFormats.includes(rawFormat) ? rawFormat : 'csv'
  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return new NextResponse('No data', { status: 404 })
  }

  const domainIds = await getDomainIds(ctx.tenantId)
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: ctx.tenantId } })
  const domains = await prisma.domain.findMany({ where: { tenantId: ctx.tenantId } })

  const records = await prisma.dmarcRecord.findMany({
    where: { report: { domainId: { in: domainIds } } },
    include: { report: { include: { domain: true } } },
    orderBy: { createdAt: 'desc' },
  })

  if (format === 'csv') {
    const header = 'Report ID,Organization,Domain,Date Begin,Date End,Source IP,Count,SPF,DKIM,DMARC,Disposition\n'
    const rows = records.map((r) =>
      [
        r.report.reportId,
        r.report.orgName,
        r.report.domain.domain,
        new Date(r.report.dateBegin).toISOString(),
        new Date(r.report.dateEnd).toISOString(),
        r.sourceIp,
        r.count,
        r.spfResult,
        r.dkimResult,
        r.dmarcResult,
        r.disposition,
      ].join(',')
    ).join('\n')

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=inmybox-export-${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  }

  if (format === 'pdf') {
    // Build a simple text-based PDF-like response
    // Real PDF generation would use jspdf, but for server-side we return JSON for client rendering
    const delivery = evaluateDeliveryOutcome(records)
    const impact = calculateBusinessImpact(
      records.reduce((sum, r) => sum + r.count, 0),
      delivery,
      {
        conversionRate: settings?.conversionRate || 0.02,
        avgLeadValue: settings?.avgLeadValue || 50,
        campaignBenchmark: settings?.campaignBenchmark || 0.15,
      }
    )

    const reportContent = {
      title: 'Inmybox Email Reputation Report',
      generated: new Date().toISOString(),
      summary: {
        totalRecords: records.length,
        totalVolume: records.reduce((sum, r) => sum + r.count, 0),
        delivery,
        impact,
      },
      domains: domains.map((d) => d.domain),
    }

    return NextResponse.json(reportContent, {
      headers: {
        'Content-Disposition': `attachment; filename=inmybox-report-${new Date().toISOString().split('T')[0]}.json`,
      },
    })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}
