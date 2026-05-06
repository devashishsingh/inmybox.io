import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ingestReport } from '@/lib/services/ingestion.service'
import crypto from 'crypto'

/**
 * POST /api/email-inbound
 *
 * SendGrid Inbound Parse webhook handler.
 * Receives parsed email + attachments, looks up tenant by alias,
 * and routes DMARC report attachments through the ingestion pipeline.
 *
 * Setup:
 *   - MX record: rua.inmybox.io → mx.sendgrid.net (priority 10)
 *   - SendGrid Inbound Parse → POST https://app.inmybox.io/api/email-inbound
 *   - "Send Raw" OFF (use parsed form data)
 *
 * Required env vars:
 *   SENDGRID_WEBHOOK_VERIFICATION_KEY — ECDSA public key from SendGrid dashboard
 */

const ALLOWED_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-gzip',
  'text/xml',
  'application/xml',
])

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024 // 50 MB

function verifySendGridSignature(req: NextRequest, rawBody: string): boolean {
  const pubKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY
  if (!pubKey) {
    // Not configured — skip verification in dev, block in production
    if (process.env.NODE_ENV === 'production') return false
    return true
  }

  const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature') || ''
  const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp') || ''

  try {
    const verifier = crypto.createVerify('SHA256')
    verifier.update(timestamp + rawBody)
    return verifier.verify(
      { key: pubKey, format: 'pem', type: 'spki' },
      signature,
      'base64'
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await req.text()

  if (!verifySendGridSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  // Parse multipart form from raw body
  let formData: FormData
  try {
    const contentType = req.headers.get('content-type') || ''
    const newReq = new Request(req.url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: rawBody,
    })
    formData = await newReq.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 })
  }

  const to = (formData.get('to') as string || '').toLowerCase().trim()
  const envelope = formData.get('envelope') as string

  // Resolve recipient alias (handle "Name <alias@rua.inmybox.io>" format)
  const toAddress = extractEmail(to) || extractEmailFromEnvelope(envelope)

  if (!toAddress) {
    return NextResponse.json({ error: 'No recipient address found' }, { status: 400 })
  }

  // Lookup tenant by alias
  const aliasMapping = await prisma.aliasMapping.findFirst({
    where: { alias: toAddress, isActive: true },
    include: { tenant: true },
  })

  if (!aliasMapping) {
    // No matching alias — silently accept to avoid SendGrid retries
    console.warn(`[email-inbound] No alias found for: ${toAddress}`)
    return NextResponse.json({ received: true })
  }

  const tenantId = aliasMapping.tenantId

  // Process attachments asynchronously — respond 200 immediately to prevent SendGrid timeout retries
  ;(async () => {
    const attachmentCount = parseInt((formData.get('attachments') as string) || '0', 10)

    for (let i = 1; i <= Math.min(attachmentCount, 10); i++) {
      const file = formData.get(`attachment${i}`) as File | null
      if (!file) continue

      const mimeType = file.type || ''
      const fileName = file.name || `attachment${i}`

      // Check by MIME type or extension
      const isAllowed =
        ALLOWED_MIME_TYPES.has(mimeType) ||
        /\.(zip|gz|xml)$/i.test(fileName)

      if (!isAllowed) continue

      if (file.size > MAX_ATTACHMENT_SIZE) {
        console.warn(`[email-inbound] Attachment too large: ${file.size} bytes (${fileName})`)
        continue
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        await ingestReport({
          tenantId,
          buffer,
          fileName,
          fileSize: file.size,
          source: 'email',
        })
      } catch (err) {
        console.error(`[email-inbound] Ingestion failed for ${fileName}:`, err)
      }
    }
  })()

  return NextResponse.json({ received: true })
}

function extractEmail(raw: string): string | null {
  if (!raw) return null
  const match = raw.match(/<([^>]+@[^>]+)>/)
  if (match) return match[1].toLowerCase()
  if (raw.includes('@')) return raw.split(',')[0].trim().toLowerCase()
  return null
}

function extractEmailFromEnvelope(envelope: string | null): string | null {
  if (!envelope) return null
  try {
    const parsed = JSON.parse(envelope)
    if (parsed.to && Array.isArray(parsed.to) && parsed.to[0]) {
      return parsed.to[0].toLowerCase()
    }
  } catch {}
  return null
}
