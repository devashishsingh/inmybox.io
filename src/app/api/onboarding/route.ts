import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getOnboardingProgress, completeChecklistStep, updateWizardStep } from '@/lib/services/onboarding.service'
import { prisma } from '@/lib/prisma'
import { seedDemoData } from '@/lib/services/demo-data.service'
import { z } from 'zod'

// GET /api/onboarding — get onboarding progress
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const progress = await getOnboardingProgress(ctx.tenantId)
  return NextResponse.json(progress)
}

const updateSchema = z.object({
  step: z.enum([
    'domainAdded', 'aliasAssigned', 'dmarcRuaUpdated',
    'sampleReportUploaded', 'firstReportReceived', 'parsingComplete',
    'sendersReviewed', 'assumptionsConfigured', 'dashboardReady',
  ]),
})

// PATCH /api/onboarding — mark step complete
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    await completeChecklistStep(ctx.tenantId, parsed.data.step)
    const progress = await getOnboardingProgress(ctx.tenantId)

    return NextResponse.json(progress)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// POST /api/onboarding — wizard actions: add_domain | verify_dns | set_method | mark_step
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const { tenantId } = ctx
  const body = await req.json()
  const { action } = body as { action: string }

  // ── add_domain ────────────────────────────────────────────────────────────
  if (action === 'add_domain') {
    const { domain } = body as { domain: string }
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 })
    }
    const clean = domain.trim().toLowerCase()

    const existing = await prisma.domain.findFirst({ where: { tenantId, domain: clean } })
    if (existing) {
      return NextResponse.json({ domain: existing })
    }

    const newDomain = await prisma.domain.create({
      data: { tenantId, domain: clean, dmarcSetupStatus: 'pending' },
    })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    const slug = tenant?.slug || tenantId.slice(0, 8)
    const alias = `${slug}@rua.inmybox.io`

    await prisma.aliasMapping.upsert({
      where: { alias },
      create: { alias, tenantId, isActive: true },
      update: { tenantId, isActive: true },
    })

    await prisma.onboardingChecklist.upsert({
      where: { tenantId },
      create: { tenantId, domainAdded: true, aliasAssigned: true, wizardStep: 2 },
      update: { domainAdded: true, aliasAssigned: true, wizardStep: 2 },
    })

    // Seed demo data in the background
    seedDemoData(tenantId, newDomain.id).catch((err) =>
      console.error('[onboarding] seedDemoData failed:', err)
    )

    return NextResponse.json({ domain: newDomain, alias })
  }

  // ── set_method ────────────────────────────────────────────────────────────
  if (action === 'set_method') {
    const { method } = body as { method: string }
    const allowed = ['dns_rua', 'forwarding', 'imap_oauth']
    if (!allowed.includes(method)) {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
    }
    await prisma.onboardingChecklist.upsert({
      where: { tenantId },
      create: { tenantId, ingestionMethod: method, wizardStep: 3 },
      update: { ingestionMethod: method, wizardStep: 3 },
    })
    return NextResponse.json({ ok: true })
  }

  // ── verify_dns ────────────────────────────────────────────────────────────
  if (action === 'verify_dns') {
    const domain = await prisma.domain.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })
    if (!domain) return NextResponse.json({ verified: false, reason: 'No domain found' })

    try {
      const dns = await import('dns').then((m) => m.promises)
      const txtRecords = await dns.resolveTxt(`_dmarc.${domain.domain}`)
      const flat = txtRecords.flat().join(' ')
      const hasDmarc = /v=DMARC1/i.test(flat)
      const hasRua = flat.includes('inmybox.io')

      if (hasDmarc) {
        await prisma.domain.update({ where: { id: domain.id }, data: { dmarcSetupStatus: 'configured' } })
        if (hasRua) {
          await prisma.onboardingChecklist.upsert({
            where: { tenantId },
            create: { tenantId, dmarcRuaUpdated: true },
            update: { dmarcRuaUpdated: true },
          })
        }
      }

      return NextResponse.json({ verified: hasDmarc, hasRua, record: hasDmarc ? flat : null })
    } catch {
      return NextResponse.json({ verified: false, reason: 'DNS lookup failed' })
    }
  }

  // ── mark_step ─────────────────────────────────────────────────────────────
  if (action === 'mark_step') {
    const { step } = body as { step: number }
    if (typeof step !== 'number') return NextResponse.json({ error: 'step required' }, { status: 400 })
    await updateWizardStep(tenantId, step)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
