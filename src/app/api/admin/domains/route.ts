import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addDomainSchema = z.object({
  tenantId: z.string().min(1),
  domain: z.string().min(3),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
})

// GET /api/admin/domains — list domains
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId') || undefined

  const where: Record<string, unknown> = {}
  if (tenantId) where.tenantId = tenantId

  const domains = await prisma.domain.findMany({
    where,
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      _count: { select: { reports: true, senders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(domains)
}

// POST /api/admin/domains — add domain to tenant
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = addDomainSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { tenantId, domain: domainName, isPrimary, notes } = parsed.data

    // If setting as primary, unset existing primary
    if (isPrimary) {
      await prisma.domain.updateMany({
        where: { tenantId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const domain = await prisma.domain.create({
      data: {
        domain: domainName.toLowerCase(),
        tenantId,
        isPrimary: isPrimary || false,
        notes,
        dmarcSetupStatus: 'pending',
      },
    })

    // Update onboarding checklist
    await prisma.onboardingChecklist.updateMany({
      where: { tenantId },
      data: { domainAdded: true },
    })

    return NextResponse.json({ success: true, domain }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Domain already exists for this tenant' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH /api/admin/domains — update domain
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { domainId, ...data } = body

    if (!domainId) {
      return NextResponse.json({ error: 'domainId is required' }, { status: 400 })
    }

    // If setting as primary, unset others
    if (data.isPrimary) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId } })
      if (domain) {
        await prisma.domain.updateMany({
          where: { tenantId: domain.tenantId, isPrimary: true },
          data: { isPrimary: false },
        })
      }
    }

    const domain = await prisma.domain.update({
      where: { id: domainId },
      data,
    })

    return NextResponse.json({ success: true, domain })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
