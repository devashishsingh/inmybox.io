import { prisma } from '@/lib/prisma'
import { evaluateDeliveryOutcome } from '@/lib/delivery-engine'
import { calculateBusinessImpact } from '@/lib/impact-engine'
import { getDomainIds } from './domain.service'
import { getSenderBreakdown } from './sender.service'
import { getActionItemCounts } from './action-items.service'
import type { AnalyticsSummary, TrendPoint } from '@/types'

/**
 * Computes full analytics summary for a tenant.
 */
export async function computeAnalytics(tenantId: string): Promise<AnalyticsSummary> {
  const domainIds = await getDomainIds(tenantId)

  if (domainIds.length === 0) return emptyAnalytics()

  // Fetch all records for tenant's domains
  const records = await prisma.dmarcRecord.findMany({
    where: { report: { domainId: { in: domainIds } } },
    include: { report: true },
    orderBy: { createdAt: 'desc' },
  })

  const reports = await prisma.dmarcReport.findMany({
    where: { domainId: { in: domainIds } },
    orderBy: { dateBegin: 'asc' },
  })

  if (records.length === 0) return emptyAnalytics()

  // Calculate totals
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

  // Delivery engine
  const delivery = evaluateDeliveryOutcome(records)

  // Business impact - get tenant settings
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const impact = calculateBusinessImpact(totalVolume, delivery, {
    conversionRate: settings?.conversionRate || 0.02,
    avgLeadValue: settings?.avgLeadValue || 50,
    campaignBenchmark: settings?.campaignBenchmark || 0.15,
  })

  // Trend data
  const trendMap = new Map<string, { pass: number; fail: number; volume: number }>()
  for (const rec of records) {
    const dateKey = new Date(rec.report.dateBegin).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const existing = trendMap.get(dateKey) || { pass: 0, fail: 0, volume: 0 }
    existing.volume += rec.count
    if (rec.dmarcResult === 'pass') existing.pass += rec.count
    else existing.fail += rec.count
    trendMap.set(dateKey, existing)
  }
  const trendData: TrendPoint[] = Array.from(trendMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))

  // Top failing IPs
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

  // Sender breakdown + action items
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

/**
 * Stores a risk score snapshot for a domain.
 */
export async function snapshotRiskScore(tenantId: string, domainId: string) {
  const records = await prisma.dmarcRecord.findMany({
    where: { report: { domainId } },
  })

  if (records.length === 0) return null

  const delivery = evaluateDeliveryOutcome(records)
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  const totalVolume = records.reduce((sum, r) => sum + r.count, 0)
  const impact = calculateBusinessImpact(totalVolume, delivery, {
    conversionRate: settings?.conversionRate || 0.02,
    avgLeadValue: settings?.avgLeadValue || 50,
    campaignBenchmark: settings?.campaignBenchmark || 0.15,
  })

  const passVolume = records
    .filter((r) => r.dmarcResult === 'pass')
    .reduce((sum, r) => sum + r.count, 0)

  return prisma.riskScore.create({
    data: {
      domainId,
      trustScore: delivery.trustScore,
      deliveryScore: delivery.inboxProbability,
      inboxProbability: delivery.inboxProbability,
      spamProbability: delivery.spamProbability,
      rejectProbability: delivery.rejectProbability,
      riskLevel: delivery.riskLevel,
      totalVolume,
      passVolume,
      failVolume: totalVolume - passVolume,
      estimatedReachable: impact.estimatedReachable,
      potentialLeadLoss: impact.potentialLeadLoss,
      estimatedRevenueAtRisk: impact.estimatedRevenueAtRisk,
      campaignHealthScore: impact.campaignHealthScore,
    },
  })
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
