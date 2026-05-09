const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const tables = [
  'user', 'tenant', 'tenantMembership', 'aliasMapping', 'invitation',
  'onboardingChecklist', 'pipelineConfig', 'tenantSettings',
  'domain',
  'dmarcReport', 'dmarcRecord', 'rawFile',
  'sender', 'senderClassification', 'ipEnrichment',
  'riskScore', 'actionItem', 'ingestionLog',
  'bimiConfig', 'bimiCheck',
  'demoRequest',
]

;(async () => {
  for (const t of tables) {
    try {
      const c = await p[t].count()
      console.log(`${t.padEnd(24)} ${String(c).padStart(8)}`)
    } catch (e) {
      console.log(`${t.padEnd(24)} ERROR: ${e.message}`)
    }
  }
  await p.$disconnect()
})()
