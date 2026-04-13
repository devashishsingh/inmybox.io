// INMYBOX MVP IMPROVEMENT — Polling Architecture Upgrade — 2026-04-13
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { testConnection, fetchAndProcessEmails } from '@/lib/services/email-fetcher.service'
import { prisma } from '@/lib/prisma'

// ─── PLAN-BASED FREQUENCY TIERS ─────────────────────────────────────

const PLAN_FREQUENCY_LIMITS: Record<string, number[]> = {
  free:       [1440],                       // Daily only
  starter:    [360, 1440],                  // 6h, Daily
  pro:        [60, 360, 1440],              // 1h, 6h, Daily
  enterprise: [15, 60, 360, 1440],          // 15m, 1h, 6h, Daily
}

function getAllowedFrequencies(plan: string): number[] {
  return PLAN_FREQUENCY_LIMITS[plan] || PLAN_FREQUENCY_LIMITS.free
}

// ─── POLL LOCK (Database-backed) ─────────────────────────────────────

const LOCK_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function acquireLock(tenantId: string): Promise<boolean> {
  const now = new Date()
  await prisma.pollLock.deleteMany({ where: { expiresAt: { lt: now } } })
  try {
    await prisma.pollLock.create({
      data: { tenantId, lockedAt: now, expiresAt: new Date(now.getTime() + LOCK_TTL_MS) },
    })
    return true
  } catch {
    return false
  }
}

async function releaseLock(tenantId: string): Promise<void> {
  await prisma.pollLock.deleteMany({ where: { tenantId } })
}

// ─── RETRY WITH BACKOFF ──────────────────────────────────────────────

const RETRY_CONFIG = { maxAttempts: 3, backoffMs: [1000, 5000, 15000] }

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry() {
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await fetchAndProcessEmails()
    } catch (error) {
      if (attempt === RETRY_CONFIG.maxAttempts) throw error
      console.warn(`[cron] Poll attempt ${attempt} failed, retrying in ${RETRY_CONFIG.backoffMs[attempt - 1]}ms`)
      await sleep(RETRY_CONFIG.backoffMs[attempt - 1])
    }
  }
  throw new Error('All retry attempts exhausted')
}

// ─── POLLING HISTORY RECORDER ────────────────────────────────────────

async function recordPollRun(
  tenantId: string,
  status: 'success' | 'failed' | 'skipped',
  startedAt: Date,
  reportsFound?: number,
  reportsProcessed?: number,
  errorMessage?: string,
) {
  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()
  await prisma.pollingHistory.create({
    data: { tenantId, startedAt, completedAt, status, reportsFound: reportsFound ?? 0, reportsProcessed: reportsProcessed ?? 0, errorMessage, durationMs },
  })
}

/**
 * GET /api/cron/fetch-emails?action=test
 * Tests the IMAP connection and folder access.
 * 
 * POST /api/cron/fetch-emails
 * Smart cron: iterates ALL active pipelines, fetches only those
 * whose poll interval has elapsed since lastFetchAt.
 * Called by Vercel Cron (every minute) or the dev background worker.
 * 
 * Both require super_admin session OR a valid CRON_SECRET header.
 */

async function authorize(req: NextRequest): Promise<boolean> {
  // Check cron secret header (for external cron services / Vercel cron)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true
  }

  // INMYBOX ENHANCEMENT — Phase 4: Removed x-internal-cron bypass (was exploitable without CRON_SECRET)
  // In development without CRON_SECRET, require admin session instead

  // Check admin session
  const session = await getServerSession(authOptions)
  if (session?.user?.role === 'super_admin') {
    return true
  }

  return false
}

// GET — connection test
export async function GET(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = req.nextUrl.searchParams.get('action')

  if (action === 'test') {
    const result = await testConnection()
    return NextResponse.json(result)
  }

  return NextResponse.json({
    endpoints: {
      'GET ?action=test': 'Test IMAP connection',
      'POST': 'Fetch and process emails for all due pipelines',
    },
    config: {
      host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
      user: process.env.EMAIL_IMAP_USER ? '✓ configured' : '✗ missing',
      pass: process.env.EMAIL_IMAP_PASS ? '✓ configured' : '✗ missing',
      folder: process.env.EMAIL_FOLDER || 'dmarc_report',
    },
  })
}

// POST — smart cron: fetch for all due pipelines
export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  // Find all active pipelines that are due for a fetch
  const activePipelines = await prisma.pipelineConfig.findMany({
    where: {
      enabled: true,
      stoppedAt: null,
    },
    include: {
      tenant: { select: { id: true, name: true, plan: true } },
    },
  })

  const now = new Date()
  const results: Array<{
    tenantName: string
    tenantId: string
    status: 'fetched' | 'skipped_not_due' | 'skipped_expired' | 'error'
    detail?: any
  }> = []

  for (const pipeline of activePipelines) {
    // Auto-expire
    if (pipeline.expiresAt && pipeline.expiresAt < now) {
      await prisma.pipelineConfig.update({
        where: { id: pipeline.id },
        data: { enabled: false, stoppedAt: now, stoppedReason: 'expired' },
      })
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'skipped_expired',
      })
      continue
    }

    // Validate plan-gated frequency
    const tenantPlan = (pipeline as any).tenant?.plan || 'free'
    const allowed = getAllowedFrequencies(tenantPlan)
    const requestedInterval = pipeline.pollIntervalMinutes || 1440
    const effectiveInterval = allowed.includes(requestedInterval) ? requestedInterval : Math.max(...allowed)

    // Check if poll interval has elapsed
    const intervalMs = effectiveInterval * 60 * 1000
    const lastFetch = pipeline.lastFetchAt ? pipeline.lastFetchAt.getTime() : 0
    const nextDue = lastFetch + intervalMs

    if (now.getTime() < nextDue) {
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'skipped_not_due',
      })
      continue
    }

    // Acquire poll lock to prevent concurrent runs
    const locked = await acquireLock(pipeline.tenantId)
    if (!locked) {
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'skipped_not_due',
        detail: 'Another poll is already running',
      })
      await recordPollRun(pipeline.tenantId, 'skipped', now)
      continue
    }

    // This pipeline is due — fetch emails with retry
    const pollStart = new Date()
    try {
      const fetchResult = await fetchWithRetry()
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'fetched',
        detail: {
          processed: fetchResult.processed,
          errors: fetchResult.errors,
          skipped: fetchResult.skipped,
        },
      })
      await recordPollRun(pipeline.tenantId, 'success', pollStart, fetchResult.processed + fetchResult.errors + fetchResult.skipped, fetchResult.processed)
    } catch (err: any) {
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'error',
        detail: err.message,
      })
      await recordPollRun(pipeline.tenantId, 'failed', pollStart, undefined, undefined, err.message)
    } finally {
      await releaseLock(pipeline.tenantId)
    }
  }

  const durationMs = Date.now() - startTime
  const fetched = results.filter((r) => r.status === 'fetched').length
  const expired = results.filter((r) => r.status === 'skipped_expired').length

  console.log(
    `[cron] Processed ${activePipelines.length} pipelines: ${fetched} fetched, ${expired} expired, ${durationMs}ms`
  )

  return NextResponse.json({
    pipelines: activePipelines.length,
    fetched,
    expired,
    results,
    durationMs,
    timestamp: now.toISOString(),
  })
}
