import { prisma } from '@/lib/prisma'

/**
 * Creates a new alias mapping for a tenant.
 */
export async function createAlias(params: {
  alias: string
  tenantId: string
  notes?: string
}) {
  const { alias, tenantId, notes } = params

  const existing = await prisma.aliasMapping.findUnique({ where: { alias } })
  if (existing) {
    throw new Error(`Alias "${alias}" is already in use`)
  }

  const mapping = await prisma.aliasMapping.create({
    data: { alias, tenantId, notes },
  })

  // Update onboarding checklist
  await prisma.onboardingChecklist.updateMany({
    where: { tenantId },
    data: { aliasAssigned: true },
  })

  return mapping
}

/**
 * Lists all alias mappings.
 */
export async function listAliases(params?: { tenantId?: string }) {
  const where: Record<string, unknown> = {}
  if (params?.tenantId) where.tenantId = params.tenantId

  return prisma.aliasMapping.findMany({
    where,
    include: { tenant: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Updates an alias mapping.
 */
export async function updateAlias(
  aliasId: string,
  data: { alias?: string; isActive?: boolean; notes?: string }
) {
  if (data.alias) {
    const existing = await prisma.aliasMapping.findFirst({
      where: { alias: data.alias, id: { not: aliasId } },
    })
    if (existing) throw new Error(`Alias "${data.alias}" is already in use`)
  }

  return prisma.aliasMapping.update({
    where: { id: aliasId },
    data,
  })
}

/**
 * Deletes an alias mapping.
 */
export async function deleteAlias(aliasId: string) {
  return prisma.aliasMapping.delete({ where: { id: aliasId } })
}

/**
 * Resolves tenant from alias (for incoming email routing).
 */
export async function resolveAlias(alias: string) {
  const mapping = await prisma.aliasMapping.findUnique({
    where: { alias },
    include: { tenant: { include: { domains: true } } },
  })

  if (!mapping || !mapping.isActive) return null
  return mapping.tenant
}
