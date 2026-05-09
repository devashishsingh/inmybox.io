require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

;(async () => {
  const logs = await p.ingestionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: {
      id: true,
      createdAt: true,
      fileName: true,
      source: true,
      status: true,
      errorMessage: true,
      reportCount: true,
      recordCount: true,
    },
  })
  console.log('=== RECENT INGESTION LOGS ===')
  console.log(JSON.stringify(logs, null, 2))

  const aliases = await p.aliasMapping.findMany({
    select: { alias: true, tenant: { select: { name: true } } },
  })
  console.log('\n=== CONFIGURED ALIASES ===')
  console.log(JSON.stringify(aliases, null, 2))

  console.log('\n=== ENV CONFIG ===')
  console.log('EMAIL_IMAP_USER:', process.env.EMAIL_IMAP_USER || '(unset)')
  console.log('EMAIL_FOLDER:', process.env.EMAIL_FOLDER || '(unset, default=dmarc_report)')

  await p.$disconnect()
})()
