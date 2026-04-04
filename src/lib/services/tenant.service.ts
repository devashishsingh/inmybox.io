import { prisma } from '@/lib/prisma'
import type { TenantContext } from '@/types'

/**
 * Resolves tenant context from a user session.
 * Returns the first tenant the user is a member of.
 */
export async function resolveTenantContext(userId: string): Promise<TenantContext | null> {
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId },
    include: { tenant: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) return null

  return {
    tenantId: membership.tenantId,
    userId,
    role: membership.role,
  }
}

/**
 * Check if a user is a super admin.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.role === 'super_admin'
}

/**
 * Creates a new tenant with the given user as owner.
 */
export async function createTenant(params: {
  name: string
  slug: string
  userId: string
  emailAlias?: string
}) {
  const { name, slug, userId, emailAlias } = params

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
      },
    })

    await tx.tenantMembership.create({
      data: {
        userId,
        tenantId: tenant.id,
        role: 'owner',
      },
    })

    await tx.tenantSettings.create({
      data: {
        tenantId: tenant.id,
      },
    })

    // Create alias mapping if provided
    if (emailAlias) {
      await tx.aliasMapping.create({
        data: {
          alias: emailAlias,
          tenantId: tenant.id,
        },
      })
    }

    // Create onboarding checklist
    await tx.onboardingChecklist.create({
      data: {
        tenantId: tenant.id,
      },
    })

    return tenant
  })
}

/**
 * Gets full tenant data with domains, settings, and member count.
 */
export async function getTenantWithDetails(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      domains: true,
      settings: true,
      aliases: true,
      onboarding: true,
      _count: { select: { memberships: true } },
    },
  })
}

/**
 * Verifies a user has access to a specific tenant.
 */
export async function verifyTenantAccess(
  userId: string,
  tenantId: string
): Promise<{ hasAccess: boolean; role: string | null }> {
  const membership = await prisma.tenantMembership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  })

  return {
    hasAccess: !!membership,
    role: membership?.role || null,
  }
}

/**
 * Generates a URL-safe slug from a tenant name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/**
 * Resolves a tenant from an email alias (for email ingestion routing).
 */
export async function resolveTenantByEmailAlias(alias: string) {
  const mapping = await prisma.aliasMapping.findUnique({
    where: { alias },
    include: { tenant: { include: { domains: true } } },
  })
  return mapping?.tenant || null
}
