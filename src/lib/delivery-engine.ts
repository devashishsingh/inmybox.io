import type { DeliveryOutcome, RiskLevel } from '@/types'

interface RecordInput {
  spfResult: string
  dkimResult: string
  dmarcResult: string
  disposition: string
  count: number
}

const WEIGHTS = {
  spf: 0.25,
  dkim: 0.30,
  dmarc: 0.30,
  disposition: 0.15,
}

function scoreRecord(record: RecordInput): number {
  let score = 0

  if (record.spfResult === 'pass') score += WEIGHTS.spf
  if (record.dkimResult === 'pass') score += WEIGHTS.dkim
  if (record.dmarcResult === 'pass') score += WEIGHTS.dmarc

  if (record.disposition === 'none') score += WEIGHTS.disposition
  else if (record.disposition === 'quarantine') score += WEIGHTS.disposition * 0.3
  // reject = 0

  return score
}

function classifyRisk(score: number, disposition: string): RiskLevel {
  if (score >= 0.85 && disposition === 'none') return 'healthy'
  if (score >= 0.55) return 'medium'
  if (score >= 0.30) return 'high'
  return 'critical'
}

export function evaluateDeliveryOutcome(records: RecordInput[]): DeliveryOutcome {
  if (records.length === 0) {
    return {
      riskLevel: 'healthy',
      inboxProbability: 1,
      spamProbability: 0,
      rejectProbability: 0,
      trustScore: 100,
      label: 'No Data',
      description: 'No records to evaluate. Upload DMARC reports to begin analysis.',
    }
  }

  let totalVolume = 0
  let weightedScore = 0
  let quarantineVolume = 0
  let rejectVolume = 0
  let passVolume = 0

  for (const record of records) {
    const count = record.count || 1
    totalVolume += count
    weightedScore += scoreRecord(record) * count

    if (record.disposition === 'quarantine') quarantineVolume += count
    else if (record.disposition === 'reject') rejectVolume += count

    if (
      record.spfResult === 'pass' &&
      record.dkimResult === 'pass' &&
      record.dmarcResult === 'pass'
    ) {
      passVolume += count
    }
  }

  const avgScore = weightedScore / totalVolume
  const inboxProbability = Math.min(1, Math.max(0, avgScore))
  const spamProbability = Math.min(1, quarantineVolume / totalVolume + (1 - avgScore) * 0.3)
  const rejectProbability = Math.min(1, rejectVolume / totalVolume)

  const trustScore = Math.round(avgScore * 100)
  const primaryDisposition =
    rejectVolume > quarantineVolume
      ? 'reject'
      : quarantineVolume > 0
        ? 'quarantine'
        : 'none'

  const riskLevel = classifyRisk(avgScore, primaryDisposition)

  const labels: Record<RiskLevel, string> = {
    healthy: 'Healthy',
    medium: 'Needs Attention',
    high: 'At Risk',
    critical: 'Critical',
  }

  const descriptions: Record<RiskLevel, string> = {
    healthy:
      'Email authentication is properly configured. Most messages pass SPF, DKIM, and DMARC checks.',
    medium:
      'Some authentication failures detected. Review failing senders to improve delivery rates.',
    high:
      'Significant authentication failures detected. Many emails may be landing in spam or being rejected.',
    critical:
      'Severe delivery issues. Most emails are failing authentication and being rejected or quarantined.',
  }

  return {
    riskLevel,
    inboxProbability,
    spamProbability,
    rejectProbability,
    trustScore,
    label: labels[riskLevel],
    description: descriptions[riskLevel],
  }
}

export function evaluateRecordRisk(record: RecordInput): {
  riskLevel: RiskLevel
  inboxLikely: boolean
} {
  const score = scoreRecord(record)
  const riskLevel = classifyRisk(score, record.disposition)
  return {
    riskLevel,
    inboxLikely: riskLevel === 'healthy' || riskLevel === 'medium',
  }
}
