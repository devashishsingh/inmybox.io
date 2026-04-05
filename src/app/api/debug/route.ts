import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, string> = {}

  // 1. Check env vars
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? `set (${process.env.NEXTAUTH_SECRET.length} chars)` : 'MISSING'
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'MISSING'
  checks.DATABASE_URL = process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'MISSING'
  checks.DIRECT_URL = process.env.DIRECT_URL ? 'set' : 'MISSING'
  checks.VERCEL = process.env.VERCEL || 'not set'
  checks.NODE_ENV = process.env.NODE_ENV || 'not set'

  // 2. Check Prisma import
  try {
    const { prisma } = await import('@/lib/prisma')
    const userCount = await prisma.user.count()
    checks.prisma = `OK (${userCount} users)`
  } catch (e: any) {
    checks.prisma = `ERROR: ${e.message}`
  }

  // 3. Check bcryptjs import
  try {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('test', 10)
    checks.bcryptjs = hash ? 'OK' : 'FAILED'
  } catch (e: any) {
    checks.bcryptjs = `ERROR: ${e.message}`
  }

  // 4. Check NextAuth import
  try {
    const { authOptions } = await import('@/lib/auth-config')
    checks.authOptions = authOptions.providers?.length ? `OK (${authOptions.providers.length} providers)` : 'NO PROVIDERS'
    checks.authSecret = authOptions.secret ? `set (${authOptions.secret.length} chars)` : 'MISSING in config'
  } catch (e: any) {
    checks.authOptions = `ERROR: ${e.message}`
  }

  return NextResponse.json(checks, { status: 200 })
}
