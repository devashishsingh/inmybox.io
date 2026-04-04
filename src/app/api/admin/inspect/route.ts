import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'

// GET /api/admin/inspect — inspect tenant dashboard data
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')
  const section = url.searchParams.get('section') || 'overview'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  switch (section) {
    case 'overview': {
      const [domains, reportCount, senderCount, actionItemCount, lastLog] = await Promise.all([
        prisma.domain.findMany({
          where: { tenantId },
          include: { _count: { select: { reports: true, senders: true } } },
        }),
        prisma.dmarcReport.count({
          where: { domain: { tenantId } },
        }),
        prisma.sender.count({
          where: { domain: { tenantId } },
        }),
        prisma.actionItem.count({
          where: { tenantId, status: 'open' },
        }),
        prisma.ingestionLog.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }),
      ])

      return NextResponse.json({
        tenant,
        domains,
        reportCount,
        senderCount,
        openActionItems: actionItemCount,
        lastIngestion: lastLog,
      })
    }

    case 'senders': {
      const senders = await prisma.sender.findMany({
        where: { domain: { tenantId } },
        include: {
          classification: true,
          domain: { select: { domain: true } },
        },
        orderBy: { totalVolume: 'desc' },
        take: 100,
      })
      return NextResponse.json(senders)
    }

    case 'action-items': {
      const items = await prisma.actionItem.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json(items)
    }

    case 'ingestion': {
      const logs = await prisma.ingestionLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json(logs)
    }

    default:
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  }
}
