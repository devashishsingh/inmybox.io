import type { BusinessImpact, DeliveryOutcome } from '@/types'

interface ImpactConfig {
  conversionRate: number
  avgLeadValue: number
  campaignBenchmark: number
}

const DEFAULT_CONFIG: ImpactConfig = {
  conversionRate: 0.02,
  avgLeadValue: 50,
  campaignBenchmark: 0.15,
}

export function calculateBusinessImpact(
  totalVolume: number,
  delivery: DeliveryOutcome,
  config: Partial<ImpactConfig> = {}
): BusinessImpact {
  const c = { ...DEFAULT_CONFIG, ...config }

  const estimatedReachable = Math.round(totalVolume * delivery.inboxProbability)
  const likelyUnreachable = totalVolume - estimatedReachable
  const spamRiskVolume = Math.round(totalVolume * delivery.spamProbability)

  const expectedLeads = Math.round(estimatedReachable * c.conversionRate)
  const maxPossibleLeads = Math.round(totalVolume * c.conversionRate)
  const potentialLeadLoss = Math.max(0, maxPossibleLeads - expectedLeads)

  const estimatedRevenueAtRisk = potentialLeadLoss * c.avgLeadValue

  // Campaign health: compare actual delivery vs benchmark
  const deliveryRate = totalVolume > 0 ? estimatedReachable / totalVolume : 1
  const campaignHealthScore = Math.min(100, Math.round((deliveryRate / c.campaignBenchmark) * 100))

  return {
    totalEmails: totalVolume,
    estimatedReachable,
    likelyUnreachable,
    spamRiskVolume,
    expectedLeads,
    potentialLeadLoss,
    estimatedRevenueAtRisk,
    campaignHealthScore: Math.min(100, campaignHealthScore),
  }
}

export function formatImpactSummary(impact: BusinessImpact): string {
  const lines = [
    `Total Emails Analyzed: ${impact.totalEmails.toLocaleString()}`,
    `Estimated Reachable: ${impact.estimatedReachable.toLocaleString()}`,
    `Likely Unreachable: ${impact.likelyUnreachable.toLocaleString()}`,
    `Spam Risk Volume: ${impact.spamRiskVolume.toLocaleString()}`,
    `Expected Leads: ${impact.expectedLeads.toLocaleString()}`,
    `Potential Lead Loss: ${impact.potentialLeadLoss.toLocaleString()}`,
    `Revenue at Risk: $${impact.estimatedRevenueAtRisk.toLocaleString()}`,
    `Campaign Health: ${impact.campaignHealthScore}%`,
  ]
  return lines.join('\n')
}
