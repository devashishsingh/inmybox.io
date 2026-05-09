const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

;(async () => {
  const logs = await p.ingestionLog.findMany({
    orderBy: { createdAt: 'desc' },
  })
  console.log(`Total ingestion_logs: ${logs.length}\n`)
  for (const l of logs) {
    console.log('---')
    console.log(`createdAt:    ${l.createdAt.toISOString()}`)
    console.log(`status:       ${l.status}`)
    console.log(`source:       ${l.source}`)
    console.log(`fileName:     ${l.fileName}`)
    console.log(`fileSize:     ${l.fileSize}`)
    console.log(`reportCount:  ${l.reportCount}`)
    console.log(`recordCount:  ${l.recordCount}`)
    console.log(`processingMs: ${l.processingMs}`)
    console.log(`tenantId:     ${l.tenantId}`)
    console.log(`domainId:     ${l.domainId}`)
    console.log(`errorMessage: ${l.errorMessage}`)
  }

  const reports = await p.dmarcReport.count()
  const records = await p.dmarcRecord.count()
  console.log(`\nDmarcReport count: ${reports}`)
  console.log(`DmarcRecord count: ${records}`)
  await p.$disconnect()
})()
