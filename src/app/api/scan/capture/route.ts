import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLeadNotification } from '@/lib/email'
import { z } from 'zod'

const captureSchema = z.object({
  scanId: z.string().min(1),
  email: z.string().email('Invalid email address').max(200),
})

// INMYBOX ENHANCEMENT: C6 — in-memory rate limiter per IP (5 requests per 60s)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 60 seconds
const RATE_LIMIT_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = captureSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { scanId, email } = parsed.data

    // Update the scan record with the email
    const scan = await prisma.domainScan.update({
      where: { id: scanId },
      data: { email },
    })

    // Send admin notification (fire-and-forget)
    sendLeadNotification({
      domain: scan.domain,
      email,
      score: scan.score,
      riskLevel: scan.riskLevel,
    }).catch(err => console.error(`[scan/capture] Lead notification error: ${err instanceof Error ? err.message : 'Unknown error'}`))

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    // Handle case where scanId doesn't exist
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404  })
    }
    // INMYBOX ENHANCEMENT — Phase 5: Safe error logging (no raw objects)
    console.error(`[scan/capture] Lead capture error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json(
      { error: 'Failed to save. Please try again.' },
      { status: 500 }
    )
  }
}
