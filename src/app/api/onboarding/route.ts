import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getOnboardingProgress, completeChecklistStep } from '@/lib/services/onboarding.service'
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
