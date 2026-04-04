require('dotenv').config();
const { ImapFlow } = require('imapflow');

async function markUnread() {
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
  const lock = await client.getMailboxLock('dmarc_report');
  
  // Mark all messages as unseen
  try {
    await client.messageFlagsRemove('1:*', ['\\Seen']);
    console.log('✓ Marked all messages in dmarc_report as unread');
  } finally {
    lock.release();
  }
  
  await client.logout();
}

markUnread().catch(console.error);
