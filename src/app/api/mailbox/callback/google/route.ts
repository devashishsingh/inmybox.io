import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

/**
 * GET /api/mailbox/callback/google
 * Handles the OAuth callback from Google. Exchanges code for tokens
 * and stores them encrypted in the MailboxConnection table.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam || !code || !stateRaw) {
    const msg = errorParam === 'access_denied' ? 'Access denied' : 'OAuth failed'
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(msg)}`, req.url))
  }

  let tenantId: string
  let userId: string
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString())
    tenantId = parsed.tenantId
    userId = parsed.userId
    if (!tenantId || !userId) throw new Error('Invalid state')
  } catch {
    return NextResponse.redirect(new URL('/onboarding?error=Invalid+state', req.url))
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/mailbox/callback/google`

  // Exchange code for tokens
  let tokens: { access_token: string; refresh_token?: string; expiry_date?: number; email?: string }
  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const body = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(body.error_description || body.error)
    tokens = body
  } catch (err: any) {
    console.error('[mailbox/callback/google] Token exchange failed:', err.message)
    return NextResponse.redirect(new URL('/onboarding?error=Token+exchange+failed', req.url))
  }

  // Get user email from userinfo
  let email = ''
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const info = await infoRes.json()
    email = info.email || ''
  } catch {}

  // Store encrypted tokens
  try {
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null
    await prisma.mailboxConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        provider: 'google',
        email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiry: expiry,
        status: 'active',
      },
      update: {
        provider: 'google',
        email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiry: expiry,
        status: 'active',
        errorMessage: null,
        lastSyncAt: null,
      },
    })

    // Mark onboarding step
    await prisma.onboardingChecklist.upsert({
      where: { tenantId },
      create: { tenantId, wizardStep: 3 },
      update: { wizardStep: 3 },
    })
  } catch (err: any) {
    console.error('[mailbox/callback/google] DB write failed:', err.message)
    return NextResponse.redirect(new URL('/onboarding?error=Failed+to+save+connection', req.url))
  }

  return NextResponse.redirect(new URL('/onboarding?connected=google', req.url))
}
