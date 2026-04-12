import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { listActionItems, updateActionItemStatus } from '@/lib/services/action-items.service'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ actionItems: [] })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const severity = searchParams.get('severity') || undefined

  const actionItems = await listActionItems(ctx.tenantId, { status, severity })
  return NextResponse.json({ actionItems })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const validStatuses = ['open', 'acknowledged', 'resolved', 'dismissed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await updateActionItemStatus(id, ctx.tenantId, status)

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ actionItem: updated })
}
