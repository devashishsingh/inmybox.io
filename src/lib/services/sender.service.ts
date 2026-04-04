import { prisma } from '@/lib/prisma'
import type { DmarcRecordParsed } from '@/types'

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

  return prisma.sender.findMany({
    where: { domainId: { in: domainIds } },
    include: {
      classification: true,
      domain: { select: { domain: true } },
    },
    orderBy: { totalVolume: 'desc' },
  })
}

/**
 * Updates sender status and label.
 */
export async function updateSenderStatus(
  senderId: string,
  tenantId: string,
  data: { status?: string; label?: string; notes?: string }
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
