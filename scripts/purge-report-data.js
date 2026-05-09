const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

;(async () => {
  console.log('Purging report data...')
  const result = await p.$transaction(async (tx) => {
    const r1  = await tx.dmarcRecord.deleteMany({})
    const r2  = await tx.dmarcReport.deleteMany({})
    const r3  = await tx.rawFile.deleteMany({})
    const r4  = await tx.senderClassification.deleteMany({})
    const r5  = await tx.sender.deleteMany({})
    const r6  = await tx.ipEnrichment.deleteMany({})
    const r7  = await tx.riskScore.deleteMany({})
    const r8  = await tx.actionItem.deleteMany({})
    const r9  = await tx.ingestionLog.deleteMany({})
    return { r1, r2, r3, r4, r5, r6, r7, r8, r9 }
  })

  console.log(`dmarc_records          deleted ${result.r1.count}`)
  console.log(`dmarc_reports          deleted ${result.r2.count}`)
  console.log(`raw_files              deleted ${result.r3.count}`)
  console.log(`sender_classifications deleted ${result.r4.count}`)
  console.log(`senders                deleted ${result.r5.count}`)
  console.log(`ip_enrichments         deleted ${result.r6.count}`)
  console.log(`risk_scores            deleted ${result.r7.count}`)
  console.log(`action_items           deleted ${result.r8.count}`)
  console.log(`ingestion_logs         deleted ${result.r9.count}`)
  console.log('Done.')
  await p.$disconnect()
})().catch(async (e) => {
  console.error('FAILED:', e)
  await p.$disconnect()
  process.exit(1)
})
