import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/crypto'

/**
 * GET /api/mailbox/callback/microsoft
 * Handles OAuth callback from Microsoft / Entra ID.
 * Exchanges code for tokens and stores them encrypted.
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

  const clientId = process.env.MICROSOFT_CLIENT_ID!
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
  const msTenantId = process.env.MICROSOFT_TENANT_ID || 'common'
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/mailbox/callback/microsoft`
  const tokenUrl = `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/token`

  let tokens: { access_token: string; refresh_token?: string; expires_in?: number }
  try {
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const body = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(body.error_description || body.error)
    tokens = body
  } catch (err: any) {
    console.error('[mailbox/callback/microsoft] Token exchange failed:', err.message)
    return NextResponse.redirect(new URL('/onboarding?error=Token+exchange+failed', req.url))
  }

  // Get user email from Microsoft Graph
  let email = ''
  try {
    const meRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const me = await meRes.json()
    email = me.mail || me.userPrincipalName || ''
  } catch {}

  try {
    const expiry = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
    await prisma.mailboxConnection.upsert({
      where: { tenantId },
      create: {
        tenantId,
        provider: 'microsoft',
        email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiry: expiry,
        status: 'active',
      },
      update: {
        provider: 'microsoft',
        email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiry: expiry,
        status: 'active',
        errorMessage: null,
        lastSyncAt: null,
      },
    })

    await prisma.onboardingChecklist.upsert({
      where: { tenantId },
      create: { tenantId, wizardStep: 3 },
      update: { wizardStep: 3 },
    })
  } catch (err: any) {
    console.error('[mailbox/callback/microsoft] DB write failed:', err.message)
    return NextResponse.redirect(new URL('/onboarding?error=Failed+to+save+connection', req.url))
  }

  return NextResponse.redirect(new URL('/onboarding?connected=microsoft', req.url))
}
