import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { listSenders, updateSenderStatus } from '@/lib/services/sender.service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ senders: [] })
  }

  const senders = await listSenders(ctx.tenantId)
  return NextResponse.json({ senders })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const senderId = searchParams.get('id')

  if (!senderId) {
    return NextResponse.json({ error: 'Sender ID required' }, { status: 400 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()

  const updated = await updateSenderStatus(senderId, ctx.tenantId, {
    status: body.status,
    label: body.label,
    notes: body.notes,
  })

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ sender: updated })
}
