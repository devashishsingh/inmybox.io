import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { ingestReport } from '@/lib/services/ingestion.service'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id
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
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
