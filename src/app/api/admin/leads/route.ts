import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/admin-guard'

// INMYBOX ENHANCEMENT — Phase 4 M5: DomainScan is intentionally NOT tenant-scoped.
// This table stores public domain scan results from the free landing page scanner.
// It has no tenantId because scans happen before authentication.
// Access is restricted to super_admin only via requireSuperAdmin() guard.

export async function GET(req: NextRequest) {
  const guard = await requireSuperAdmin()
  if (guard instanceof NextResponse) return guard

  const url = req.nextUrl
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const search = url.searchParams.get('search')?.trim()
  const rawRisk = url.searchParams.get('risk')?.trim()
  const hasEmail = url.searchParams.get('hasEmail')
  const format = url.searchParams.get('format') // csv

  // INMYBOX ENHANCEMENT — Phase 2 M2: Validate risk enum before using in WHERE clause
  const validRiskLevels = ['critical', 'high', 'medium', 'low']
  const risk = rawRisk && validRiskLevels.includes(rawRisk) ? rawRisk : undefined

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { domain: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (risk) where.riskLevel = risk
  if (hasEmail === 'true') where.email = { not: null }
  if (hasEmail === 'false') where.email = null

  // CSV Export
  if (format === 'csv') {
    const scans = await prisma.domainScan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const header = 'ID,Domain,Score,Risk Level,DMARC,SPF,DKIM,Config,Email,IP Address,Country,User Agent,Scanned At'
    const rows = scans.map(s => [
      s.id,
      s.domain,
      s.score,
      s.riskLevel,
      s.dmarcScore,
      s.spfScore,
      s.dkimScore,
      s.configScore,
      s.email || '',
      s.ipAddress || '',
      s.country || '',
      `"${(s.userAgent || '').replace(/"/g, '""')}"`,
      s.createdAt.toISOString(),
    ].join(','))

    const csv = [header, ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="inmybox-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [scans, total] = await Promise.all([
    prisma.domainScan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.domainScan.count({ where }),
  ])

  // Summary stats
  const [totalScans, leadsWithEmail, riskBreakdown] = await Promise.all([
    prisma.domainScan.count(),
    prisma.domainScan.count({ where: { email: { not: null } } }),
    prisma.domainScan.groupBy({
      by: ['riskLevel'],
      _count: true,
    }),
  ])

  return NextResponse.json({
    scans,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    summary: {
      totalScans,
      leadsWithEmail,
      riskBreakdown: Object.fromEntries(
        riskBreakdown.map(r => [r.riskLevel, r._count])
      ),
    },
  })
}
