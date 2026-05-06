import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const SCOPES = [
  'offline_access',
  'https://outlook.office.com/IMAP.AccessAsUser.All',
  'https://outlook.office.com/User.Read',
].join(' ')

/**
 * GET /api/mailbox/connect/microsoft
 * Initiates the Microsoft OAuth flow for connecting an Outlook/M365 inbox.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Microsoft OAuth not configured' }, { status: 500 })
  }

  const state = Buffer.from(JSON.stringify({ tenantId: ctx.tenantId, userId: session.user.id })).toString('base64url')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/mailbox/callback/microsoft`,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state,
  })

  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`

  return NextResponse.redirect(`${authUrl}?${params}`)
}
