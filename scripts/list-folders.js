const { ImapFlow } = require('imapflow');
require('dotenv').config();

async function listFolders() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_IMAP_USER,
      pass: process.env.EMAIL_IMAP_PASS,
    },
    logger: false,
  });

  await client.connect();
  console.log('Connected to Gmail IMAP\n');

  const folders = await client.list();
  console.log('Available folders/labels:');
  for (const folder of folders) {
    console.log(`  ${folder.path} (${folder.name}) ${folder.flags ? '[' + [...folder.flags].join(', ') + ']' : ''}`);
  }

  // Try to find the dmarc folder
  const dmarcFolders = folders.filter(f => 
    f.path.toLowerCase().includes('dmarc') || 
    f.name.toLowerCase().includes('dmarc')
  );
  
  if (dmarcFolders.length > 0) {
    console.log('\n✓ Found DMARC folder(s):');
    dmarcFolders.forEach(f => console.log(`  → ${f.path}`));
  } else {
    console.log('\n✗ No folder matching "dmarc" found');
  }

  await client.logout();
}

listFolders().catch(console.error);
