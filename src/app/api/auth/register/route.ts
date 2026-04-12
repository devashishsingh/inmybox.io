import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createTenant, generateSlug } from '@/lib/services/tenant.service'

// INMYBOX ENHANCEMENT — Phase 3: Rate limiter to prevent signup abuse (3 registrations per 15 min per IP)
const registerRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const REGISTER_RATE_WINDOW = 15 * 60_000 // 15 minutes
const REGISTER_RATE_MAX = 3

function isRegisterRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = registerRateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    registerRateLimitMap.set(ip, { count: 1, resetAt: now + REGISTER_RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > REGISTER_RATE_MAX
}

// INMYBOX ENHANCEMENT — Phase 3: Server-side password complexity validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain at least one number')
    .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // INMYBOX ENHANCEMENT — Phase 3: Rate limit registration endpoint
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  if (isRegisterRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name, company } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    // Create tenant with user as owner
    const tenantName = company || `${name}'s Organization`
    const slug = generateSlug(tenantName) + '-' + Date.now().toString(36)
    const tenant = await createTenant({
      name: tenantName,
      slug,
      userId: newUser.id,
    })

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        tenantId: tenant.id,
      },
      { status: 201 }
    )
  } catch (error) {
    // INMYBOX ENHANCEMENT: H2 — log error type only, not full object (may contain PII)
    console.error('[register] Registration failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
