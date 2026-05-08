/**
 * Date-ranged analytics endpoint.
 *
 * IMPORTANT: This is a dedicated, isolated endpoint. It deliberately duplicates
 * the computation logic from src/lib/services/analytics.service.ts rather than
 * reusing it, so the existing /api/analytics + computeAnalytics path stays
 * 100% untouched and acts as a safety net (the dashboard falls back to it on
 * any failure here).
 *
 * Differences vs the original:
 *  - Filters DmarcRecord/DmarcReport by report.dateBegin within [start, end]
 *  - Emits trendData[].date as ISO YYYY-MM-DD (frontend formats for display)
 *
 * Caveat: senderBreakdown and actionItemCounts are tenant-wide aggregates;
 * the underlying services do not accept a date range, so those two fields
 * are returned as-is (same value the all-time endpoint returns).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getDomainIds } from '@/lib/services/domain.service'
import { getSenderBreakdown } from '@/lib/services/sender.service'
import { getActionItemCounts } from '@/lib/services/action-items.service'
import { evaluateDeliveryOutcome } from '@/lib/delivery-engine'
import { calculateBusinessImpact } from '@/lib/impact-engine'
import { prisma } from '@/lib/prisma'
import type { AnalyticsSummary, TrendPoint } from '@/types'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)
  if (!ctx) return NextResponse.json(emptyAnalytics())

  const url = new URL(req.url)
  const startRaw = url.searchParams.get('start')
  const endRaw = url.searchParams.get('end')
  const safeDate = (v: string | null) => {
    if (!v) return undefined
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d
  }
  const start = safeDate(startRaw)
  const end = safeDate(endRaw)

  if (!start || !end || start > end) {
    return NextResponse.json(
      { error: 'Invalid or missing start/end query parameters' },
      { status: 400 }
    )
  }

  const result = await computeAnalyticsForRange(ctx.tenantId, start, end)
  return NextResponse.json(result)
}

async function computeAnalyticsForRange(
  tenantId: string,
  start: Date,
  end: Date
): Promise<AnalyticsSummary> {
  const domainIds = await getDomainIds(tenantId)
  if (domainIds.length === 0) return emptyAnalytics()

  const dateFilter = { dateBegin: { gte: start, lte: end } }

  const records = await prisma.dmarcRecord.findMany({
    where: { report: { domainId: { in: domainIds }, ...dateFilter } },
    include: { report: true },
    orderBy: { createdAt: 'desc' },
  })

  const reports = await prisma.dmarcReport.findMany({
    where: { domainId: { in: domainIds }, ...dateFilter },
    orderBy: { dateBegin: 'asc' },
  })

  if (records.length === 0) return emptyAnalytics()

  let totalVolume = 0
  let spfPass = 0
  let dkimPass = 0
  let dmarcPass = 0
  let quarantineVol = 0
  let rejectVol = 0

  for (const rec of records) {
    totalVolume += rec.count
    if (rec.spfResult === 'pass') spfPass += rec.count
    if (rec.dkimResult === 'pass') dkimPass += rec.count
    if (rec.dmarcResult === 'pass') dmarcPass += rec.count
    if (rec.disposition === 'quarantine') quarantineVol += rec.count
    if (rec.disposition === 'reject') rejectVol += rec.count
  }

  const delivery = evaluateDeliveryOutcome(records)

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const impact = calculateBusinessImpact(totalVolume, delivery, {
    conversionRate: settings?.conversionRate || 0.02,
    avgLeadValue: settings?.avgLeadValue || 50,
    campaignBenchmark: settings?.campaignBenchmark || 0.15,
  })

  // ISO YYYY-MM-DD keys so the chart sorts and aggregates correctly across years.
  const trendMap = new Map<string, { pass: number; fail: number; volume: number }>()
  for (const rec of records) {
    const d = new Date(rec.report.dateBegin)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    const existing = trendMap.get(key) || { pass: 0, fail: 0, volume: 0 }
    existing.volume += rec.count
    if (rec.dmarcResult === 'pass') existing.pass += rec.count
    else existing.fail += rec.count
    trendMap.set(key, existing)
  }
  const trendData: TrendPoint[] = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  const ipFailMap = new Map<string, { count: number; failCount: number; domain: string | null }>()
  for (const rec of records) {
    const existing = ipFailMap.get(rec.sourceIp) || { count: 0, failCount: 0, domain: null }
    existing.count += rec.count
    if (rec.dmarcResult === 'fail') existing.failCount += rec.count
    if (!existing.domain && rec.headerFrom) existing.domain = rec.headerFrom
    ipFailMap.set(rec.sourceIp, existing)
  }
  const topFailingIps = Array.from(ipFailMap.entries())
    .map(([ip, data]) => ({
      ip,
      count: data.count,
      failRate: data.failCount / data.count,
      domain: data.domain || undefined,
    }))
    .filter((ip) => ip.failRate > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Tenant-wide pass-throughs (no date scoping available in source services).
  const senderBreakdown = await getSenderBreakdown(tenantId)
  const actionItemCounts = await getActionItemCounts(tenantId)

  return {
    totalReports: reports.length,
    totalRecords: records.length,
    totalVolume,
    dataStartDate: reports.length > 0 ? reports[0].dateBegin.toISOString() : null,
    spfPassRate: totalVolume > 0 ? spfPass / totalVolume : 1,
    dkimPassRate: totalVolume > 0 ? dkimPass / totalVolume : 1,
    dmarcPassRate: totalVolume > 0 ? dmarcPass / totalVolume : 1,
    rejectionRate: totalVolume > 0 ? rejectVol / totalVolume : 0,
    quarantineRate: totalVolume > 0 ? quarantineVol / totalVolume : 0,
    delivery,
    impact,
    trendData,
    topFailingIps,
    senderBreakdown,
    actionItems: actionItemCounts,
  }
}

function emptyAnalytics(): AnalyticsSummary {
  return {
    totalReports: 0,
    totalRecords: 0,
    totalVolume: 0,
    dataStartDate: null,
    spfPassRate: 0,
    dkimPassRate: 0,
    dmarcPassRate: 0,
    rejectionRate: 0,
    quarantineRate: 0,
    delivery: {
      riskLevel: 'healthy',
      inboxProbability: 1,
      spamProbability: 0,
      rejectProbability: 0,
      trustScore: 100,
      label: 'No Data',
      description: 'Upload DMARC reports to begin analysis.',
    },
    impact: {
      totalEmails: 0,
      estimatedReachable: 0,
      likelyUnreachable: 0,
      spamRiskVolume: 0,
      expectedLeads: 0,
      potentialLeadLoss: 0,
      estimatedRevenueAtRisk: 0,
      campaignHealthScore: 100,
    },
    trendData: [],
    topFailingIps: [],
    senderBreakdown: { known: 0, unknown: 0, suspicious: 0, trusted: 0 },
    actionItems: { open: 0, critical: 0, high: 0 },
  }
}
