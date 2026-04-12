import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { computeAnalytics } from '@/lib/services/analytics.service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json(emptyAnalytics())
  }

  const analytics = await computeAnalytics(ctx.tenantId)
  return NextResponse.json(analytics)
}

function emptyAnalytics() {
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
