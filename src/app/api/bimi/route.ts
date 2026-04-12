import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import {
  runFullBimiCheck,
  updateBimiAssets,
  getBimiStatus,
  markBimiPublished,
  validateBimiAssets,
  detectEmailProvider,
} from '@/lib/services/bimi.service'
import { prisma } from '@/lib/prisma'

// GET — fetch BIMI status for a domain
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const domainId = searchParams.get('domainId')

  // If no domainId, return all domains with BIMI status
  if (!domainId) {
    const domains = await prisma.domain.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        domain: true,
        bimiConfigs: {
          select: {
            id: true,
            readinessScore: true,
            readinessStatus: true,
            overallStatus: true,
            lastCheckAt: true,
            logoUrl: true,
            certificateUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ domains })
  }

  // Specific domain BIMI status
  const config = await getBimiStatus(ctx.tenantId, domainId)
  if (!config) {
    return NextResponse.json({ config: null })
  }

  return NextResponse.json({ config })
}

// POST — run a full BIMI check or specific action
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const ctx = await resolveTenantContext(userId)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  const body = await req.json()
  const { action, domainId, logoUrl, certificateUrl } = body

  if (!domainId) {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 })
  }

  // Verify domain belongs to tenant
  const domain = await prisma.domain.findFirst({
    where: { id: domainId, tenantId: ctx.tenantId },
  })
  if (!domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  }

  switch (action) {
    case 'check': {
      const result = await runFullBimiCheck(ctx.tenantId, domainId)
      return NextResponse.json({ result })
    }

    case 'update-assets': {
      if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'Logo URL must use HTTPS' }, { status: 400 })
      }
      if (certificateUrl && typeof certificateUrl === 'string' && !certificateUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'Certificate URL must use HTTPS' }, { status: 400 })
      }
      const config = await updateBimiAssets(ctx.tenantId, domainId, { logoUrl, certificateUrl })
      return NextResponse.json({ config })
    }

    case 'validate-assets': {
      const result = await validateBimiAssets(logoUrl, certificateUrl)
      return NextResponse.json({ result })
    }

    case 'mark-published': {
      const config = await markBimiPublished(ctx.tenantId, domainId)
      return NextResponse.json({ config })
    }

    case 'detect-provider': {
      const provider = await detectEmailProvider(domain.domain)
      return NextResponse.json({ provider })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
