import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { addDomain, listDomains } from '@/lib/services/domain.service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ settings: null, domains: [] })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: {
      settings: true,
      domains: { select: { id: true, domain: true } },
    },
  })

  return NextResponse.json({
    settings: tenant?.settings,
    domains: tenant?.domains || [],
    tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: ctx.tenantId },
    update: {
      conversionRate: body.conversionRate ?? undefined,
      avgLeadValue: body.avgLeadValue ?? undefined,
      campaignBenchmark: body.campaignBenchmark ?? undefined,
      reportRetention: body.reportRetention ?? undefined,
      notifications: body.notifications ?? undefined,
      emailDigest: body.emailDigest ?? undefined,
      alertThreshold: body.alertThreshold ?? undefined,
    },
    create: {
      tenantId: ctx.tenantId,
      conversionRate: body.conversionRate ?? 0.02,
      avgLeadValue: body.avgLeadValue ?? 50,
      campaignBenchmark: body.campaignBenchmark ?? 0.15,
      reportRetention: body.reportRetention ?? 90,
      notifications: body.notifications ?? true,
    },
  })

  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()
  const domainName = body.domain?.trim()?.toLowerCase()

  if (!domainName || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domainName)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  const domain = await addDomain(ctx.tenantId, domainName)

  if (!domain) {
    return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
  }

  return NextResponse.json({ domain }, { status: 201 })
}
