import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { testConnection, fetchAndProcessEmails } from '@/lib/services/email-fetcher.service'

/**
 * GET /api/cron/fetch-emails?action=test
 * Tests the IMAP connection and folder access.
 * 
 * POST /api/cron/fetch-emails
 * Triggers the full email fetch + ingestion pipeline.
 * 
 * Both require super_admin session OR a valid CRON_SECRET header.
 */

async function authorize(req: NextRequest): Promise<boolean> {
  // Check cron secret header (for external cron services)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
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
      'POST': 'Fetch and process emails',
    },
    config: {
      host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
      user: process.env.EMAIL_IMAP_USER ? '✓ configured' : '✗ missing',
      pass: process.env.EMAIL_IMAP_PASS ? '✓ configured' : '✗ missing',
      folder: process.env.EMAIL_FOLDER || 'dmarc_report',
    },
  })
}

// POST — fetch and process
export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const result = await fetchAndProcessEmails()
  const durationMs = Date.now() - startTime

  return NextResponse.json({
    ...result,
    durationMs,
    timestamp: new Date().toISOString(),
  })
}
