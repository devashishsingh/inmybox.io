import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/utils/crypto'
import { ingestReport } from './ingestion.service'
import { purgeDemoData } from './demo-data.service'
import { triggerFirstReportCelebration } from './onboarding.service'
import type { IngestionSource } from '@/types'

/**
 * Polls all active MailboxConnections, fetches new DMARC report emails,
 * and runs them through the ingestion pipeline.
 *
 * Called from the cron route every 15-60 minutes depending on plan.
 */
export async function pollAllMailboxes(): Promise<{ tenantId: string; processed: number; errors: string[] }[]> {
  const connections = await prisma.mailboxConnection.findMany({
    where: { status: 'active' },
    include: {
      tenant: {
        include: {
          domains: { orderBy: { createdAt: 'asc' }, take: 1 },
        },
      },
    },
  })

  const results = []

  for (const conn of connections) {
    const result = await pollSingleMailbox(conn)
    results.push({ tenantId: conn.tenantId, ...result })
  }

  return results
}

async function pollSingleMailbox(conn: any): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = []
  let processed = 0

  try {
    if (conn.provider === 'google' || conn.provider === 'microsoft') {
      processed = await pollOAuthMailbox(conn, errors)
    } else if (conn.provider === 'imap') {
      processed = await pollImapMailbox(conn, errors)
    }

    await prisma.mailboxConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), status: 'active', errorMessage: null },
    })
  } catch (err: any) {
    const msg = err.message || 'Unknown error'
    errors.push(msg)
    await prisma.mailboxConnection.update({
      where: { id: conn.id },
      data: { status: 'error', errorMessage: msg.slice(0, 500) },
    })
  }

  return { processed, errors }
}

async function pollOAuthMailbox(conn: any, errors: string[]): Promise<number> {
  const { ImapFlow } = await import('imapflow')
  let processed = 0

  const accessToken = conn.accessToken ? decrypt(conn.accessToken) : null
  if (!accessToken) throw new Error('No access token available')

  const host = conn.provider === 'google' ? 'imap.gmail.com' : 'outlook.office365.com'
  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user: conn.email, accessToken },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const searchResult = await client.search({ seen: false })
      const uids = Array.isArray(searchResult) ? searchResult.slice(0, 50) : []

      for (const uid of uids) {
        try {
          const download = await client.download(uid.toString(), undefined, { uid: false })
          if (!download) continue

          const { simpleParser } = await import('mailparser')
          const parsed = await simpleParser(download.content)

          for (const att of (parsed.attachments || [])) {
            const name = att.filename || 'attachment'
            const isReport = /\.(zip|gz|xml)$/i.test(name) ||
              ['application/zip', 'application/gzip', 'application/x-gzip', 'text/xml', 'application/xml'].includes(att.contentType)

            if (isReport && att.size < 50 * 1024 * 1024) {
              const ingested = await ingestAndNotify(conn.tenantId, att.content as Buffer, name, att.size, 'email')
              if (ingested) processed++
            }
          }

          await client.messageFlagsAdd(uid.toString(), ['\\Seen'])
        } catch (err: any) {
          errors.push(`UID ${uid}: ${err.message}`)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (err) {
    try { await client.logout() } catch {}
    throw err
  }

  return processed
}

async function pollImapMailbox(conn: any, errors: string[]): Promise<number> {
  const { ImapFlow } = await import('imapflow')
  const password = conn.imapPass ? decrypt(conn.imapPass) : null
  if (!password) throw new Error('No IMAP password stored')

  const client = new ImapFlow({
    host: conn.imapHost,
    port: conn.imapPort || 993,
    secure: conn.imapPort === 993,
    auth: { user: conn.imapUser, pass: password },
    logger: false,
  })

  let processed = 0

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const searchResult = await client.search({ seen: false })
      const uids = Array.isArray(searchResult) ? searchResult.slice(0, 50) : []

      for (const uid of uids) {
        try {
          const download = await client.download(uid.toString(), undefined, { uid: false })
          if (!download) continue

          const { simpleParser } = await import('mailparser')
          const parsed = await simpleParser(download.content)

          for (const att of (parsed.attachments || [])) {
            const name = att.filename || 'attachment'
            const isReport = /\.(zip|gz|xml)$/i.test(name) ||
              ['application/zip', 'application/gzip', 'application/x-gzip', 'text/xml', 'application/xml'].includes(att.contentType)

            if (isReport && att.size < 50 * 1024 * 1024) {
              const ingested = await ingestAndNotify(conn.tenantId, att.content as Buffer, name, att.size, 'email')
              if (ingested) processed++
            }
          }

          await client.messageFlagsAdd(uid.toString(), ['\\Seen'])
        } catch (err: any) {
          errors.push(`UID ${uid}: ${err.message}`)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (err) {
    try { await client.logout() } catch {}
    throw err
  }

  return processed
}

/**
 * Ingests a report and fires post-ingestion hooks (demo purge, celebration email).
 */
async function ingestAndNotify(tenantId: string, buffer: Buffer, fileName: string, size: number, source: IngestionSource): Promise<boolean> {
  try {
    const result = await ingestReport({ tenantId, buffer, fileName, fileSize: size, source })
    if (!result.success) return false

    // Get domain for post-ingestion hooks
    const domain = await prisma.domain.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } })
    if (domain) {
      await purgeDemoData(domain.id, tenantId).catch(() => {})

      // Check if this was the first real report
      const checklist = await prisma.onboardingChecklist.findUnique({ where: { tenantId } })
      if (!checklist?.firstReportReceived) {
        await prisma.onboardingChecklist.update({
          where: { tenantId },
          data: { firstReportReceived: true },
        })
        await triggerFirstReportCelebration(tenantId, domain.domain).catch(() => {})
      }
    }

    return true
  } catch {
    return false
  }
}
