const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const alias = await prisma.aliasMapping.upsert({
    where: { alias: 'devashish.singh12@gmail.com' },
    update: {},
    create: {
      alias: 'devashish.singh12@gmail.com',
      tenantId: 'tenant-demo-001',
      notes: 'Gmail test alias for IMAP fetcher testing',
    },
  });
  console.log('Added alias:', alias.alias);
  const all = await prisma.aliasMapping.findMany();
  console.log('All aliases:', all.map(a => a.alias));
  await prisma.$disconnect();
}
run().catch(console.error);
