// INMYBOX MVP IMPROVEMENT — XML Extraction Hardening — 2026-04-13
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { ingestReport } from '@/lib/services/ingestion.service'
import { ExtractionError } from '@/lib/dmarc-parser'

// INMYBOX MVP IMPROVEMENT — Structured error messages for extraction failures
const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  FILE_TOO_LARGE:        { message: 'This file is too large (max 10MB). DMARC reports are typically under 1MB.', status: 413 },
  INVALID_TYPE:          { message: 'Please upload a .zip, .gz, or .xml file. Most email providers send DMARC reports as .zip or .gz compressed files.', status: 415 },
  ZIP_BOMB_DETECTED:     { message: 'This file has an unusual compression ratio and could not be processed safely.', status: 422 },
  TOO_MANY_FILES:        { message: 'This ZIP contains too many files (max 50). Standard DMARC report ZIPs contain 1-5 files.', status: 422 },
  INVALID_DMARC_REPORT:  { message: 'This does not appear to be a DMARC report. Check you are uploading the right file from your DMARC reporting inbox.', status: 422 },
  EXTRACTION_FAILED:     { message: 'We could not process this report. Please try again or contact support.', status: 500 },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const ctx = await resolveTenantContext(userId)

    if (!ctx) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await ingestReport({
      tenantId: ctx.tenantId,
      buffer,
      fileName: file.name,
      fileSize: file.size,
      source: 'upload',
    })

    return NextResponse.json({
      success: result.success,
      reportCount: result.reportCount,
      recordCount: result.recordCount,
      processingMs: result.processingMs,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('[upload] Report upload failed:', error.constructor?.name)
    // INMYBOX MVP IMPROVEMENT — Structured error responses for extraction failures
    if (error instanceof ExtractionError) {
      const mapped = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.EXTRACTION_FAILED
      return NextResponse.json(
        { error: mapped.message, code: error.code, supportId: error.supportId },
        { status: mapped.status }
      )
    }
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
