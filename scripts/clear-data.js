const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🗑️  Clearing seed data...');
  
  // Delete in order respecting foreign keys
  await prisma.dmarcRecord.deleteMany();
  console.log('  ✓ DMARC records cleared');
  
  await prisma.dmarcReport.deleteMany();
  console.log('  ✓ DMARC reports cleared');
  
  await prisma.rawFile.deleteMany();
  console.log('  ✓ Raw files cleared');
  
  await prisma.actionItem.deleteMany();
  console.log('  ✓ Action items cleared');
  
  await prisma.senderClassification.deleteMany();
  console.log('  ✓ Sender classifications cleared');
  
  await prisma.sender.deleteMany();
  console.log('  ✓ Senders cleared');
  
  await prisma.riskScore.deleteMany();
  console.log('  ✓ Risk scores cleared');
  
  await prisma.ipEnrichment.deleteMany();
  console.log('  ✓ IP enrichments cleared');
  
  await prisma.ingestionLog.deleteMany();
  console.log('  ✓ Ingestion logs cleared');

  console.log('\n✅ All report/sender data cleared. Tenants, users, aliases, and config preserved.');
  
  // Show what's left
  const aliases = await prisma.aliasMapping.findMany();
  console.log('\nActive aliases:', aliases.map(a => a.alias));
  
  await prisma.$disconnect();
}
run().catch(console.error);
