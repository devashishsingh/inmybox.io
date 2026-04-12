import { NextRequest, NextResponse } from 'next/server'

// This endpoint fans out to the existing /api/scan for each domain
// and returns per-domain results + an aggregate summary.

const MAX_DOMAINS = 20

function isValidDomain(domain: string): boolean {
  if (domain.length > 253) return false
  const pattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/
  return pattern.test(domain)
}

export async function POST(req: NextRequest) {
  let body: { domains?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const domains = body.domains
  if (!Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json({ error: 'Provide a non-empty "domains" array' }, { status: 400 })
  }

  if (domains.length > MAX_DOMAINS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DOMAINS} domains per batch scan` },
      { status: 400 }
    )
  }

  // Validate + deduplicate
  const unique = Array.from(new Set(domains.map((d: string) => d.trim().toLowerCase())))
  const invalid = unique.filter(d => !isValidDomain(d))
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid domain(s): ${invalid.join(', ')}` },
      { status: 400 }
    )
  }

  // Build internal scan URL (same origin)
  const origin = req.nextUrl.origin

  // Fan out scans in parallel
  const scanResults = await Promise.allSettled(
    unique.map(async (domain) => {
      const res = await fetch(`${origin}/api/scan?domain=${encodeURIComponent(domain)}`, {
        headers: {
          'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
          'user-agent': req.headers.get('user-agent') || '',
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { domain, error: err.error || 'Scan failed', result: null }
      }
      const data = await res.json()
      return { domain, error: null, result: data }
    })
  )

  const results = scanResults.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return { domain: unique[i], error: 'Scan failed', result: null }
  })

  // Aggregate
  const successful = results.filter(r => r.result !== null)
  const failed = results.filter(r => r.result === null)

  if (successful.length === 0) {
    return NextResponse.json({
      results,
      aggregate: null,
      error: 'All domain scans failed',
    })
  }

  // Calculate aggregate metrics
  const scores = successful.map(r => r.result.score)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  // Worst risk level
  const riskOrder = ['critical', 'high', 'medium', 'healthy'] as const
  let worstRisk: typeof riskOrder[number] = 'healthy'
  for (const r of successful) {
    const idx = riskOrder.indexOf(r.result.riskLevel)
    const worstIdx = riskOrder.indexOf(worstRisk)
    if (idx < worstIdx) worstRisk = r.result.riskLevel
  }

  // Aggregate revenue impact
  let totalEmailsLost = 0
  let totalLeadsLost = 0
  let totalRevenueAtRisk = 0

  for (const r of successful) {
    const ri = r.result.revenueImpact
    if (ri) {
      totalEmailsLost += ri.monthly.emailsLost
      totalLeadsLost += ri.monthly.potentialLeadsLost
      totalRevenueAtRisk += ri.monthly.revenueAtRisk
    }
  }

  // Collect all unique risk factors across domains
  const riskFactorMap = new Map<string, { factor: string; impact: string; description: string; domains: string[] }>()
  for (const r of successful) {
    const ri = r.result.revenueImpact
    if (ri?.riskFactors) {
      for (const rf of ri.riskFactors) {
        const existing = riskFactorMap.get(rf.factor)
        if (existing) {
          existing.domains.push(r.domain)
        } else {
          riskFactorMap.set(rf.factor, { ...rf, domains: [r.domain] })
        }
      }
    }
  }

  // Count by risk level
  const riskDistribution = {
    critical: successful.filter(r => r.result.riskLevel === 'critical').length,
    high: successful.filter(r => r.result.riskLevel === 'high').length,
    medium: successful.filter(r => r.result.riskLevel === 'medium').length,
    healthy: successful.filter(r => r.result.riskLevel === 'healthy').length,
  }

  const aggregate = {
    domainsScanned: successful.length,
    domainsFailed: failed.length,
    averageScore: avgScore,
    worstRiskLevel: worstRisk,
    riskDistribution,
    totalEmailsLost,
    totalLeadsLost,
    totalRevenueAtRisk,
    totalRevenueAtRiskYearly: totalRevenueAtRisk * 12,
    riskFactors: Array.from(riskFactorMap.values()),
  }

  return NextResponse.json({ results, aggregate })
}
