import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '@/lib/services/invitation.service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createInviteSchema = z.object({
  email: z.string().email('Valid email required'),
  tenantId: z.string().min(1),
  role: z.enum(['admin', 'viewer']).optional(),
})

// GET /api/admin/invitations
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')

  if (tenantId) {
    const invitations = await listInvitations(tenantId)
    return NextResponse.json(invitations)
  }

  // List all invitations across tenants
  const invitations = await prisma.invitation.findMany({
    include: { tenant: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(invitations)
}

// POST /api/admin/invitations
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createInviteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const invitation = await createInvitation({
      ...parsed.data,
      invitedById: auth.userId,
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH /api/admin/invitations — resend or revoke
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { invitationId, action } = body

    if (!invitationId || !action) {
      return NextResponse.json({ error: 'invitationId and action required' }, { status: 400 })
    }

    if (action === 'resend') {
      const invitation = await resendInvitation(invitationId)
      return NextResponse.json({
        success: true,
        invitation: { id: invitation.id, token: invitation.token, expiresAt: invitation.expiresAt },
      })
    }

    if (action === 'revoke') {
      await revokeInvitation(invitationId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
