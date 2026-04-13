import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { listSenders, updateSenderStatus, bulkUpdateSenders, suggestTagsFromSubnet } from '@/lib/services/sender.service'
import { enrichIp } from '@/lib/services/ip-enrichment.service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
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

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()

  // Bulk update: { ids: string[], status?: string, tags?: string }
  if (Array.isArray(body.ids)) {
    if (body.ids.length > 100) {
      return NextResponse.json({ error: 'Max 100 senders per bulk update' }, { status: 400 })
    }
    const count = await bulkUpdateSenders(body.ids, ctx.tenantId, {
      status: body.status,
      tags: body.tags,
    })
    return NextResponse.json({ updated: count })
  }

  // Single update (backwards-compatible)
  const { searchParams } = new URL(req.url)
  const senderId = searchParams.get('id')

  if (!senderId) {
    return NextResponse.json({ error: 'Sender ID required' }, { status: 400 })
  }

  const updated = await updateSenderStatus(senderId, ctx.tenantId, {
    status: body.status,
    label: body.label,
    notes: body.notes,
    tags: body.tags,
  })

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ sender: updated })
}

// PUT — tag suggestions for a sender IP
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { ip, domainId } = body

  if (!ip || !domainId) {
    return NextResponse.json({ error: 'ip and domainId required' }, { status: 400 })
  }

  const suggestions = await suggestTagsFromSubnet(ip, domainId)
  return NextResponse.json({ suggestions })
}

// POST — live WHOIS/IP enrichment lookup
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { ip } = body

  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: 'IP address required' }, { status: 400 })
  }

  // Basic IP format validation
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && !/^[0-9a-f:]+$/i.test(ip)) {
    return NextResponse.json({ error: 'Invalid IP format' }, { status: 400 })
  }

  try {
    const enrichment = await enrichIp(ip, true) // force fresh lookup
    return NextResponse.json({ enrichment })
  } catch (err: any) {
    console.error('[senders] IP enrichment lookup failed:', err.message)
    // INMYBOX ENHANCEMENT: C5 — do not expose raw error details to client
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
