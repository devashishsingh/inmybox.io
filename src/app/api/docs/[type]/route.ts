import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { OnboardingGuidePDF, AppWorkflowPDF } from '@/lib/pdf/documents'

export const dynamic = 'force-dynamic'

// Cast renderToBuffer to avoid react-pdf's strict DocumentProps typing
const render = renderToBuffer as (_el: React.ReactElement) => Promise<Buffer>

const ALLOWED_DOCS = ['onboarding-guide', 'app-workflow'] as const
type DocType = typeof ALLOWED_DOCS[number]

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string } }
) {
  const type = params.type as DocType

  if (!ALLOWED_DOCS.includes(type)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  let buffer: Buffer
  let filename: string

  if (type === 'onboarding-guide') {
    buffer = await render(React.createElement(OnboardingGuidePDF, { generatedDate: date }))
    filename = 'inmybox-client-onboarding-guide.pdf'
  } else {
    buffer = await render(React.createElement(AppWorkflowPDF, { generatedDate: date }))
    filename = 'inmybox-application-workflow.pdf'
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
