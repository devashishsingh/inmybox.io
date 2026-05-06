import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/mailbox/disconnect
 * Removes the stored mailbox connection for the session tenant.
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

  const deleted = await prisma.mailboxConnection.deleteMany({
    where: { tenantId: ctx.tenantId },
  })

  return NextResponse.json({ ok: true, deleted: deleted.count })
}
