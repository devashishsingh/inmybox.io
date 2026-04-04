import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Creates an invitation for a tenant.
 */
export async function createInvitation(params: {
  email: string
  tenantId: string
  role?: string
  invitedById?: string
}) {
  const { email, tenantId, role = 'admin', invitedById } = params

  // Check for existing active invitation
  const existing = await prisma.invitation.findFirst({
    where: {
      email,
      tenantId,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
  })

  if (existing) {
    throw new Error('An active invitation already exists for this email')
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: { userId_tenantId: { userId: existingUser.id, tenantId } },
    })
    if (existingMembership) {
      throw new Error('This user is already a member of this tenant')
    }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  return prisma.invitation.create({
    data: {
      email,
      tenantId,
      role,
      token,
      invitedById,
      expiresAt,
    },
  })
}

/**
 * Accepts an invitation — creates user if needed, adds membership.
 */
export async function acceptInvitation(params: {
  token: string
  name: string
  password: string
}) {
  const { token, name, password } = params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { tenant: true },
  })

  if (!invitation) {
    throw new Error('Invalid invitation token')
  }

  if (invitation.status !== 'pending') {
    throw new Error('This invitation has already been used or revoked')
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('This invitation has expired')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  return prisma.$transaction(async (tx) => {
    // Find or create user
    let user = await tx.user.findUnique({ where: { email: invitation.email } })

    if (!user) {
      user = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name,
          role: 'user',
        },
      })
    }

    // Create membership
    await tx.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId: invitation.tenantId,
        role: invitation.role,
      },
    })

    // Mark invitation accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    return { user, tenant: invitation.tenant }
  })
}

/**
 * Resends an invitation by generating a new token.
 */
export async function resendInvitation(invitationId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  })

  if (!invitation) throw new Error('Invitation not found')

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      token,
      expiresAt,
      status: 'pending',
    },
  })
}

/**
 * Revokes an invitation.
 */
export async function revokeInvitation(invitationId: string) {
  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' },
  })
}

/**
 * Lists invitations for a tenant.
 */
export async function listInvitations(tenantId: string) {
  return prisma.invitation.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Validates an invitation token (for accept page).
 */
export async function validateInvitationToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { tenant: { select: { name: true, slug: true } } },
  })

  if (!invitation) return { valid: false, error: 'Invalid token' }
  if (invitation.status !== 'pending') return { valid: false, error: 'Invitation already used' }
  if (invitation.expiresAt < new Date()) return { valid: false, error: 'Invitation expired' }

  return {
    valid: true,
    email: invitation.email,
    tenantName: invitation.tenant.name,
    role: invitation.role,
  }
}
