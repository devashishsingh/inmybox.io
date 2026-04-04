import { resolveTenantByEmailAlias } from './tenant.service'
import { ingestReport } from './ingestion.service'
import { ImapFlow } from 'imapflow'
import { simpleParser, type AddressObject } from 'mailparser'

/**
 * Email fetcher service.
 * 
 * Connects to a centralized Gmail mailbox via IMAP, reads emails from
 * the 'dmarc_report' folder, extracts DMARC XML/ZIP/GZ attachments,
 * routes them to the correct tenant based on the recipient alias,
 * and triggers the ingestion pipeline.
 * 
 * Gmail setup:
 * 1. Enable IMAP in Gmail settings
 * 2. Create an App Password (Security > 2-Step Verification > App Passwords)
 * 3. Create a label/folder called 'dmarc_report'
 * 4. Set up a filter to move DMARC aggregate report emails to that label
 * 
 * Environment variables:
 * - EMAIL_IMAP_HOST: IMAP server hostname (default: imap.gmail.com)
 * - EMAIL_IMAP_PORT: IMAP port (default: 993)
 * - EMAIL_IMAP_USER: Gmail address
 * - EMAIL_IMAP_PASS: App password
 * - EMAIL_FOLDER: Mailbox folder to read from (default: dmarc_report)
 */

const IMAP_CONFIG = {
  host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
  user: process.env.EMAIL_IMAP_USER || '',
  pass: process.env.EMAIL_IMAP_PASS || '',
  folder: process.env.EMAIL_FOLDER || 'dmarc_report',
}

interface EmailMessage {
  from: string
  to: string
  subject: string
  date: Date
  attachments: { filename: string; content: Buffer; size: number }[]
}

interface FetchResult {
  processed: number
  errors: number
  skipped: number
  details: Array<{
    subject: string
    from: string
    status: 'success' | 'error' | 'skipped'
    tenantName?: string
    reportCount?: number
    error?: string
  }>
}

// ─── STEP 1: Connection test ─────────────────────────────────────────

/**
 * Tests IMAP connection and folder access. Returns diagnostics.
 */
export async function testConnection(): Promise<{
  connected: boolean
  folder: string
  totalMessages: number
  unseenMessages: number
  error?: string
}> {
  const client = new ImapFlow({
    host: IMAP_CONFIG.host,
    port: IMAP_CONFIG.port,
    secure: true,
    auth: { user: IMAP_CONFIG.user, pass: IMAP_CONFIG.pass },
    logger: false,
  })

  try {
    await client.connect()
    console.log('[email-fetcher] IMAP connected successfully')

    const mailbox = await client.getMailboxLock(IMAP_CONFIG.folder)
    const status = client.mailbox
    const total = (status && typeof status === 'object' && 'exists' in status) ? (status as any).exists : 0

    // Count unseen messages
    let unseenCount = 0
    try {
      const unseen = await client.search({ seen: false })
      unseenCount = Array.isArray(unseen) ? unseen.length : 0
    } catch {
      // folder might be empty
    }

    mailbox.release()
    await client.logout()

    return {
      connected: true,
      folder: IMAP_CONFIG.folder,
      totalMessages: total,
      unseenMessages: unseenCount,
    }
  } catch (err: any) {
    console.error('[email-fetcher] Connection test failed:', err.message)
    try { await client.logout() } catch {}
    return {
      connected: false,
      folder: IMAP_CONFIG.folder,
      totalMessages: 0,
      unseenMessages: 0,
      error: err.message,
    }
  }
}

// ─── STEP 2: Fetch emails from IMAP ─────────────────────────────────

/**
 * Connects to IMAP, fetches unseen emails from the configured folder,
 * parses them with mailparser, and returns structured EmailMessage objects.
 */
async function fetchEmailsFromImap(): Promise<{
  messages: Array<EmailMessage & { uid: number }>
  client: ImapFlow
}> {
  const client = new ImapFlow({
    host: IMAP_CONFIG.host,
    port: IMAP_CONFIG.port,
    secure: true,
    auth: { user: IMAP_CONFIG.user, pass: IMAP_CONFIG.pass },
    logger: false,
  })

  await client.connect()
  console.log('[email-fetcher] Connected to IMAP')

  await client.getMailboxLock(IMAP_CONFIG.folder)
  console.log(`[email-fetcher] Opened folder: ${IMAP_CONFIG.folder}`)

  // Search for unseen (unread) messages
  const searchResult = await client.search({ seen: false })
  const unseenUids = Array.isArray(searchResult) ? searchResult : []
  console.log(`[email-fetcher] Found ${unseenUids.length} unseen messages`)

  if (unseenUids.length === 0) {
    return { messages: [], client }
  }

  const messages: Array<EmailMessage & { uid: number }> = []

  for (const uid of unseenUids) {
    try {
      const download = await client.download(uid.toString(), undefined, { uid: true })
      const parsed = await simpleParser(download.content)

      // Extract "to" address
      const toAddr = parsed.to
      let toEmail = ''
      if (toAddr) {
        const addrObj = (Array.isArray(toAddr) ? toAddr[0] : toAddr) as AddressObject
        toEmail = addrObj?.value?.[0]?.address || ''
      }

      // Extract "from" address
      const fromAddr = parsed.from
      const fromEmail = fromAddr?.value?.[0]?.address || parsed.from?.text || 'unknown'

      // Extract attachments (DMARC reports come as compressed archives or raw XML)
      const ALLOWED_EXTENSIONS = ['.xml', '.zip', '.gz', '.gzip', '.7z', '.tar.gz', '.tgz']
      const attachments = (parsed.attachments || [])
        .filter(att => {
          const name = (att.filename || '').toLowerCase()
          return ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
        })
        .map(att => ({
          filename: att.filename || `attachment_${Date.now()}`,
          content: att.content,
          size: att.size,
        }))

      messages.push({
        uid,
        from: fromEmail,
        to: toEmail,
        subject: parsed.subject || '(no subject)',
        date: parsed.date || new Date(),
        attachments,
      })

      console.log(`[email-fetcher] Parsed email: "${parsed.subject}" from ${fromEmail}, ${attachments.length} DMARC attachment(s)`)
    } catch (err: any) {
      console.error(`[email-fetcher] Failed to parse email UID ${uid}:`, err.message)
    }
  }

  return { messages, client }
}

// ─── STEP 3: Process inbound email → tenant routing ──────────────────

/**
 * Processes a single inbound DMARC report email.
 * Routes the attachment to the correct tenant and triggers ingestion.
 */
export async function processInboundEmail(message: EmailMessage) {
  // Extract the alias from the To address
  const alias = message.to.toLowerCase().trim()

  // Resolve tenant by email alias
  const tenant = await resolveTenantByEmailAlias(alias)
  if (!tenant) {
    console.warn(`[email-fetcher] No tenant found for alias: ${alias}`)
    return { processed: false, reason: 'no_tenant_match', alias }
  }

  if (message.attachments.length === 0) {
    console.warn(`[email-fetcher] No attachments in email from ${message.from}`)
    return { processed: false, reason: 'no_attachments' }
  }

  const results = []

  for (const attachment of message.attachments) {
    console.log(`[email-fetcher] Ingesting: ${attachment.filename} (${attachment.size} bytes) for tenant: ${tenant.name}`)
    const result = await ingestReport({
      tenantId: tenant.id,
      buffer: attachment.content,
      fileName: attachment.filename,
      fileSize: attachment.size,
      source: 'email',
    })
    results.push(result)
  }

  return {
    processed: true,
    tenantId: tenant.id,
    tenantName: tenant.name,
    results,
  }
}

// ─── STEP 4: Mark processed emails as read ───────────────────────────

async function markAsRead(client: ImapFlow, uid: number) {
  try {
    await client.messageFlagsAdd(uid.toString(), ['\\Seen'], { uid: true })
    console.log(`[email-fetcher] Marked UID ${uid} as read`)
  } catch (err: any) {
    console.error(`[email-fetcher] Failed to mark UID ${uid} as read:`, err.message)
  }
}

// ─── STEP 5: Full orchestrator ───────────────────────────────────────

/**
 * Fetches and processes new emails from the centralized mailbox.
 * 1. Connect to IMAP
 * 2. Open 'dmarc_report' folder
 * 3. Fetch unseen emails
 * 4. Extract DMARC attachments (xml, zip, gz)
 * 5. Route to tenant by recipient alias
 * 6. Ingest through pipeline
 * 7. Mark as read
 */
export async function fetchAndProcessEmails(): Promise<FetchResult> {
  console.log('[email-fetcher] ═══ Email fetch job started ═══')

  // Validate config
  if (!IMAP_CONFIG.user || !IMAP_CONFIG.pass) {
    console.error('[email-fetcher] Missing EMAIL_IMAP_USER or EMAIL_IMAP_PASS')
    return { processed: 0, errors: 1, skipped: 0, details: [{ subject: 'Config', from: '', status: 'error', error: 'Missing IMAP credentials' }] }
  }

  let client: ImapFlow | null = null
  const result: FetchResult = { processed: 0, errors: 0, skipped: 0, details: [] }

  try {
    // Fetch emails
    const { messages, client: imapClient } = await fetchEmailsFromImap()
    client = imapClient

    if (messages.length === 0) {
      console.log('[email-fetcher] No new emails to process')
      return result
    }

    console.log(`[email-fetcher] Processing ${messages.length} email(s)...`)

    for (const msg of messages) {
      try {
        // Skip emails with no DMARC attachments
        if (msg.attachments.length === 0) {
          console.log(`[email-fetcher] Skipping "${msg.subject}" — no DMARC attachments`)
          result.skipped++
          result.details.push({
            subject: msg.subject,
            from: msg.from,
            status: 'skipped',
            error: 'No XML/ZIP/GZ attachments found',
          })
          // Still mark as read so we don't re-process
          await markAsRead(client, msg.uid)
          continue
        }

        // Process through ingestion pipeline
        const ingestionResult = await processInboundEmail(msg)

        if (ingestionResult.processed) {
          result.processed++
          const reportCount = ingestionResult.results?.reduce((sum, r) => sum + (r.reportCount || 0), 0) || 0
          result.details.push({
            subject: msg.subject,
            from: msg.from,
            status: 'success',
            tenantName: ingestionResult.tenantName,
            reportCount,
          })
          console.log(`[email-fetcher] ✓ Processed "${msg.subject}" → ${ingestionResult.tenantName} (${reportCount} reports)`)
        } else {
          result.skipped++
          result.details.push({
            subject: msg.subject,
            from: msg.from,
            status: 'skipped',
            error: ingestionResult.reason,
          })
          console.log(`[email-fetcher] ⚠ Skipped "${msg.subject}" — ${ingestionResult.reason}`)
        }

        // Mark as read after processing
        await markAsRead(client, msg.uid)

      } catch (err: any) {
        result.errors++
        result.details.push({
          subject: msg.subject,
          from: msg.from,
          status: 'error',
          error: err.message,
        })
        console.error(`[email-fetcher] ✗ Error processing "${msg.subject}":`, err.message)
        // Still mark as read to avoid infinite retry loop
        await markAsRead(client, msg.uid)
      }
    }
  } catch (err: any) {
    console.error('[email-fetcher] Fatal error:', err.message)
    result.errors++
    result.details.push({ subject: 'Connection', from: '', status: 'error', error: err.message })
  } finally {
    if (client) {
      try {
        client.mailbox && (await client.getMailboxLock(IMAP_CONFIG.folder)).release()
      } catch {}
      try { await client.logout() } catch {}
    }
  }

  console.log(`[email-fetcher] ═══ Job complete: ${result.processed} processed, ${result.errors} errors, ${result.skipped} skipped ═══`)
  return result
}
