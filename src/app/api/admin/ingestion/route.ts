import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'

// GET /api/admin/ingestion — ingestion monitoring
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined
  const tenantId = url.searchParams.get('tenantId') || undefined
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tenantId) where.tenantId = tenantId

  const [logs, total] = await Promise.all([
    prisma.ingestionLog.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ingestionLog.count({ where }),
  ])

  // Get summary stats
  const [totalLogs, failedCount, processingCount] = await Promise.all([
    prisma.ingestionLog.count(),
    prisma.ingestionLog.count({ where: { status: 'failed' } }),
    prisma.ingestionLog.count({ where: { status: 'processing' } }),
  ])

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    summary: {
      total: totalLogs,
      failed: failedCount,
      processing: processingCount,
    },
  })
}

// PATCH /api/admin/ingestion — reprocess a report
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { logId, action } = body

    if (!logId || action !== 'reprocess') {
      return NextResponse.json({ error: 'logId and action=reprocess required' }, { status: 400 })
    }

    // Reset status to pending for reprocessing
    await prisma.ingestionLog.update({
      where: { id: logId },
      data: { status: 'pending', errorMessage: null },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
