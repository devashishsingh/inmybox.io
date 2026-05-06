import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

/**
 * POST /api/auth/2fa/session
 * Called after successful TOTP verification to persist twoFactorVerified=true
 * into the NextAuth session by triggering a session update.
 *
 * The client calls this then `update()` from next-auth/react to refresh the JWT.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Return a marker that the client can use to call useSession update()
  return NextResponse.json({ twoFactorVerified: true })
}
