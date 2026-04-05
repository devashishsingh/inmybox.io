import { prisma } from '@/lib/prisma'
import { generateSlug } from './tenant.service'
import crypto from 'crypto'

interface ProvisionTenantParams {
  companyName: string
  contactEmail: string
  primaryDomain: string
  reportAlias?: string
  timezone?: string
  plan?: string
  notes?: string
  inviteEmail?: string
}

/**
 * Full tenant provisioning workflow.
 * Creates: tenant, settings, primary domain, alias mapping, onboarding checklist, and optional invitation.
 */
export async function provisionTenant(params: ProvisionTenantParams) {
  const {
    companyName,
    contactEmail,
    primaryDomain,
    reportAlias,
    timezone = 'UTC',
    plan = 'free',
    notes,
    inviteEmail,
  } = params

  const slug = generateSlug(companyName)

  // Check slug uniqueness
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) {
    throw new Error(`Tenant slug "${slug}" already exists`)
  }

  // Check alias uniqueness if provided
  if (reportAlias) {
    const existingAlias = await prisma.aliasMapping.findUnique({ where: { alias: reportAlias } })
    if (existingAlias) {
      throw new Error(`Alias "${reportAlias}" is already assigned`)
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        contactEmail,
        timezone,
        plan,
        notes,
        status: 'active',
      },
    })

    // 2. Create default settings
    await tx.tenantSettings.create({
      data: { tenantId: tenant.id },
    })

    // 3. Create primary domain
    const domain = await tx.domain.create({
      data: {
        domain: primaryDomain.toLowerCase(),
        tenantId: tenant.id,
        isPrimary: true,
        dmarcSetupStatus: 'pending',
      },
    })

    // 4. Create alias mapping
    let alias = null
    if (reportAlias) {
      alias = await tx.aliasMapping.create({
        data: {
          alias: reportAlias,
          tenantId: tenant.id,
        },
      })
    }

    // 5. Create onboarding checklist
    const onboarding = await tx.onboardingChecklist.create({
      data: {
        tenantId: tenant.id,
        domainAdded: true,
        aliasAssigned: !!reportAlias,
      },
    })

    // 6. Create invitation if invite email provided
    let invitation = null
    if (inviteEmail) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      invitation = await tx.invitation.create({
        data: {
          email: inviteEmail,
          tenantId: tenant.id,
          role: 'admin',
          token,
          expiresAt,
        },
      })
    }

    return {
      tenant,
      domain,
      alias,
      onboarding,
      invitation,
    }
  })
}

/**
 * Lists all tenants with summary data for admin panel.
 */
export async function listTenantsForAdmin(params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  const { search, status, page = 1, limit = 25 } = params || {}

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { contactEmail: { contains: search } },
    ]
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        domains: { select: { id: true, domain: true, isPrimary: true } },
        aliases: { select: { id: true, alias: true, isActive: true } },
        pipeline: { select: { enabled: true, pollIntervalMinutes: true, startedAt: true, expiresAt: true, stoppedAt: true, lastFetchAt: true } },
        _count: {
          select: {
            memberships: true,
            ingestionLogs: true,
            actionItems: true,
          },
        },
        onboarding: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ])

  return { tenants, total, page, limit }
}

/**
 * Gets full tenant details for admin inspection.
 */
export async function getTenantForAdmin(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      domains: true,
      settings: true,
      aliases: true,
      onboarding: true,
      pipeline: true,
      memberships: {
        include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
      },
      invitations: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          ingestionLogs: true,
          rawFiles: true,
          actionItems: true,
        },
      },
    },
  })
}

/**
 * Updates tenant details.
 */
export async function updateTenant(
  tenantId: string,
  data: {
    name?: string
    contactEmail?: string
    status?: string
    plan?: string
    timezone?: string
    notes?: string
  }
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data,
  })
}
