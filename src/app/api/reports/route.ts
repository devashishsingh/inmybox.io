import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getDomainIds } from '@/lib/services/domain.service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ reports: [] })
  }

  const domainIds = await getDomainIds(ctx.tenantId)

  const reports = await prisma.dmarcReport.findMany({
    where: { domainId: { in: domainIds } },
    include: {
      domain: true,
      _count: { select: { records: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ reports })
}
