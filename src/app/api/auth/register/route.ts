import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createTenant, generateSlug } from '@/lib/services/tenant.service'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
})

export async function POST(req: NextRequest) {
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
