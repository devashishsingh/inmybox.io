import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { fetchAndProcessEmails } from '@/lib/services/email-fetcher.service'

// POST /api/admin/tenants/[id]/pipeline — start/stop/renew pipeline
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const body = await req.json()
  const { action, durationDays, pollIntervalMinutes } = body as {
    action: string
    durationDays?: number
    pollIntervalMinutes?: number
  }

  if (action === 'start' || action === 'renew') {
    const now = new Date()
    const expiresAt = durationDays
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null // unlimited

    const intervalMin = pollIntervalMinutes && pollIntervalMinutes >= 1
      ? pollIntervalMinutes : 1440

    const pipeline = await prisma.pipelineConfig.upsert({
      where: { tenantId: params.id },
      update: {
        enabled: true,
        pollIntervalMinutes: intervalMin,
        startedAt: now,
        expiresAt,
        stoppedAt: null,
        stoppedReason: null,
        notifiedAt: null,
        createdBy: (auth as { userId: string }).userId,
      },
      create: {
        tenantId: params.id,
        enabled: true,
        pollIntervalMinutes: intervalMin,
        startedAt: now,
        expiresAt,
        createdBy: (auth as { userId: string }).userId,
      },
    })

    // Immediately trigger email fetch so new reports are picked up right away
    let fetchResult = null
    try {
      fetchResult = await fetchAndProcessEmails()
    } catch (err: any) {
      console.error('[pipeline] Auto-fetch after start failed:', err.message)
    }

    return NextResponse.json({
      success: true,
      action,
      pipeline,
      fetchResult,
      message: expiresAt
        ? `Pipeline started — expires ${expiresAt.toLocaleDateString()}`
        : 'Pipeline started — runs indefinitely',
    })
  }

  if (action === 'stop') {
    const pipeline = await prisma.pipelineConfig.upsert({
      where: { tenantId: params.id },
      update: {
        enabled: false,
        stoppedAt: new Date(),
        stoppedReason: 'manual',
      },
      create: {
        tenantId: params.id,
        enabled: false,
        stoppedAt: new Date(),
        stoppedReason: 'manual',
      },
    })

    return NextResponse.json({
      success: true,
      action: 'stop',
      pipeline,
      message: 'Pipeline stopped',
    })
  }

  if (action === 'update_interval') {
    const intervalMin = pollIntervalMinutes && pollIntervalMinutes >= 1
      ? pollIntervalMinutes : 1440

    const pipeline = await prisma.pipelineConfig.update({
      where: { tenantId: params.id },
      data: { pollIntervalMinutes: intervalMin },
    })

    return NextResponse.json({
      success: true,
      action: 'update_interval',
      pipeline,
      message: `Poll interval updated to ${intervalMin} minutes`,
    })
  }

  return NextResponse.json({ error: 'Invalid action. Use: start, stop, renew, update_interval' }, { status: 400 })
}

// GET /api/admin/tenants/[id]/pipeline — get pipeline status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const pipeline = await prisma.pipelineConfig.findUnique({
    where: { tenantId: params.id },
  })

  if (!pipeline) {
    return NextResponse.json({
      enabled: false,
      status: 'not_configured',
      tenantId: params.id,
    })
  }

  // Calculate status
  const now = new Date()
  let status = 'stopped'
  let daysRemaining: number | null = null

  if (pipeline.enabled) {
    if (pipeline.expiresAt) {
      const remaining = pipeline.expiresAt.getTime() - now.getTime()
      daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000))

      if (daysRemaining <= 0) {
        status = 'expired'
      } else if (daysRemaining <= 3) {
        status = 'expiring_soon'
      } else {
        status = 'active'
      }
    } else {
      status = 'active'
      daysRemaining = null // unlimited
    }
  }

  return NextResponse.json({
    ...pipeline,
    status,
    daysRemaining,
  })
}
