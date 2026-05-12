// INMYBOX SCANNER — 2026-05-12
// Public, unauthenticated DNS-based domain email-security scanner.
// Uses Node built-in dns.promises only. No new npm packages.

import { NextRequest, NextResponse } from 'next/server'
import { promises as dnsPromises } from 'dns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* ─── Dedicated resolver using public DNS ────────────────────────── */
// Use public resolvers so results are consistent regardless of the host's
// DNS configuration (some hosts block outbound DNS to default resolvers).
const resolver = new dnsPromises.Resolver({ timeout: 2500, tries: 2 })
resolver.setServers(['1.1.1.1', '8.8.8.8', '9.9.9.9'])

const dns = {
  resolveTxt: (h: string) => resolver.resolveTxt(h),
  resolveMx: (h: string) => resolver.resolveMx(h),
  resolve4: (h: string) => resolver.resolve4(h),
  resolve6: (h: string) => resolver.resolve6(h),
}

/* ─── In-memory rate limiter (per IP) ────────────────────────────── */
type Hit = { count: number; resetAt: number }
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const hits = new Map<string, Hit>()

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

function checkRateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const existing = hits.get(ip)
  if (!existing || existing.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true, retryAfter: 0 }
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) }
  }
  existing.count += 1
  return { ok: true, retryAfter: 0 }
}

// Opportunistic cleanup so the map doesn't grow forever
function maybeSweep() {
  if (hits.size < 500) return
  const now = Date.now()
  hits.forEach((v, k) => {
    if (v.resetAt <= now) hits.delete(k)
  })
}

/* ─── Domain validation ──────────────────────────────────────────── */
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/

function validateDomain(raw: unknown): { ok: true; domain: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Please enter a valid domain name (e.g. yourcompany.com)' }
  let d = raw.trim().toLowerCase()
  if (!d) return { ok: false, error: 'Please enter a valid domain name (e.g. yourcompany.com)' }
  if (/\s/.test(d) || d.includes('/') || d.includes(':')) {
    return { ok: false, error: 'Please enter a valid domain name (e.g. yourcompany.com)' }
  }
  if (d.length > 253) return { ok: false, error: 'Please enter a valid domain name (e.g. yourcompany.com)' }
  if (!DOMAIN_RE.test(d)) return { ok: false, error: 'Please enter a valid domain name (e.g. yourcompany.com)' }
  return { ok: true, domain: d }
}

/* ─── Utilities ──────────────────────────────────────────────────── */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      () => { clearTimeout(t); resolve(null) },
    )
  })
}

function flattenTxt(records: string[][]): string[] {
  return records.map((r) => r.join(''))
}

/* ─── DMARC ──────────────────────────────────────────────────────── */
type DmarcResult = {
  found: boolean
  policy?: 'none' | 'quarantine' | 'reject'
  rua?: string
  ruf?: string
  record?: string
  status: 'pass' | 'warning' | 'critical'
}

async function checkDmarc(domain: string, timeoutMs = 4000): Promise<DmarcResult | null> {
  const records = await withTimeout(dns.resolveTxt(`_dmarc.${domain}`).catch(() => [] as string[][]), timeoutMs)
  if (records === null) return null // timeout
  const flat = flattenTxt(records)
  const rec = flat.find((r) => /^v=dmarc1/i.test(r.trim()))
  if (!rec) return { found: false, status: 'critical' }
  const policyMatch = rec.match(/p\s*=\s*(none|quarantine|reject)/i)
  const ruaMatch = rec.match(/rua\s*=\s*([^;]+)/i)
  const rufMatch = rec.match(/ruf\s*=\s*([^;]+)/i)
  const policy = policyMatch?.[1]?.toLowerCase() as 'none' | 'quarantine' | 'reject' | undefined
  const status: DmarcResult['status'] =
    policy === 'reject' ? 'pass' : policy === 'quarantine' ? 'warning' : 'warning'
  return {
    found: true,
    policy,
    rua: ruaMatch?.[1]?.trim(),
    ruf: rufMatch?.[1]?.trim(),
    record: rec,
    status: policy ? status : 'warning',
  }
}

/* ─── SPF ────────────────────────────────────────────────────────── */
type SpfResult = {
  found: boolean
  lookupCount?: number
  record?: string
  status: 'pass' | 'warning' | 'critical'
}

function countSpfLookups(record: string): number {
  // Mechanisms that cost a DNS lookup per RFC 7208
  const tokens = record.split(/\s+/)
  let count = 0
  for (const t of tokens) {
    const lower = t.toLowerCase()
    if (
      lower.startsWith('include:') ||
      lower.startsWith('a:') || lower === 'a' || lower.startsWith('a/') ||
      lower.startsWith('mx:') || lower === 'mx' || lower.startsWith('mx/') ||
      lower.startsWith('exists:') ||
      lower.startsWith('redirect=') ||
      lower.startsWith('ptr:') || lower === 'ptr'
    ) {
      count += 1
    }
  }
  return count
}

async function checkSpf(domain: string, timeoutMs = 4000): Promise<SpfResult | null> {
  const records = await withTimeout(dns.resolveTxt(domain).catch(() => [] as string[][]), timeoutMs)
  if (records === null) return null
  const flat = flattenTxt(records)
  const rec = flat.find((r) => /^v=spf1/i.test(r.trim()))
  if (!rec) return { found: false, status: 'critical' }
  const lookups = countSpfLookups(rec)
  const status: SpfResult['status'] = lookups > 10 ? 'warning' : 'pass'
  return { found: true, lookupCount: lookups, record: rec, status }
}

/* ─── DKIM ───────────────────────────────────────────────────────── */
type DkimResult = {
  found: boolean
  selectors: string[]
  status: 'pass' | 'critical'
}

const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'dkim', 'k1', 's1', 's2', 'mail']

async function checkDkim(domain: string, timeoutMs = 3000): Promise<DkimResult> {
  const results = await Promise.all(
    DKIM_SELECTORS.map(async (sel) => {
      const recs = await withTimeout(
        dns.resolveTxt(`${sel}._domainkey.${domain}`).catch(() => [] as string[][]),
        timeoutMs,
      )
      if (!recs || recs.length === 0) return null
      const flat = flattenTxt(recs)
      const hit = flat.find((r) => /v=dkim1/i.test(r) || /p=/i.test(r))
      return hit ? sel : null
    }),
  )
  const found = results.filter((s): s is string => Boolean(s))
  return { found: found.length > 0, selectors: found, status: found.length > 0 ? 'pass' : 'critical' }
}

/* ─── MX ─────────────────────────────────────────────────────────── */
type MxResult = {
  found: boolean
  servers: string[]
  status: 'pass' | 'critical'
}

async function checkMx(domain: string, timeoutMs = 4000): Promise<MxResult | null> {
  const recs = await withTimeout(dns.resolveMx(domain).catch(() => [] as { exchange: string; priority: number }[]), timeoutMs)
  if (recs === null) return null
  const servers = recs.map((r) => r.exchange).filter(Boolean)
  return { found: servers.length > 0, servers, status: servers.length > 0 ? 'pass' : 'critical' }
}

/* ─── Subdomain scan ─────────────────────────────────────────────── */
const SUBDOMAIN_PREFIXES = [
  'mail', 'email', 'marketing', 'events', 'newsletter', 'support', 'notifications', 'noreply',
]

type SubdomainResult = {
  name: string
  exists: true
  dmarc: { found: boolean; policy?: string; status: 'pass' | 'warning' | 'critical' }
  spf: { found: boolean; status: 'pass' | 'warning' | 'critical' }
}

async function subdomainExists(name: string, timeoutMs = 3000): Promise<boolean> {
  // Try A first, then AAAA — either resolution means the subdomain exists
  const a = await withTimeout(dns.resolve4(name).catch(() => null), timeoutMs)
  if (a && a.length > 0) return true
  const aaaa = await withTimeout(dns.resolve6(name).catch(() => null), timeoutMs)
  return !!(aaaa && aaaa.length > 0)
}

async function checkSubdomain(name: string): Promise<SubdomainResult | null> {
  const exists = await subdomainExists(name, 3000)
  if (!exists) return null
  const [dmarc, spf] = await Promise.all([checkDmarc(name, 3000), checkSpf(name, 3000)])
  return {
    name,
    exists: true,
    dmarc: dmarc
      ? { found: dmarc.found, policy: dmarc.policy, status: dmarc.status }
      : { found: false, status: 'critical' },
    spf: spf
      ? { found: spf.found, status: spf.status }
      : { found: false, status: 'critical' },
  }
}

async function scanSubdomains(domain: string): Promise<SubdomainResult[]> {
  const all = Promise.all(SUBDOMAIN_PREFIXES.map((p) => checkSubdomain(`${p}.${domain}`)))
  const capped = await Promise.race([
    all,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
  ])
  if (!capped) return []
  return capped.filter((r): r is SubdomainResult => r !== null)
}

/* ─── Scoring & recommendations ──────────────────────────────────── */
function scoreScan(
  dmarc: DmarcResult | null,
  spf: SpfResult | null,
  dkim: DkimResult,
  mx: MxResult | null,
): number {
  let score = 0
  if (dmarc?.found) {
    if (dmarc.policy === 'reject') score += 40
    else if (dmarc.policy === 'quarantine') score += 25
    else score += 10
  }
  if (spf?.found) {
    score += (spf.lookupCount ?? 0) > 10 ? 15 : 25
  }
  if (dkim.found) score += 25
  if (mx?.found) score += 10
  return Math.max(0, Math.min(100, score))
}

type Risk = 'critical' | 'medium' | 'good' | 'excellent'
function riskFromScore(s: number): Risk {
  if (s >= 90) return 'excellent'
  if (s >= 70) return 'good'
  if (s >= 40) return 'medium'
  return 'critical'
}

function buildRecommendations(
  dmarc: DmarcResult | null,
  spf: SpfResult | null,
  dkim: DkimResult,
  subdomains: SubdomainResult[],
): string[] {
  const recs: string[] = []
  if (!dmarc?.found) {
    recs.push('No DMARC record found. Your domain has zero protection against email spoofing. Anyone can send emails pretending to be you.')
  } else if (dmarc.policy === 'none') {
    recs.push('Your DMARC policy is set to p=none — failing emails are still delivered. Move to p=quarantine or p=reject to protect your domain and revenue.')
  } else if (dmarc.policy === 'quarantine') {
    recs.push('Good — failing emails go to spam. Consider moving to p=reject for maximum protection.')
  }

  if (!spf?.found) {
    recs.push('No SPF record found. Email receivers cannot verify which servers are authorized to send for your domain.')
  } else if ((spf.lookupCount ?? 0) > 10) {
    recs.push(`Your SPF record uses ${spf.lookupCount} of 10 allowed DNS lookups. Exceeding 10 causes SPF to fail permanently. Consider SPF flattening.`)
  }

  if (!dkim.found) {
    recs.push('No DKIM signatures found on common selectors. Without DKIM, emails can be tampered with in transit without detection.')
  }

  const unprotected = subdomains.filter((s) => !s.dmarc.found).length
  if (unprotected > 0) {
    recs.push(`${unprotected} active subdomain${unprotected === 1 ? '' : 's'} have no DMARC protection. Each one can be impersonated by attackers and used to damage your domain reputation.`)
  }

  if (recs.length === 0) {
    recs.push('Your domain is well configured. Consider regular monitoring to catch changes before they affect deliverability.')
  }
  return recs
}

/* ─── Handler ────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    maybeSweep()

    const ip = getClientIp(req)
    const rate = checkRateLimit(ip)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many scans. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
      )
    }

    const url = new URL(req.url)
    const raw = url.searchParams.get('domain')
    const v = validateDomain(raw)
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 })
    }
    const domain = v.domain

    const [dmarc, spf, dkim, mx, subdomains] = await Promise.all([
      checkDmarc(domain),
      checkSpf(domain),
      checkDkim(domain),
      checkMx(domain),
      scanSubdomains(domain),
    ])

    const score = scoreScan(dmarc, spf, dkim, mx)
    const risk = riskFromScore(score)
    const recommendations = buildRecommendations(dmarc, spf, dkim, subdomains)

    const anyTimeout = dmarc === null || spf === null || mx === null
    if (anyTimeout) {
      recommendations.unshift('Some checks timed out. Results may be incomplete.')
    }

    return NextResponse.json({
      domain,
      score,
      risk,
      dmarc: dmarc ?? { found: false, status: 'critical' as const },
      spf: spf ?? { found: false, status: 'critical' as const },
      dkim,
      mx: mx ?? { found: false, servers: [], status: 'critical' as const },
      subdomains,
      recommendations,
      scannedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
