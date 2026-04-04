import { NextRequest, NextResponse } from 'next/server'
import { validateInvitationToken, acceptInvitation } from '@/lib/services/invitation.service'
import { z } from 'zod'

// GET /api/invite/accept?token=xxx — validate token
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const result = await validateInvitationToken(token)
  return NextResponse.json(result)
}

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// POST /api/invite/accept — accept invitation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = acceptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const result = await acceptInvitation(parsed.data)

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      tenant: { id: result.tenant.id, name: result.tenant.name },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
