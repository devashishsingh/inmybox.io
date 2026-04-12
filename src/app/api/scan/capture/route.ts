import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLeadNotification } from '@/lib/email'
import { z } from 'zod'

const captureSchema = z.object({
  scanId: z.string().min(1),
  email: z.string().email('Invalid email address').max(200),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = captureSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { scanId, email } = parsed.data

    // Update the scan record with the email
    const scan = await prisma.domainScan.update({
      where: { id: scanId },
      data: { email },
    })

    // Send admin notification (fire-and-forget)
    sendLeadNotification({
      domain: scan.domain,
      email,
      score: scan.score,
      riskLevel: scan.riskLevel,
    }).catch(err => console.error('Lead notification error:', err))

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    // Handle case where scanId doesn't exist
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404  })
    }
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Failed to save. Please try again.' },
      { status: 500 }
    )
  }
}
