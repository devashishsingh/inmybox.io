import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantContext } from '@/lib/services/tenant.service'
import { fetchAndProcessEmails } from '@/lib/services/email-fetcher.service'

/**
 * GET /api/pipeline
 * Returns the current tenant's polling config + last-fetch summary.
 */
export async function GET() {
  const ctx = await requireTenantContext()
  if (ctx instanceof NextResponse) return ctx

  const pipeline = await prisma.pipelineConfig.findUnique({
    where: { tenantId: ctx.tenantId },
  })

  const lastPoll = await prisma.pollingHistory.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    pipeline: pipeline ?? null,
    lastPoll: lastPoll ?? null,
  })
}

/**
 * POST /api/pipeline
 * Body: { action: 'start'|'stop'|'fetch_now'|'update', pollIntervalMinutes?, durationDays? }
 * - start: enable + set interval/duration (defaults: 5 min, indefinite)
 * - stop:  disable
 * - update: change interval/duration without toggling
 * - fetch_now: trigger an immediate fetch (also auto-starts pipeline if disabled)
 */
export async function POST(req: NextRequest) {
  const ctx = await requireTenantContext()
  if (ctx instanceof NextResponse) return ctx

  const body = (await req.json().catch(() => ({}))) as {
    action?: string
    pollIntervalMinutes?: number
    durationDays?: number | null
  }

  const action = body.action || 'update'
  const tenantId = ctx.tenantId
  const now = new Date()

  if (action === 'start') {
    const intervalMin = body.pollIntervalMinutes && body.pollIntervalMinutes >= 1
      ? body.pollIntervalMinutes : 5
    const expiresAt = body.durationDays && body.durationDays > 0
      ? new Date(now.getTime() + body.durationDays * 24 * 60 * 60 * 1000)
      : null

    const pipeline = await prisma.pipelineConfig.upsert({
      where: { tenantId },
      update: {
        enabled: true,
        pollIntervalMinutes: intervalMin,
        startedAt: now,
        expiresAt,
        stoppedAt: null,
        stoppedReason: null,
      },
      create: {
        tenantId,
        enabled: true,
        pollIntervalMinutes: intervalMin,
        startedAt: now,
        expiresAt,
      },
    })
    return NextResponse.json({ success: true, pipeline })
  }

  if (action === 'stop') {
    const pipeline = await prisma.pipelineConfig.upsert({
      where: { tenantId },
      update: { enabled: false, stoppedAt: now, stoppedReason: 'manual' },
      create: { tenantId, enabled: false, stoppedAt: now, stoppedReason: 'manual' },
    })
    return NextResponse.json({ success: true, pipeline })
  }

  if (action === 'update') {
    const data: any = {}
    if (typeof body.pollIntervalMinutes === 'number' && body.pollIntervalMinutes >= 1) {
      data.pollIntervalMinutes = body.pollIntervalMinutes
    }
    if (body.durationDays === null) {
      data.expiresAt = null
    } else if (typeof body.durationDays === 'number' && body.durationDays > 0) {
      data.expiresAt = new Date(now.getTime() + body.durationDays * 24 * 60 * 60 * 1000)
    }
    const pipeline = await prisma.pipelineConfig.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, enabled: false, ...data },
    })
    return NextResponse.json({ success: true, pipeline })
  }

  if (action === 'fetch_now') {
    // Auto-enable pipeline if not already enabled
    await prisma.pipelineConfig.upsert({
      where: { tenantId },
      update: { enabled: true, stoppedAt: null, stoppedReason: null },
      create: {
        tenantId,
        enabled: true,
        pollIntervalMinutes: 5,
        startedAt: now,
      },
    })

    let fetchResult = null
    let error: string | undefined
    try {
      fetchResult = await fetchAndProcessEmails()
    } catch (err: any) {
      console.error('[pipeline:fetch_now] error:', err.message)
      error = err.message || 'Fetch failed'
    }

    // Update last-fetch timestamp
    if (fetchResult && !error) {
      await prisma.pipelineConfig.update({
        where: { tenantId },
        data: { lastFetchAt: now, fetchCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: !error, fetchResult, error })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
