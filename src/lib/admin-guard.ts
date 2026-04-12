import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { isSuperAdmin } from '@/lib/services/tenant.service'

/**
 * Validates that the current request is from a super admin.
 * Returns user id on success, or a NextResponse error.
 */
export async function requireSuperAdmin(): Promise<
  { userId: string } | NextResponse
> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const isAdmin = await isSuperAdmin(userId)

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
  }

  return { userId }
}
