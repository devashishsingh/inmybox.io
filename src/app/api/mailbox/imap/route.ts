import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/crypto'

/**
 * POST /api/mailbox/imap
 * Store an IMAP connection credential for manual (non-OAuth) mailboxes.
 *
 * Body: { host, port, user, password, useTls }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  }

  const body = await req.json()
  const { host, port, user, password } = body as {
    host: string
    port: number
    user: string
    password: string
  }

  if (!host || !port || !user || !password) {
    return NextResponse.json({ error: 'host, port, user, and password are required' }, { status: 400 })
  }

  // Basic input validation
  if (typeof host !== 'string' || !/^[\w.-]+$/.test(host)) {
    return NextResponse.json({ error: 'Invalid host' }, { status: 400 })
  }
  if (typeof port !== 'number' || port < 1 || port > 65535) {
    return NextResponse.json({ error: 'Invalid port' }, { status: 400 })
  }

  // Test connection before saving
  try {
    const { ImapFlow } = await import('imapflow')
    const client = new ImapFlow({
      host,
      port,
      secure: port === 993,
      auth: { user, pass: password },
      logger: false,
    })
    await client.connect()
    await client.logout()
  } catch (err: any) {
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 422 })
  }

  await prisma.mailboxConnection.upsert({
    where: { tenantId: ctx.tenantId },
    create: {
      tenantId: ctx.tenantId,
      provider: 'imap',
      email: user,
      imapHost: host,
      imapPort: port,
      imapUser: user,
      imapPass: encrypt(password),
      status: 'active',
    },
    update: {
      provider: 'imap',
      email: user,
      imapHost: host,
      imapPort: port,
      imapUser: user,
      imapPass: encrypt(password),
      status: 'active',
      errorMessage: null,
    },
  })

  await prisma.onboardingChecklist.upsert({
    where: { tenantId: ctx.tenantId },
    create: { tenantId: ctx.tenantId, wizardStep: 3 },
    update: { wizardStep: 3 },
  })

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/mailbox/imap — disconnect (handled via /api/mailbox/disconnect, kept for symmetry)
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  }

  await prisma.mailboxConnection.deleteMany({ where: { tenantId: ctx.tenantId } })
  return NextResponse.json({ ok: true })
}
