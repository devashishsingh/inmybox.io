import { prisma } from '@/lib/prisma'

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
