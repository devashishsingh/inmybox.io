require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reports = await prisma.dmarcReport.findMany({ include: { records: true } });
  console.log(`Reports: ${reports.length}`);
  reports.forEach(r => {
    console.log(`  - ${r.reportId} | org: ${r.orgName} | records: ${r.records.length} | domain: ${r.policyDomain}`);
  });

  const records = await prisma.dmarcRecord.count();
  console.log(`\nTotal DMARC records: ${records}`);

  const senders = await prisma.sender.findMany();
  console.log(`Senders: ${senders.length}`);
  senders.forEach(s => console.log(`  - ${s.ip} | vol: ${s.totalVolume} | pass: ${s.passCount} | fail: ${s.failCount}`));

  const actions = await prisma.actionItem.findMany();
  console.log(`\nAction items: ${actions.length}`);
  actions.forEach(a => console.log(`  - [${a.severity}] ${a.title}`));

  const logs = await prisma.ingestionLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(`\nRecent ingestion logs:`);
  logs.forEach(l => console.log(`  - ${l.status} | source: ${l.source} | file: ${l.fileName} | reports: ${l.reportCount} | records: ${l.recordCount} | error: ${l.errorMessage || 'none'}`));

  const rawFiles = await prisma.rawFile.findMany();
  console.log(`\nRaw files: ${rawFiles.length}`);
  rawFiles.forEach(f => console.log(`  - ${f.originalName} | status: ${f.status} | size: ${f.fileSize}b`));

  await prisma.$disconnect();
}
check().catch(console.error);
