import { prisma } from '@/lib/prisma'
import type { DmarcRecordParsed } from '@/types'

// ─── SUBNET UTILITIES ───────────────────────────────────────────────

function getSubnet(ip: string, mask: number = 24): string {
  const parts = ip.split('.')
  if (parts.length !== 4) return ip // IPv6 or invalid — return as-is
  const fullBits = parts.map(Number)
  const maskBlocks = Math.floor(mask / 8)
  return fullBits.slice(0, maskBlocks).join('.') + '.0'.repeat(4 - maskBlocks)
}

/**
 * Suggests tags for a sender based on subnet neighbors.
 * If other senders on the same /24 share a tag, suggest it.
 */
export async function suggestTagsFromSubnet(ip: string, domainId: string): Promise<string[]> {
  const subnet = getSubnet(ip)
  const prefix = subnet.replace(/\.0$/, '.')
  const neighbors = await prisma.sender.findMany({
    where: { domainId, ip: { startsWith: prefix }, tags: { not: null } },
    select: { tags: true },
  })
  const tagCounts = new Map<string, number>()
  for (const n of neighbors) {
    if (n.tags) {
      for (const t of n.tags.split(',').map(s => s.trim()).filter(Boolean)) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
      }
    }
  }
  return Array.from(tagCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
}

/**
 * Auto-classifies a sender based on enrichment data (provider, ASN, etc).
 */
export async function autoClassifyFromEnrichment(senderId: string): Promise<void> {
  const sender = await prisma.sender.findUnique({ where: { id: senderId }, include: { classification: true } })
  if (!sender) return
  // Skip if already manually classified
  if (sender.classification && !sender.classification.autoClassified) return

  const { batchEnrichIps } = await import('./ip-enrichment.service')
  const enrichments = await prisma.ipEnrichment.findMany({ where: { ip: sender.ip } })
  const enrichment = enrichments[0]
  if (!enrichment) return

  let category = 'unknown'
  let provider = enrichment.provider || enrichment.asnOrg || null
  let confidence = 0.4

  if (enrichment.isKnownSender) {
    const providerLower = (provider || '').toLowerCase()
    if (/mailchimp|sendgrid|constant contact|hubspot|campaign monitor/i.test(providerLower)) {
      category = 'marketing'
      confidence = 0.85
    } else if (/postmark|sparkpost|mailgun|amazon ses/i.test(providerLower)) {
      category = 'transactional'
      confidence = 0.8
    } else if (/google|microsoft|outlook/i.test(providerLower)) {
      category = 'legitimate'
      confidence = 0.9
    } else {
      category = 'legitimate'
      confidence = 0.65
    }
  } else if (enrichment.providerType === 'hosting') {
    category = 'unknown'
    confidence = 0.3
  }

  // Only update if confidence is higher than existing
  if (sender.classification && sender.classification.confidence >= confidence) return

  await prisma.senderClassification.upsert({
    where: { senderId },
    create: { senderId, category, provider, confidence, autoClassified: true, isFirstPartySender: false },
    update: { category, provider, confidence, autoClassified: true },
  })
}

/**
 * Updates or creates a sender record based on a DMARC record.
 */
export async function updateSenderFromRecord(
  domainId: string,
  record: DmarcRecordParsed,
  dateEnd: number
) {
  const isFailing =
    record.spfResult === 'fail' || record.dkimResult === 'fail' || record.dmarcResult === 'fail'
  const isPassing =
    record.spfResult === 'pass' && record.dkimResult === 'pass' && record.dmarcResult === 'pass'

  await prisma.sender.upsert({
    where: {
      ip_domainId: {
        ip: record.sourceIp,
        domainId,
      },
    },
    create: {
      ip: record.sourceIp,
      domainId,
      totalVolume: record.count,
      passCount: isPassing ? record.count : 0,
      failCount: isFailing ? record.count : 0,
      lastSeen: new Date(dateEnd * 1000),
    },
    update: {
      totalVolume: { increment: record.count },
      passCount: { increment: isPassing ? record.count : 0 },
      failCount: { increment: isFailing ? record.count : 0 },
      lastSeen: new Date(dateEnd * 1000),
    },
  })
}

/**
 * Lists senders for a tenant's domains with optional classification data.
 */
export async function listSenders(tenantId: string) {
  const domains = await prisma.domain.findMany({
    where: { tenantId },
    select: { id: true },
  })
  const domainIds = domains.map((d) => d.id)

  const senders = await prisma.sender.findMany({
    where: { domainId: { in: domainIds } },
    include: {
      classification: true,
      domain: { select: { domain: true } },
    },
    orderBy: { totalVolume: 'desc' },
  })

  // Batch-fetch enrichment for all sender IPs, trigger lookup for missing ones
  const ips = senders.map((s) => s.ip)
  const enrichments = await prisma.ipEnrichment.findMany({
    where: { ip: { in: ips } },
  })
  const enrichmentMap = new Map(enrichments.map((e) => [e.ip, e]))

  // Trigger enrichment for IPs not yet cached (fire-and-forget)
  const uncachedIps = ips.filter((ip) => !enrichmentMap.has(ip))
  if (uncachedIps.length > 0) {
    const { batchEnrichIps } = await import('./ip-enrichment.service')
    batchEnrichIps(uncachedIps).catch((err) =>
      console.warn('[sender] background enrichment failed:', err.message)
    )
  }

  return senders.map((s) => ({
    ...s,
    enrichment: enrichmentMap.get(s.ip) || null,
  }))
}

/**
 * Updates sender status and label.
 */
export async function updateSenderStatus(
  senderId: string,
  tenantId: string,
  data: { status?: string; label?: string; notes?: string; tags?: string }
) {
  // Verify sender belongs to tenant
  const sender = await prisma.sender.findUnique({
    where: { id: senderId },
    include: { domain: true },
  })

  if (!sender || sender.domain.tenantId !== tenantId) return null

  const validStatuses = ['unknown', 'known', 'trusted', 'suspicious']
  const status = data.status && validStatuses.includes(data.status) ? data.status : undefined

  return prisma.sender.update({
    where: { id: senderId },
    data: {
      ...(status && { status }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  })
}

/**
 * Classifies a sender (auto or manual).
 */
export async function classifySender(
  senderId: string,
  classification: {
    category: string
    provider?: string
    confidence?: number
    isFirstPartySender?: boolean
    autoClassified?: boolean
  }
) {
  return prisma.senderClassification.upsert({
    where: { senderId },
    create: {
      senderId,
      category: classification.category,
      provider: classification.provider || null,
      confidence: classification.confidence || 0,
      isFirstPartySender: classification.isFirstPartySender || false,
      autoClassified: classification.autoClassified ?? true,
    },
    update: {
      category: classification.category,
      provider: classification.provider || null,
      confidence: classification.confidence || 0,
      isFirstPartySender: classification.isFirstPartySender || false,
      autoClassified: classification.autoClassified ?? true,
    },
  })
}

/**
 * Gets sender breakdown counts for a tenant.
 */
export async function getSenderBreakdown(tenantId: string) {
  const domains = await prisma.domain.findMany({
    where: { tenantId },
    select: { id: true },
  })
  const domainIds = domains.map((d) => d.id)

  const senders = await prisma.sender.findMany({
    where: { domainId: { in: domainIds } },
    select: { status: true },
  })

  return {
    known: senders.filter((s) => s.status === 'known').length,
    unknown: senders.filter((s) => s.status === 'unknown').length,
    suspicious: senders.filter((s) => s.status === 'suspicious').length,
    trusted: senders.filter((s) => s.status === 'trusted').length,
  }
}

/**
 * Bulk update status/tags for multiple senders. Verifies tenant ownership.
 */
export async function bulkUpdateSenders(
  senderIds: string[],
  tenantId: string,
  data: { status?: string; tags?: string }
): Promise<number> {
  if (senderIds.length === 0 || senderIds.length > 100) return 0

  const validStatuses = ['unknown', 'known', 'trusted', 'suspicious']
  const status = data.status && validStatuses.includes(data.status) ? data.status : undefined

  // Verify all senders belong to tenant
  const domains = await prisma.domain.findMany({ where: { tenantId }, select: { id: true } })
  const domainIds = domains.map((d) => d.id)

  const result = await prisma.sender.updateMany({
    where: {
      id: { in: senderIds },
      domainId: { in: domainIds },
    },
    data: {
      ...(status && { status }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  })

  return result.count
}
