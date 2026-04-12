// INMYBOX ENHANCEMENT — Phase 3: Server-side cookie consent (replaces M9 localStorage approach)
import { NextRequest, NextResponse } from 'next/server'

const VALID_VALUES = ['accepted', 'declined']
const COOKIE_NAME = 'inmybox-cookie-consent'
const MAX_AGE = 365 * 24 * 60 * 60 // 1 year

// GET — read current consent status
export async function GET() {
  // Cookie is read client-side from the response; this endpoint exists for completeness
  return NextResponse.json({ status: 'ok' })
}

// POST — set consent cookie (httpOnly, secure, SameSite=Lax)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const value = body.consent

    if (!value || !VALID_VALUES.includes(value)) {
      return NextResponse.json({ error: 'Invalid consent value' }, { status: 400 })
    }

    const response = NextResponse.json({ consent: value })
    response.cookies.set(COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
