import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const demoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z
    .string()
    .email('Please enter a valid work email')
    .max(200)
    .refine(
      (e) => !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'].includes(e.split('@')[1]?.toLowerCase()),
      'Please use your work email address'
    ),
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  message: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = demoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, company, phone, message } = parsed.data

    // Check for duplicate requests within 24h
    const recentRequest = await prisma.demoRequest.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    if (recentRequest) {
      return NextResponse.json(
        { error: 'You have already submitted a demo request. Our team will reach out soon.' },
        { status: 409 }
      )
    }

    await prisma.demoRequest.create({
      data: {
        name,
        email,
        company: company || null,
        phone: phone || null,
        message: message || null,
      },
    })

    return NextResponse.json(
      { message: 'Demo request submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    // INMYBOX ENHANCEMENT: H2 — log error type only, not full object (may contain PII)
    console.error('[demo-request] Failed:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
