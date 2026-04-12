import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { prisma } from '@/lib/prisma'

// Use a resolver with a short timeout for fast DNS lookups
const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

function resolveTxtFast(hostname: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    resolver.resolveTxt(hostname, (err, records) => {
      if (err) reject(err)
      else resolve(records)
    })
  })
}

/* ═══════════════════════════════════════════════════════════════════════
   DOMAIN HEALTH SCORING MODEL — Free Public Scan
   ═══════════════════════════════════════════════════════════════════════

   This endpoint performs live DNS lookups and scores a domain's email
   authentication posture. The score is broken into 4 weighted pillars:

   ┌─────────────────────┬────────┬─────────────────────────────────────┐
   │ Pillar              │ Weight │ Components                          │
   ├─────────────────────┼────────┼─────────────────────────────────────┤
   │ DMARC               │ 35 pts │ Exists(10) + Policy(15) +           │
   │                     │        │ Subdomain(5) + Reporting(5)         │
   │ SPF                 │ 30 pts │ Exists(15) + Mechanism(10) +        │
   │                     │        │ Complexity(5)                       │
   │ DKIM                │ 25 pts │ Selector found(25)                  │
   │ Configuration Bonus │ 10 pts │ Alignment(5) + pct=100(5)           │
   └─────────────────────┴────────┴─────────────────────────────────────┘

   Risk Classification (total score):
     85 – 100  →  Healthy     (email auth properly configured)
     60 –  84  →  Medium      (needs attention)
     30 –  59  →  High Risk   (significant gaps)
      0 –  29  →  Critical    (little/no protection)

   ═══════════════════════════════════════════════════════════════════════ */

interface RevenueImpact {
  per100: {
    delivered: number
    spam: number
    rejected: number
    deliveryRate: number
  }
  monthly: {
    emailVolume: number
    emailsLost: number
    potentialLeadsLost: number
    revenueAtRisk: number
  }
  assumptions: {
    avgLeadValue: number
    conversionRate: number
    monthlyVolume: number
  }
  riskFactors: {
    factor: string
    impact: 'critical' | 'high' | 'medium' | 'low'
    description: string
  }[]
}

interface ScanResult {
  domain: string
  score: number
  riskLevel: 'healthy' | 'medium' | 'high' | 'critical'
  riskLabel: string
  pillars: {
    dmarc: PillarResult
    spf: PillarResult
    dkim: PillarResult
    config: PillarResult
  }
  findings: Finding[]
  rawRecords: {
    dmarc: string | null
    spf: string | null
    dkim: string | null
    bimi: string | null
  }
  bimi: {
    status: 'pass' | 'partial' | 'fail'
    hasRecord: boolean
    logoUrl: string | null
    vmcUrl: string | null
    dmarcReady: boolean
  }
  revenueImpact: RevenueImpact
}

interface PillarResult {
  score: number
  maxScore: number
  percentage: number
  status: 'pass' | 'partial' | 'fail'
}

interface Finding {
  type: 'success' | 'warning' | 'error' | 'info'
  category: 'DMARC' | 'SPF' | 'DKIM' | 'Config' | 'BIMI'
  title: string
  detail: string
  recommendation?: string
}

// Common DKIM selectors used by major providers
const DKIM_SELECTORS = [
  'default',
  'google',
  'selector1',     // Microsoft
  'selector2',     // Microsoft
  'k1',            // Mailchimp
  's1',            // Generic
  's2',            // Generic
  'mail',
  'dkim',
  'mandrill',      // Mailchimp Transactional
  'sm1',           // Salesforce
  'sm2',           // Salesforce
]

// Validate domain format to prevent DNS rebinding / injection
function isValidDomain(domain: string): boolean {
  if (domain.length > 253) return false
  const pattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/
  return pattern.test(domain)
}

async function lookupTxt(hostname: string, timeoutMs = 1500): Promise<string | null> {
  try {
    const result = await Promise.race([
      resolveTxtFast(hostname),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ])
    if (!result) return null
    return result.map(chunks => chunks.join('')).join('\n')
  } catch {
    return null
  }
}

function parseDmarc(raw: string | null): Record<string, string> {
  if (!raw) return {}
  // Find the DMARC record line
  const dmarcLine = raw.split('\n').find(l => l.trim().startsWith('v=DMARC1'))
  if (!dmarcLine) return {}
  const tags: Record<string, string> = {}
  dmarcLine.split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=')
    if (key && rest.length) tags[key.trim().toLowerCase()] = rest.join('=').trim()
  })
  return tags
}

function parseSpf(raw: string | null): { record: string | null; mechanisms: string[] } {
  if (!raw) return { record: null, mechanisms: [] }
  const spfLine = raw.split('\n').find(l => l.trim().startsWith('v=spf1'))
  if (!spfLine) return { record: null, mechanisms: [] }
  const mechanisms = spfLine.trim().split(/\s+/).slice(1) // skip v=spf1
  return { record: spfLine.trim(), mechanisms }
}

function scoreDmarc(tags: Record<string, string>): { pillar: PillarResult; findings: Finding[] } {
  let score = 0
  const findings: Finding[] = []

  if (!tags.v) {
    findings.push({
      type: 'error',
      category: 'DMARC',
      title: 'No DMARC Record Found',
      detail: 'Your domain does not have a DMARC TXT record published at _dmarc.' ,
      recommendation: 'Add a DMARC record starting with v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com',
    })
    return { pillar: { score: 0, maxScore: 35, percentage: 0, status: 'fail' }, findings }
  }

  // Record exists: +10
  score += 10
  findings.push({
    type: 'success',
    category: 'DMARC',
    title: 'DMARC Record Found',
    detail: 'A valid DMARC record is published for your domain.',
  })

  // Policy scoring: reject=15, quarantine=10, none=5
  const policy = tags.p?.toLowerCase()
  if (policy === 'reject') {
    score += 15
    findings.push({
      type: 'success',
      category: 'DMARC',
      title: 'Policy: reject',
      detail: 'Strongest policy — unauthenticated emails are rejected outright.',
    })
  } else if (policy === 'quarantine') {
    score += 10
    findings.push({
      type: 'warning',
      category: 'DMARC',
      title: 'Policy: quarantine',
      detail: 'Medium policy — unauthenticated emails are sent to spam/junk.',
      recommendation: 'Consider upgrading to p=reject once you have verified all legitimate senders.',
    })
  } else {
    score += 5
    findings.push({
      type: 'warning',
      category: 'DMARC',
      title: 'Policy: none (monitoring only)',
      detail: 'Weakest policy — no action is taken on unauthenticated emails. You receive reports only.',
      recommendation: 'Move to p=quarantine after analyzing your DMARC reports, then progress to p=reject.',
    })
  }

  // Subdomain policy: +5
  if (tags.sp) {
    score += 5
    findings.push({
      type: 'success',
      category: 'DMARC',
      title: `Subdomain Policy Set: ${tags.sp}`,
      detail: 'A separate DMARC policy is defined for subdomains.',
    })
  } else {
    findings.push({
      type: 'info',
      category: 'DMARC',
      title: 'No Subdomain Policy',
      detail: 'Subdomains inherit the parent domain policy. Consider setting sp= explicitly.',
      recommendation: 'Add sp=reject or sp=quarantine to protect subdomains independently.',
    })
  }

  // Reporting (rua): +5
  if (tags.rua) {
    score += 5
    findings.push({
      type: 'success',
      category: 'DMARC',
      title: 'Aggregate Reporting Configured',
      detail: `Reports are sent to: ${tags.rua}`,
    })
  } else {
    findings.push({
      type: 'warning',
      category: 'DMARC',
      title: 'No Aggregate Reporting (rua)',
      detail: 'Without rua, you won\'t receive DMARC aggregate reports.',
      recommendation: 'Add rua=mailto:dmarc-reports@yourdomain.com to start receiving reports.',
    })
  }

  const percentage = Math.round((score / 35) * 100)
  const status: PillarResult['status'] = score >= 28 ? 'pass' : score >= 15 ? 'partial' : 'fail'
  return { pillar: { score, maxScore: 35, percentage, status }, findings }
}

function scoreSpf(parsed: { record: string | null; mechanisms: string[] }): { pillar: PillarResult; findings: Finding[] } {
  let score = 0
  const findings: Finding[] = []

  if (!parsed.record) {
    findings.push({
      type: 'error',
      category: 'SPF',
      title: 'No SPF Record Found',
      detail: 'Your domain does not have an SPF TXT record (v=spf1).',
      recommendation: 'Add an SPF record like: v=spf1 include:_spf.google.com ~all',
    })
    return { pillar: { score: 0, maxScore: 30, percentage: 0, status: 'fail' }, findings }
  }

  // Record exists: +15
  score += 15
  findings.push({
    type: 'success',
    category: 'SPF',
    title: 'SPF Record Found',
    detail: `Record: ${parsed.record}`,
  })

  // All mechanism: -all=10, ~all=7, ?all=3, +all=0
  const allMech = parsed.mechanisms.find(m => m.endsWith('all'))
  if (allMech === '-all') {
    score += 10
    findings.push({
      type: 'success',
      category: 'SPF',
      title: 'Hard Fail (-all)',
      detail: 'Unauthorized senders are explicitly rejected. Strongest SPF posture.',
    })
  } else if (allMech === '~all') {
    score += 7
    findings.push({
      type: 'warning',
      category: 'SPF',
      title: 'Soft Fail (~all)',
      detail: 'Unauthorized senders are marked but not rejected.',
      recommendation: 'Consider upgrading to -all (hard fail) once you\'re confident in your sender list.',
    })
  } else if (allMech === '?all') {
    score += 3
    findings.push({
      type: 'warning',
      category: 'SPF',
      title: 'Neutral (?all)',
      detail: 'SPF result is neutral for unknown senders — provides little protection.',
      recommendation: 'Upgrade to ~all or -all to actively reject unauthorized senders.',
    })
  } else if (allMech === '+all') {
    findings.push({
      type: 'error',
      category: 'SPF',
      title: 'Permissive (+all)',
      detail: 'This allows ANY server to send email as your domain. Extremely dangerous.',
      recommendation: 'Remove +all immediately and replace with ~all or -all.',
    })
  }

  // Complexity: count include/a/mx/redirect — DNS lookup limit is 10
  const lookupMechs = parsed.mechanisms.filter(m =>
    m.startsWith('include:') || m.startsWith('a:') || m.startsWith('mx:') ||
    m.startsWith('redirect=') || m === 'a' || m === 'mx'
  )
  if (lookupMechs.length <= 8) {
    score += 5
    findings.push({
      type: 'success',
      category: 'SPF',
      title: `DNS Lookup Count: ${lookupMechs.length}/10`,
      detail: 'SPF record is within the 10-lookup limit.',
    })
  } else if (lookupMechs.length <= 10) {
    score += 3
    findings.push({
      type: 'warning',
      category: 'SPF',
      title: `DNS Lookup Count: ${lookupMechs.length}/10`,
      detail: 'Approaching the 10-lookup limit. Exceeding will cause SPF to fail.',
      recommendation: 'Consider flattening your SPF record to reduce lookup count.',
    })
  } else {
    findings.push({
      type: 'error',
      category: 'SPF',
      title: `DNS Lookup Count: ${lookupMechs.length}/10`,
      detail: 'Exceeds the 10-lookup limit. SPF will permanently fail (permerror).',
      recommendation: 'Flatten your SPF record or remove unused include statements.',
    })
  }

  const percentage = Math.round((score / 30) * 100)
  const status: PillarResult['status'] = score >= 25 ? 'pass' : score >= 15 ? 'partial' : 'fail'
  return { pillar: { score, maxScore: 30, percentage, status }, findings }
}

async function scoreDkim(domain: string): Promise<{ pillar: PillarResult; findings: Finding[]; rawRecord: string | null }> {
  const findings: Finding[] = []
  let foundRecord: string | null = null
  let foundSelector: string | null = null

  // Check all selectors in parallel with a tight timeout
  const results = await Promise.allSettled(
    DKIM_SELECTORS.map(async (selector) => {
      const record = await lookupTxt(`${selector}._domainkey.${domain}`, 1000)
      return { selector, record }
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.record?.includes('v=DKIM1')) {
      foundRecord = r.value.record
      foundSelector = r.value.selector
      break
    }
  }

  if (foundRecord && foundSelector) {
    findings.push({
      type: 'success',
      category: 'DKIM',
      title: `DKIM Record Found (selector: ${foundSelector})`,
      detail: 'A DKIM public key is published, allowing receivers to verify email signatures.',
    })
    return {
      pillar: { score: 25, maxScore: 25, percentage: 100, status: 'pass' },
      findings,
      rawRecord: foundRecord,
    }
  }

  findings.push({
    type: 'warning',
    category: 'DKIM',
    title: 'No DKIM Record Found (common selectors)',
    detail: `Checked selectors: ${DKIM_SELECTORS.join(', ')}. Your DKIM selector may use a custom name.`,
    recommendation: 'Ensure your email provider has DKIM signing enabled and the public key is published in DNS.',
  })

  return {
    pillar: { score: 0, maxScore: 25, percentage: 0, status: 'fail' },
    findings,
    rawRecord: null,
  }
}

function scoreConfig(dmarcTags: Record<string, string>): { pillar: PillarResult; findings: Finding[] } {
  let score = 0
  const findings: Finding[] = []

  // Alignment mode: adkim/aspf = 's' (strict) is better
  const adkim = dmarcTags.adkim?.toLowerCase()
  const aspf = dmarcTags.aspf?.toLowerCase()

  if (adkim === 's' || aspf === 's') {
    score += 5
    findings.push({
      type: 'success',
      category: 'Config',
      title: 'Strict Alignment Configured',
      detail: `DKIM alignment: ${adkim || 'r (relaxed/default)'}, SPF alignment: ${aspf || 'r (relaxed/default)'}`,
    })
  } else if (dmarcTags.v) {
    // DMARC exists but alignment is relaxed (default)
    score += 2
    findings.push({
      type: 'info',
      category: 'Config',
      title: 'Relaxed Alignment (default)',
      detail: 'Both DKIM and SPF alignment are set to relaxed mode.',
      recommendation: 'Consider setting adkim=s and/or aspf=s for stricter alignment.',
    })
  }

  // pct value: 100 or absent (defaults to 100) = best
  const pct = dmarcTags.pct
  if (!pct || pct === '100') {
    score += 5
    if (dmarcTags.v) {
      findings.push({
        type: 'success',
        category: 'Config',
        title: 'Full Policy Coverage (pct=100)',
        detail: 'DMARC policy applies to 100% of messages.',
      })
    }
  } else {
    const pctNum = parseInt(pct, 10)
    if (pctNum >= 50) score += 3
    else if (pctNum > 0) score += 1
    findings.push({
      type: 'warning',
      category: 'Config',
      title: `Partial Coverage: pct=${pct}`,
      detail: `DMARC policy only applies to ${pct}% of messages.`,
      recommendation: 'Increase pct to 100 once you\'re confident your legitimate mail passes authentication.',
    })
  }

  const percentage = Math.round((score / 10) * 100)
  const status: PillarResult['status'] = score >= 8 ? 'pass' : score >= 4 ? 'partial' : 'fail'
  return { pillar: { score, maxScore: 10, percentage, status }, findings }
}

async function scoreBimi(domain: string, dmarcPolicy: string | null): Promise<{ findings: Finding[]; rawRecord: string | null; status: 'pass' | 'partial' | 'fail'; hasRecord: boolean; logoUrl: string | null; vmcUrl: string | null; dmarcReady: boolean }> {
  const findings: Finding[] = []
  let rawRecord: string | null = null
  let logoUrl: string | null = null
  let vmcUrl: string | null = null

  // BIMI requires DMARC policy of quarantine or reject
  const dmarcReady = dmarcPolicy === 'quarantine' || dmarcPolicy === 'reject'

  try {
    rawRecord = await lookupTxt(`default._bimi.${domain}`, 1500)
  } catch {
    // No BIMI record
  }

  if (!rawRecord || !rawRecord.includes('v=BIMI1')) {
    findings.push({
      type: 'info',
      category: 'BIMI',
      title: 'No BIMI Record Found',
      detail: `No BIMI TXT record at default._bimi.${domain}. BIMI lets you display your brand logo in supporting email clients.`,
      recommendation: 'Publish a BIMI record (v=BIMI1) with your SVG logo URL to boost brand visibility in inboxes.',
    })

    if (!dmarcReady) {
      findings.push({
        type: 'info',
        category: 'BIMI',
        title: 'DMARC Policy Not Ready for BIMI',
        detail: `BIMI requires a DMARC policy of quarantine or reject. Current policy: ${dmarcPolicy || 'none'}.`,
        recommendation: 'Upgrade your DMARC policy to p=quarantine or p=reject before implementing BIMI.',
      })
    }

    return { findings, rawRecord: null, status: 'fail', hasRecord: false, logoUrl: null, vmcUrl: null, dmarcReady }
  }

  // Parse BIMI tags
  const bimiTags: Record<string, string> = {}
  rawRecord.split(';').forEach(part => {
    const [key, ...valParts] = part.trim().split('=')
    if (key && valParts.length) bimiTags[key.trim().toLowerCase()] = valParts.join('=').trim()
  })

  findings.push({
    type: 'success',
    category: 'BIMI',
    title: 'BIMI Record Found',
    detail: 'Your domain has a BIMI TXT record published, enabling brand logo display in email clients.',
  })

  // Check logo URL (l= tag)
  logoUrl = bimiTags['l'] || null
  if (logoUrl) {
    findings.push({
      type: 'success',
      category: 'BIMI',
      title: 'Logo URL Present',
      detail: `Logo: ${logoUrl}`,
    })
  } else {
    findings.push({
      type: 'warning',
      category: 'BIMI',
      title: 'No Logo URL (l= tag)',
      detail: 'BIMI record exists but no logo URL is specified.',
      recommendation: 'Add l=https://yourdomain.com/logo.svg pointing to a Tiny P/S SVG file.',
    })
  }

  // Check VMC/authority evidence (a= tag)
  vmcUrl = bimiTags['a'] || null
  if (vmcUrl) {
    findings.push({
      type: 'success',
      category: 'BIMI',
      title: 'VMC Certificate Present',
      detail: `Authority evidence: ${vmcUrl}`,
    })
  } else {
    findings.push({
      type: 'info',
      category: 'BIMI',
      title: 'No VMC Certificate (a= tag)',
      detail: 'A Verified Mark Certificate (VMC) is not required but is needed for logo display in Gmail.',
      recommendation: 'Obtain a VMC from DigiCert or Entrust to display your logo in Gmail and Apple Mail.',
    })
  }

  // Check DMARC readiness for BIMI
  if (!dmarcReady) {
    findings.push({
      type: 'warning',
      category: 'BIMI',
      title: 'DMARC Policy Not Enforcing',
      detail: `BIMI requires DMARC policy of quarantine or reject. Current: ${dmarcPolicy || 'none'}.`,
      recommendation: 'Your BIMI record exists but won\'t be honored until your DMARC policy is p=quarantine or p=reject.',
    })
  } else {
    findings.push({
      type: 'success',
      category: 'BIMI',
      title: 'DMARC Policy Ready for BIMI',
      detail: `DMARC policy (${dmarcPolicy}) meets the minimum requirement for BIMI.`,
    })
  }

  // Determine overall BIMI status
  let status: 'pass' | 'partial' | 'fail' = 'fail'
  if (logoUrl && dmarcReady && vmcUrl) status = 'pass'
  else if (logoUrl || rawRecord) status = 'partial'

  return { findings, rawRecord, status, hasRecord: true, logoUrl, vmcUrl, dmarcReady }
}

function calculateRevenueImpact(
  totalScore: number,
  pillars: ScanResult['pillars'],
  dmarcTags: Record<string, string>,
): RevenueImpact {
  // ═══════════════════════════════════════════════════════════════
  // DELIVERABILITY MODEL
  //
  // Based on real-world data from Google Postmaster Tools, Return
  // Path studies, and Valimail industry research:
  //
  //  Missing DMARC + SPF     → ~25-40% spam placement
  //  DMARC p=none            → ~10-20% spam (monitoring only)
  //  DMARC p=quarantine      → ~5-10% spam (with proper SPF/DKIM)
  //  DMARC p=reject + full   → ~1-3% spam (best case)
  //
  // Post Feb 2024 (Google/Yahoo bulk sender rules):
  //  No DMARC at all         → increasingly rejected outright
  //  No DKIM                 → Gmail penalizes heavily
  //  SPF +all                → near-guaranteed spam
  //
  // We calculate per-pillar penalties and combine them.
  // ═══════════════════════════════════════════════════════════════

  // Base delivery rate starts at 99% (perfect auth)
  let spamPenalty = 0      // percentage points pushed to spam
  let rejectPenalty = 0    // percentage points outright rejected

  // ── DMARC penalties ──
  if (pillars.dmarc.score === 0) {
    // No DMARC at all — post-2024, this is increasingly fatal
    spamPenalty += 18
    rejectPenalty += 8
  } else {
    const policy = dmarcTags.p?.toLowerCase()
    if (policy === 'none') {
      spamPenalty += 10    // monitoring only, no enforcement
    } else if (policy === 'quarantine') {
      spamPenalty += 3     // good but not best
    }
    // reject = no penalty (best)

    if (!dmarcTags.rua) {
      spamPenalty += 2     // no reporting = blind spot
    }
    if (!dmarcTags.sp) {
      spamPenalty += 1     // subdomain gap
    }
  }

  // ── SPF penalties ──
  if (pillars.spf.score === 0) {
    spamPenalty += 15
    rejectPenalty += 5
  } else if (pillars.spf.score < 15) {
    // SPF exists but weak mechanism
    spamPenalty += 8
  } else if (pillars.spf.score < 25) {
    spamPenalty += 3       // soft-fail or approaching lookup limit
  }

  // ── DKIM penalties ──
  if (pillars.dkim.score === 0) {
    // No DKIM — Gmail specifically penalizes this heavily
    spamPenalty += 14
    rejectPenalty += 4
  }

  // ── Config penalties ──
  if (pillars.config.score < 4) {
    spamPenalty += 3       // relaxed alignment + partial coverage
  } else if (pillars.config.score < 8) {
    spamPenalty += 1
  }

  // Cap penalties at reasonable bounds
  spamPenalty = Math.min(spamPenalty, 55)
  rejectPenalty = Math.min(rejectPenalty, 30)

  // Calculate per-100 emails
  const rejected = Math.round(rejectPenalty)
  const spam = Math.round(spamPenalty)
  const delivered = Math.max(100 - rejected - spam, 5) // At least 5% get through
  const deliveryRate = delivered

  // ── Revenue assumptions ──
  // Conservative B2B SaaS/service values based on industry benchmarks:
  //   - Average lead value: $25 (cost per lead for B2B email campaigns)
  //   - Email-to-lead conversion: 2.5% (industry avg 1-5%)
  //   - Monthly volume: 10,000 (SMB average cold/warm outreach)
  const AVG_LEAD_VALUE = 25
  const CONVERSION_RATE = 2.5
  const MONTHLY_VOLUME = 10000

  // Monthly projections
  const emailsLostPer100 = spam + rejected
  const monthlyEmailsLost = Math.round((emailsLostPer100 / 100) * MONTHLY_VOLUME)
  const potentialLeadsLost = Math.round(monthlyEmailsLost * (CONVERSION_RATE / 100))
  const revenueAtRisk = potentialLeadsLost * AVG_LEAD_VALUE

  // ── Risk factors (specific, actionable) ──
  const riskFactors: RevenueImpact['riskFactors'] = []

  if (pillars.dmarc.score === 0) {
    riskFactors.push({
      factor: 'No DMARC Record',
      impact: 'critical',
      description: 'Google & Yahoo now require DMARC for bulk senders. Without it, up to 26% of your emails may land in spam or be rejected.',
    })
  } else if (dmarcTags.p?.toLowerCase() === 'none') {
    riskFactors.push({
      factor: 'DMARC Policy: Monitor Only',
      impact: 'high',
      description: 'p=none only monitors — it doesn\'t stop spoofing. Receivers give less trust to domains without enforcement, costing ~10% deliverability.',
    })
  }

  if (pillars.spf.score === 0) {
    riskFactors.push({
      factor: 'Missing SPF Record',
      impact: 'critical',
      description: 'Without SPF, receiving servers cannot verify authorized senders. Expect ~20% of emails to be flagged or rejected.',
    })
  } else if (pillars.spf.percentage < 60) {
    riskFactors.push({
      factor: 'Weak SPF Configuration',
      impact: 'high',
      description: 'Soft-fail (~all) or neutral (?all) mechanisms provide limited protection. Hard-fail (-all) significantly improves deliverability.',
    })
  }

  if (pillars.dkim.score === 0) {
    riskFactors.push({
      factor: 'No DKIM Signing',
      impact: 'critical',
      description: 'Gmail penalizes unsigned emails heavily. Without DKIM, ~18% of emails to Gmail users may go to spam or be rejected.',
    })
  }

  if (pillars.config.score < 4 && pillars.dmarc.score > 0) {
    riskFactors.push({
      factor: 'Relaxed Alignment & Partial Coverage',
      impact: 'medium',
      description: 'Relaxed DKIM/SPF alignment and partial pct coverage weaken your DMARC enforcement effectiveness by ~3-5%.',
    })
  }

  if (totalScore >= 85 && riskFactors.length === 0) {
    riskFactors.push({
      factor: 'Strong Email Authentication',
      impact: 'low',
      description: 'Your domain has robust email authentication. Minimal deliverability risk from DNS configuration.',
    })
  }

  return {
    per100: { delivered, spam, rejected, deliveryRate },
    monthly: {
      emailVolume: MONTHLY_VOLUME,
      emailsLost: monthlyEmailsLost,
      potentialLeadsLost,
      revenueAtRisk,
    },
    assumptions: {
      avgLeadValue: AVG_LEAD_VALUE,
      conversionRate: CONVERSION_RATE,
      monthlyVolume: MONTHLY_VOLUME,
    },
    riskFactors,
  }
}

function classifyRisk(score: number): { level: ScanResult['riskLevel']; label: string } {
  if (score >= 85) return { level: 'healthy', label: 'Healthy' }
  if (score >= 60) return { level: 'medium', label: 'Needs Attention' }
  if (score >= 30) return { level: 'high', label: 'At Risk' }
  return { level: 'critical', label: 'Critical' }
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase()

  if (!domain) {
    return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
  }

  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  try {
    // 1. Lookup DNS records in parallel
    const [dmarcRaw, spfRaw, dkimResult] = await Promise.all([
      lookupTxt(`_dmarc.${domain}`),
      lookupTxt(domain),
      scoreDkim(domain),
    ])

    // 2. Parse records
    const dmarcTags = parseDmarc(dmarcRaw)
    const spfParsed = parseSpf(spfRaw)

    // 3. Score each pillar
    const dmarcScore = scoreDmarc(dmarcTags)
    const spfScore = scoreSpf(spfParsed)
    const configScore = scoreConfig(dmarcTags)

    // 3b. BIMI check (depends on DMARC policy, so runs after parse)
    const bimiResult = await scoreBimi(domain, dmarcTags.p || null)

    // 4. Calculate total
    const totalScore =
      dmarcScore.pillar.score +
      spfScore.pillar.score +
      dkimResult.pillar.score +
      configScore.pillar.score

    const risk = classifyRisk(totalScore)

    // 5. Aggregate findings
    const findings = [
      ...dmarcScore.findings,
      ...spfScore.findings,
      ...dkimResult.findings,
      ...configScore.findings,
      ...bimiResult.findings,
    ]

    // 6. Calculate revenue impact
    const pillars = {
      dmarc: dmarcScore.pillar,
      spf: spfScore.pillar,
      dkim: dkimResult.pillar,
      config: configScore.pillar,
    }
    const revenueImpact = calculateRevenueImpact(totalScore, pillars, dmarcTags)

    const result: ScanResult = {
      domain,
      score: totalScore,
      riskLevel: risk.level,
      riskLabel: risk.label,
      pillars,
      findings,
      rawRecords: {
        dmarc: dmarcRaw,
        spf: spfParsed.record,
        dkim: dkimResult.rawRecord,
        bimi: bimiResult.rawRecord,
      },
      bimi: {
        status: bimiResult.status,
        hasRecord: bimiResult.hasRecord,
        logoUrl: bimiResult.logoUrl,
        vmcUrl: bimiResult.vmcUrl,
        dmarcReady: bimiResult.dmarcReady,
      },
      revenueImpact,
    }

    // Save scan to DB (fire-and-forget — don't slow down response)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
    const ua = req.headers.get('user-agent') || null
    let scanId: string | null = null
    try {
      const saved = await prisma.domainScan.create({
        data: {
          domain,
          score: totalScore,
          riskLevel: risk.level,
          dmarcScore: dmarcScore.pillar.score,
          spfScore: spfScore.pillar.score,
          dkimScore: dkimResult.pillar.score,
          configScore: configScore.pillar.score,
          rawResult: JSON.stringify(result),
          ipAddress: ip,
          userAgent: ua,
        },
      })
      scanId = saved.id
    } catch (err) {
      // INMYBOX ENHANCEMENT — Phase 5: Safe error logging (no raw objects)
      console.error(`[scan] Failed to save scan: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    return NextResponse.json({ ...result, scanId })
  } catch (err) {
    // INMYBOX ENHANCEMENT — Phase 5: Safe error logging (no raw objects)
    console.error(`[scan] Domain scan error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return NextResponse.json(
      { error: 'Failed to scan domain. Please check the domain name and try again.' },
      { status: 500 }
    )
  }
}
