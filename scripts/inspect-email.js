require('dotenv').config();
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

async function inspectEmail() {
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

  try {
    // Fetch the first message
    const download = await client.download('1');
    const parsed = await simpleParser(download.content);

    console.log('Subject:', parsed.subject);
    console.log('From:', parsed.from?.text);
    console.log('To:', parsed.to?.text);
    console.log('Date:', parsed.date);
    console.log('');
    console.log('Attachments count:', parsed.attachments?.length || 0);
    
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        console.log(`  - filename: "${att.filename}"`);
        console.log(`    contentType: ${att.contentType}`);
        console.log(`    size: ${att.size} bytes`);
        console.log(`    contentDisposition: ${att.contentDisposition}`);
      }
    } else {
      console.log('\nNo attachments found.');
      console.log('Text body preview:', parsed.text?.substring(0, 200));
      console.log('HTML body?', !!parsed.html);
    }
  } finally {
    lock.release();
  }

  await client.logout();
}

inspectEmail().catch(console.error);
