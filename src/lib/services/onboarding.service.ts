import { prisma } from '@/lib/prisma'
import {
  sendWelcomeEmail,
  sendFirstReportCelebrationEmail,
} from '@/lib/email'

type ChecklistField =
  | 'domainAdded'
  | 'aliasAssigned'
  | 'dmarcRuaUpdated'
  | 'sampleReportUploaded'
  | 'firstReportReceived'
  | 'parsingComplete'
  | 'sendersReviewed'
  | 'assumptionsConfigured'
  | 'dashboardReady'

/**
 * Gets the onboarding checklist for a tenant.
 */
export async function getOnboardingChecklist(tenantId: string) {
  let checklist = await prisma.onboardingChecklist.findUnique({
    where: { tenantId },
  })

  if (!checklist) {
    checklist = await prisma.onboardingChecklist.create({
      data: { tenantId },
    })
  }

  return checklist
}

/**
 * Marks a checklist step as complete.
 */
export async function completeChecklistStep(tenantId: string, step: ChecklistField) {
  const data: Record<string, boolean | Date> = { [step]: true }

  // Check if all steps are now complete
  const checklist = await prisma.onboardingChecklist.findUnique({
    where: { tenantId },
  })

  if (checklist) {
    const allSteps: ChecklistField[] = [
      'domainAdded', 'aliasAssigned', 'dmarcRuaUpdated',
      'sampleReportUploaded', 'firstReportReceived', 'parsingComplete',
      'sendersReviewed', 'assumptionsConfigured', 'dashboardReady',
    ]

    const currentState = { ...checklist, [step]: true }
    const allComplete = allSteps.every((s) => currentState[s])
    if (allComplete) {
      data.completedAt = new Date()
    }
  }

  return prisma.onboardingChecklist.update({
    where: { tenantId },
    data,
  })
}

/**
 * Resets a checklist step.
 */
export async function resetChecklistStep(tenantId: string, step: ChecklistField) {
  return prisma.onboardingChecklist.update({
    where: { tenantId },
    data: { [step]: false, completedAt: null },
  })
}

/**
 * Gets onboarding progress as a percentage and step details.
 */
export async function getOnboardingProgress(tenantId: string) {
  const checklist = await getOnboardingChecklist(tenantId)

  const steps = [
    { key: 'domainAdded', label: 'Domain Added', done: checklist.domainAdded },
    { key: 'aliasAssigned', label: 'DMARC Report Alias Assigned', done: checklist.aliasAssigned },
    { key: 'dmarcRuaUpdated', label: 'DMARC RUA Destination Updated', done: checklist.dmarcRuaUpdated },
    { key: 'sampleReportUploaded', label: 'Sample Report Uploaded', done: checklist.sampleReportUploaded },
    { key: 'firstReportReceived', label: 'First Report Received', done: checklist.firstReportReceived },
    { key: 'parsingComplete', label: 'Parsing Complete', done: checklist.parsingComplete },
    { key: 'sendersReviewed', label: 'Known Senders Reviewed', done: checklist.sendersReviewed },
    { key: 'assumptionsConfigured', label: 'Business Assumptions Configured', done: checklist.assumptionsConfigured },
    { key: 'dashboardReady', label: 'Dashboard Ready', done: checklist.dashboardReady },
  ]

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const percentage = Math.round((completed / total) * 100)

  return {
    steps,
    completed,
    total,
    percentage,
    isComplete: !!checklist.completedAt,
    completedAt: checklist.completedAt,
  }
}

// ─── EMAIL SEQUENCES ────────────────────────────────────────────────────────

/**
 * Sends the welcome email if not already sent for this tenant.
 * Called non-blocking from auth-config signIn callback.
 */
export async function triggerWelcomeSequence(tenantId: string, userId: string): Promise<void> {
  try {
    const checklist = await prisma.onboardingChecklist.findUnique({
      where: { tenantId },
    })
    if (checklist?.welcomeEmailSent) return

    const [user, tenant] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    ])

    if (!user?.email || !tenant) return

    await sendWelcomeEmail({
      toEmail: user.email,
      toName: user.name,
      tenantName: tenant.name,
    })

    // Mark as sent + log to sequence log
    await prisma.$transaction([
      prisma.onboardingChecklist.upsert({
        where: { tenantId },
        create: { tenantId, welcomeEmailSent: true },
        update: { welcomeEmailSent: true },
      }),
      prisma.emailSequenceLog.create({
        data: {
          tenantId,
          type: 'welcome',
          status: 'sent',
          sentAt: new Date(),
        },
      }),
    ])
  } catch (err) {
    console.error('[onboarding] triggerWelcomeSequence error:', err)
  }
}

/**
 * Sends the "first DMARC report received" celebration email.
 * Call after successfully ingesting the first real report for a tenant.
 */
export async function triggerFirstReportCelebration(tenantId: string, domain: string): Promise<void> {
  try {
    // Only send once
    const existing = await prisma.emailSequenceLog.findFirst({
      where: { tenantId, type: 'first_report_celebration', status: 'sent' },
    })
    if (existing) return

    // Find the primary user (first admin membership)
    const membership = await prisma.tenantMembership.findFirst({
      where: { tenantId, role: 'admin' },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })

    if (!membership?.user?.email || !tenant) return

    await sendFirstReportCelebrationEmail({
      toEmail: membership.user.email,
      toName: membership.user.name,
      domain,
      tenantName: tenant.name,
    })

    await prisma.emailSequenceLog.create({
      data: {
        tenantId,
        type: 'first_report_celebration',
        status: 'sent',
        sentAt: new Date(),
        metadata: JSON.stringify({ domain }),
      },
    })
  } catch (err) {
    console.error('[onboarding] triggerFirstReportCelebration error:', err)
  }
}

/**
 * Updates the wizard step in OnboardingChecklist.
 */
export async function updateWizardStep(tenantId: string, step: number): Promise<void> {
  await prisma.onboardingChecklist.upsert({
    where: { tenantId },
    create: { tenantId, wizardStep: step },
    update: { wizardStep: step },
  })
}
