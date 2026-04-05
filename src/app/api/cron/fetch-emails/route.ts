import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { testConnection, fetchAndProcessEmails } from '@/lib/services/email-fetcher.service'
import { prisma } from '@/lib/prisma'

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

  // Internal background worker uses this header
  if (req.headers.get('x-internal-cron') === 'true' && !cronSecret) {
    return true
  }

  // Check admin session
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role === 'super_admin') {
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
      tenant: { select: { id: true, name: true } },
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

    // Check if poll interval has elapsed
    const intervalMs = (pipeline.pollIntervalMinutes || 1440) * 60 * 1000
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

    // This pipeline is due — fetch emails
    try {
      const fetchResult = await fetchAndProcessEmails()
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
    } catch (err: any) {
      results.push({
        tenantName: pipeline.tenant.name,
        tenantId: pipeline.tenantId,
        status: 'error',
        detail: err.message,
      })
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
