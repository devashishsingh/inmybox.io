require('dotenv').config()
const { ImapFlow } = require('imapflow')

;(async () => {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.EMAIL_IMAP_USER, pass: process.env.EMAIL_IMAP_PASS },
    logger: false,
  })

  await client.connect()

  // List all folders/labels
  const list = await client.list()
  console.log('=== ALL GMAIL LABELS/FOLDERS ===')
  for (const f of list) {
    console.log(`  ${f.path}  (flags: ${[...(f.flags || [])].join(',')})`)
  }

  for (const folderName of ['INBOX', 'dmarc_report']) {
    console.log(`\n=== UNSEEN IN "${folderName}" ===`)
    try {
      const lock = await client.getMailboxLock(folderName)
      try {
        const status = client.mailbox
        console.log(`  total messages: ${status.exists}`)
        const unseen = await client.search({ seen: false })
        const uids = Array.isArray(unseen) ? unseen : []
        console.log(`  unseen UIDs: ${uids.length} → [${uids.slice(0, 30).join(', ')}${uids.length > 30 ? ',...' : ''}]`)

        // Fetch headers for first 10 unseen
        if (uids.length > 0) {
          const sample = uids.slice(-10) // last 10 (most recent)
          for await (const msg of client.fetch(sample, { envelope: true, bodyStructure: true }, { uid: true })) {
            const env = msg.envelope
            const subj = env?.subject || '(no subject)'
            const from = env?.from?.[0] ? `${env.from[0].mailbox}@${env.from[0].host}` : '?'
            // Find attachments in bodyStructure
            const atts = []
            const walk = (node) => {
              if (!node) return
              if (node.disposition === 'attachment' || (node.dispositionParameters && node.dispositionParameters.filename)) {
                atts.push(node.dispositionParameters?.filename || node.parameters?.name || '?')
              }
              if (node.childNodes) node.childNodes.forEach(walk)
            }
            walk(msg.bodyStructure)
            console.log(`  UID ${msg.uid}: "${subj}" from ${from} — attachments: [${atts.join(', ')}]`)
          }
        }
      } finally {
        lock.release()
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`)
    }
  }

  await client.logout()
})()
