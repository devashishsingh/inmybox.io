import { prisma } from '@/lib/prisma'

/**
 * Lists all domains for a tenant.
 */
export async function listDomains(tenantId: string) {
  return prisma.domain.findMany({
    where: { tenantId },
    include: {
      _count: { select: { reports: true, senders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Adds a domain to a tenant. Returns null if already exists.
 */
export async function addDomain(tenantId: string, domainName: string) {
  const normalized = domainName.trim().toLowerCase()

  const existing = await prisma.domain.findUnique({
    where: { domain_tenantId: { domain: normalized, tenantId } },
  })

  if (existing) return null

  return prisma.domain.create({
    data: {
      domain: normalized,
      tenantId,
    },
  })
}

/**
 * Finds or creates a domain within a tenant.
 */
export async function findOrCreateDomain(tenantId: string, domainName: string) {
  const normalized = domainName.trim().toLowerCase()

  const existing = await prisma.domain.findUnique({
    where: { domain_tenantId: { domain: normalized, tenantId } },
  })

  if (existing) return existing

  return prisma.domain.create({
    data: {
      domain: normalized,
      tenantId,
    },
  })
}

/**
 * Gets domain IDs for a tenant.
 */
export async function getDomainIds(tenantId: string): Promise<string[]> {
  const domains = await prisma.domain.findMany({
    where: { tenantId },
    select: { id: true },
  })
  return domains.map((d) => d.id)
}

/**
 * Removes a domain and cascades deletion.
 */
export async function removeDomain(tenantId: string, domainId: string) {
  const domain = await prisma.domain.findFirst({
    where: { id: domainId, tenantId },
  })

  if (!domain) return null

  return prisma.domain.delete({ where: { id: domainId } })
}
