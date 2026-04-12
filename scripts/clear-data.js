const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// INMYBOX ENHANCEMENT: C3 — require --tenantId argument to prevent cross-tenant wipe
async function run() {
  const tenantId = process.argv.find(a => a.startsWith('--tenantId='))?.split('=')[1];
  
  if (!tenantId) {
    console.error('❌ Usage: node scripts/clear-data.js --tenantId=<tenant-id>');
    console.error('   This prevents accidental cross-tenant data wipe.');
    process.exit(1);
  }

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(`❌ Tenant not found: ${tenantId}`);
    process.exit(1);
  }

  console.log(`🗑️  Clearing data for tenant: ${tenant.name} (${tenantId})...`);

  // Get tenant's domain IDs for scoped deletion
  const domains = await prisma.domain.findMany({ where: { tenantId }, select: { id: true } });
  const domainIds = domains.map(d => d.id);
  
  // Delete in order respecting foreign keys — scoped to tenant
  await prisma.dmarcRecord.deleteMany({ where: { report: { domainId: { in: domainIds } } } });
  console.log('  ✓ DMARC records cleared');
  
  await prisma.dmarcReport.deleteMany({ where: { domainId: { in: domainIds } } });
  console.log('  ✓ DMARC reports cleared');
  
  await prisma.rawFile.deleteMany({ where: { tenantId } });
  console.log('  ✓ Raw files cleared');
  
  await prisma.actionItem.deleteMany({ where: { tenantId } });
  console.log('  ✓ Action items cleared');
  
  await prisma.senderClassification.deleteMany({ where: { sender: { domainId: { in: domainIds } } } });
  console.log('  ✓ Sender classifications cleared');
  
  await prisma.sender.deleteMany({ where: { domainId: { in: domainIds } } });
  console.log('  ✓ Senders cleared');
  
  await prisma.riskScore.deleteMany({ where: { domainId: { in: domainIds } } });
  console.log('  ✓ Risk scores cleared');
  
  await prisma.ipEnrichment.deleteMany();
  console.log('  ✓ IP enrichments cleared (global cache)');
  
  await prisma.ingestionLog.deleteMany({ where: { tenantId } });
  console.log('  ✓ Ingestion logs cleared');

  console.log(`\n✅ All report/sender data cleared for tenant: ${tenant.name}. Config preserved.`);
  
  await prisma.$disconnect();
}
run().catch(console.error);
