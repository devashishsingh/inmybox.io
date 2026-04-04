import { prisma } from '@/lib/prisma'
import type { DmarcFeedback, ActionItemData, ActionItemSeverity } from '@/types'

/**
 * Generates action items based on a DMARC report's findings.
 * Analyzes records for notable patterns and creates actionable recommendations.
 */
export async function generateActionItems(
  tenantId: string,
  domainId: string,
  feedback: DmarcFeedback
): Promise<void> {
  const items: ActionItemData[] = []

  // Analyze records for patterns
  let spfFailCount = 0
  let dkimFailCount = 0
  let dmarcFailCount = 0
  let rejectCount = 0
  let totalVolume = 0
  const failingIps: Map<string, { count: number; spfFail: boolean; dkimFail: boolean }> = new Map()

  for (const record of feedback.records) {
    totalVolume += record.count
    if (record.spfResult === 'fail') spfFailCount += record.count
    if (record.dkimResult === 'fail') dkimFailCount += record.count
    if (record.dmarcResult === 'fail') dmarcFailCount += record.count
    if (record.disposition === 'reject') rejectCount += record.count

    if (record.dmarcResult === 'fail') {
      const existing = failingIps.get(record.sourceIp) || { count: 0, spfFail: false, dkimFail: false }
      existing.count += record.count
      if (record.spfResult === 'fail') existing.spfFail = true
      if (record.dkimResult === 'fail') existing.dkimFail = true
      failingIps.set(record.sourceIp, existing)
    }
  }

  if (totalVolume === 0) return

  const spfFailRate = spfFailCount / totalVolume
  const dkimFailRate = dkimFailCount / totalVolume
  const dmarcFailRate = dmarcFailCount / totalVolume

  // High SPF failure rate
  if (spfFailRate > 0.1) {
    const severity: ActionItemSeverity = spfFailRate > 0.5 ? 'critical' : spfFailRate > 0.25 ? 'high' : 'medium'
    items.push({
      type: 'spf_failure',
      severity,
      title: `SPF failing for ${Math.round(spfFailRate * 100)}% of emails`,
      description: `${spfFailCount.toLocaleString()} out of ${totalVolume.toLocaleString()} emails are failing SPF authentication from ${feedback.reportMetadata.orgName}.`,
      recommendation: 'Review your SPF record to ensure all legitimate sending IPs are included. Check if any new services or third-party senders need to be added to your SPF record.',
      domainId,
      metadata: { spfFailRate, spfFailCount, totalVolume, orgName: feedback.reportMetadata.orgName },
    })
  }

  // High DKIM failure rate
  if (dkimFailRate > 0.1) {
    const severity: ActionItemSeverity = dkimFailRate > 0.5 ? 'critical' : dkimFailRate > 0.25 ? 'high' : 'medium'
    items.push({
      type: 'dkim_failure',
      severity,
      title: `DKIM failing for ${Math.round(dkimFailRate * 100)}% of emails`,
      description: `${dkimFailCount.toLocaleString()} out of ${totalVolume.toLocaleString()} emails are failing DKIM authentication from ${feedback.reportMetadata.orgName}.`,
      recommendation: 'Verify your DKIM keys are properly configured and that sending services have the correct DKIM signing setup. Check for key rotation issues.',
      domainId,
      metadata: { dkimFailRate, dkimFailCount, totalVolume, orgName: feedback.reportMetadata.orgName },
    })
  }

  // Unknown senders with high volume failures
  failingIps.forEach((data, ip) => {
    if (data.count >= 100) {
      items.push({
        type: 'suspicious_ip',
        severity: data.count >= 1000 ? 'critical' : 'high',
        title: `Suspicious sending IP: ${ip}`,
        description: `IP ${ip} sent ${data.count.toLocaleString()} emails that failed DMARC. ${data.spfFail ? 'SPF failed. ' : ''}${data.dkimFail ? 'DKIM failed.' : ''}`,
        recommendation: 'Investigate if this IP belongs to a legitimate sender. If not, consider adding it to your blocklist or reporting it.',
        sourceIp: ip,
        domainId,
        metadata: { failCount: data.count, spfFail: data.spfFail, dkimFail: data.dkimFail },
      })
    }
  })

  // DMARC policy recommendation
  if (feedback.policyPublished.p === 'none' && dmarcFailRate < 0.05 && totalVolume > 500) {
    items.push({
      type: 'policy_recommendation',
      severity: 'medium',
      title: 'Consider upgrading DMARC policy to quarantine',
      description: `Your DMARC policy is currently set to "none" (monitor only), but your failure rate is only ${Math.round(dmarcFailRate * 100)}%. With ${totalVolume.toLocaleString()} emails analyzed, you may be ready for enforcement.`,
      recommendation: 'Move your DMARC policy from p=none to p=quarantine to start protecting against spoofing. Monitor for a period before moving to p=reject.',
      domainId,
      metadata: { currentPolicy: feedback.policyPublished.p, dmarcFailRate },
    })
  }

  // Significant rejection happening
  if (rejectCount > 0 && rejectCount / totalVolume > 0.05) {
    items.push({
      type: 'config_issue',
      severity: 'high',
      title: `${Math.round((rejectCount / totalVolume) * 100)}% of emails being rejected`,
      description: `${rejectCount.toLocaleString()} emails are being rejected by receiving servers. This directly impacts your email delivery and business communication.`,
      recommendation: 'Review the failing sources to determine if they are legitimate senders that need proper authentication, or if this rejection is working as intended for unauthorized senders.',
      domainId,
      metadata: { rejectCount, rejectRate: rejectCount / totalVolume },
    })
  }

  // Write action items to database (avoid duplicates by checking for recent similar items)
  for (const item of items) {
    const recentDuplicate = await prisma.actionItem.findFirst({
      where: {
        tenantId,
        domainId: item.domainId || null,
        type: item.type,
        sourceIp: item.sourceIp || null,
        status: { in: ['open', 'acknowledged'] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days
      },
    })

    if (!recentDuplicate) {
      await prisma.actionItem.create({
        data: {
          tenantId,
          domainId: item.domainId || null,
          type: item.type,
          severity: item.severity,
          title: item.title,
          description: item.description,
          recommendation: item.recommendation,
          sourceIp: item.sourceIp || null,
          metadata: item.metadata ? JSON.stringify(item.metadata) : null,
        },
      })
    }
  }
}

/**
 * Lists action items for a tenant.
 */
export async function listActionItems(
  tenantId: string,
  options?: { status?: string; severity?: string; limit?: number }
) {
  const where: any = { tenantId }
  if (options?.status) where.status = options.status
  if (options?.severity) where.severity = options.severity

  return prisma.actionItem.findMany({
    where,
    orderBy: [
      { severity: 'asc' }, // critical first
      { createdAt: 'desc' },
    ],
    take: options?.limit || 50,
  })
}

/**
 * Updates action item status.
 */
export async function updateActionItemStatus(
  actionItemId: string,
  tenantId: string,
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
) {
  const item = await prisma.actionItem.findFirst({
    where: { id: actionItemId, tenantId },
  })

  if (!item) return null

  return prisma.actionItem.update({
    where: { id: actionItemId },
    data: {
      status,
      resolvedAt: status === 'resolved' ? new Date() : null,
    },
  })
}

/**
 * Gets action item counts by severity for a tenant.
 */
export async function getActionItemCounts(tenantId: string) {
  const items = await prisma.actionItem.findMany({
    where: { tenantId, status: { in: ['open', 'acknowledged'] } },
    select: { severity: true },
  })

  return {
    open: items.length,
    critical: items.filter((i) => i.severity === 'critical').length,
    high: items.filter((i) => i.severity === 'high').length,
    medium: items.filter((i) => i.severity === 'medium').length,
    low: items.filter((i) => i.severity === 'low').length,
  }
}
