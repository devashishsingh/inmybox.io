/**
 * Inmybox Scanner Engine — pure DNS + scoring.
 * No framework, no DB. Port of src/app/api/scan/route.ts kept in lockstep.
 *
 * Public surface: scanDomain(domain) -> ScanResult
 */

import dns from 'node:dns'

// Two independent resolvers — race them so whichever responds first wins.
// Google (8.8.8.8) and Cloudflare (1.1.1.1) have globally anycast infrastructure;
// racing them cuts median lookup latency by ~30-50 ms and P99 by much more.
const resolverG = new dns.Resolver()
resolverG.setServers(['8.8.8.8'])
const resolverCF = new dns.Resolver()
resolverCF.setServers(['1.1.1.1'])

/* ─── Types ─────────────────────────────────────────────────── */
export interface PillarResult {
  score: number
  maxScore: number
  percentage: number
  status: 'pass' | 'partial' | 'fail'
}

export interface Finding {
  type: 'success' | 'warning' | 'error' | 'info'
  category: 'DMARC' | 'SPF' | 'DKIM' | 'Config' | 'BIMI'
  title: string
  detail: string
  recommendation?: string
}

export interface RevenueImpact {
  per100: { delivered: number; spam: number; rejected: number; deliveryRate: number }
  monthly: { emailVolume: number; emailsLost: number; potentialLeadsLost: number; revenueAtRisk: number }
  assumptions: { avgLeadValue: number; conversionRate: number; monthlyVolume: number }
  riskFactors: { factor: string; impact: 'critical' | 'high' | 'medium' | 'low'; description: string }[]
}

export interface ScanResult {
  domain: string
  score: number
  riskLevel: 'healthy' | 'medium' | 'high' | 'critical'
  riskLabel: string
  pillars: { dmarc: PillarResult; spf: PillarResult; dkim: PillarResult; config: PillarResult }
  findings: Finding[]
  rawRecords: { dmarc: string | null; spf: string | null; dkim: string | null; bimi: string | null }
  bimi: {
    status: 'pass' | 'partial' | 'fail'
    hasRecord: boolean
    logoUrl: string | null
    vmcUrl: string | null
    dmarcReady: boolean
  }
  revenueImpact: RevenueImpact
  /** Wall time of the scan in ms (for observability). */
  durationMs: number
}

/* ─── DNS helpers ───────────────────────────────────────────── */
function queryTxt(resolver: dns.Resolver, hostname: string): Promise<string[][]> {
  return new Promise((resolve, reject) =>
    resolver.resolveTxt(hostname, (err, records) => (err ? reject(err) : resolve(records)))
  )
}

// Race both resolvers — fastest DNS response wins, giving us sub-100ms lookups
// in most regions. The slower resolver's callback fires but is ignored once
// the Promise.any settles.
function resolveTxtFast(hostname: string): Promise<string[][]> {
  return Promise.any([queryTxt(resolverG, hostname), queryTxt(resolverCF, hostname)])
}

async function lookupTxt(hostname: string, timeoutMs = 600): Promise<string | null> {
  try {
    const result = await Promise.race([
      resolveTxtFast(hostname),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ])
    if (!result) return null
    return result.map((chunks) => chunks.join('')).join('\n')
  } catch {
    return null
  }
}

// Ordered by real-world prevalence: Google Workspace, M365, Mailchimp, SendGrid,
// Postmark, Zoho, Brevo, generic setups. Checking in parallel so order only
// matters for the early-break logic once a hit is found.
const DKIM_SELECTORS = [
  'google',      // Google Workspace
  'selector1',   // Microsoft 365
  'selector2',   // Microsoft 365 rotation
  'k1',          // Mailchimp / Intuit
  'k2',          // Mailchimp secondary
  'default',     // Generic / self-hosted
  's1',          // SendGrid / misc
  's2',          // SendGrid rotation
  'mail',        // Generic
  'dkim',        // Generic
  'mandrill',    // Mandrill (Mailchimp transactional)
  'pm',          // Postmark
  'em',          // SendGrid marketing
  'sg',          // SendGrid
  'zoho',        // Zoho Mail
  'brevo',       // Brevo (Sendinblue)
  'mailjet',     // Mailjet
  'mx',          // Generic MX-based
  'email',       // Generic
  'dkimout',     // Misc outbound relay
]

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false
  const pattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/
  return pattern.test(domain)
}

/* ─── Parsers ───────────────────────────────────────────────── */
function parseDmarc(raw: string | null): Record<string, string> {
  if (!raw) return {}
  const dmarcLine = raw.split('\n').find((l) => l.trim().startsWith('v=DMARC1'))
  if (!dmarcLine) return {}
  const tags: Record<string, string> = {}
  dmarcLine.split(';').forEach((part) => {
    const [key, ...rest] = part.trim().split('=')
    if (key && rest.length) tags[key.trim().toLowerCase()] = rest.join('=').trim()
  })
  return tags
}

function parseSpf(raw: string | null): { record: string | null; mechanisms: string[] } {
  if (!raw) return { record: null, mechanisms: [] }
  const spfLine = raw.split('\n').find((l) => l.trim().startsWith('v=spf1'))
  if (!spfLine) return { record: null, mechanisms: [] }
  const mechanisms = spfLine.trim().split(/\s+/).slice(1)
  return { record: spfLine.trim(), mechanisms }
}

/* ─── Scoring ───────────────────────────────────────────────── */
function scoreDmarc(tags: Record<string, string>): { pillar: PillarResult; findings: Finding[] } {
  let score = 0
  const findings: Finding[] = []

  if (!tags.v) {
    findings.push({
      type: 'error', category: 'DMARC',
      title: 'No DMARC Record Found',
      detail: 'Your domain does not have a DMARC TXT record published at _dmarc.',
      recommendation: 'Add a DMARC record starting with v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com',
    })
    return { pillar: { score: 0, maxScore: 35, percentage: 0, status: 'fail' }, findings }
  }

  score += 10
  findings.push({ type: 'success', category: 'DMARC', title: 'DMARC Record Found', detail: 'A valid DMARC record is published for your domain.' })

  const policy = tags.p?.toLowerCase()
  if (policy === 'reject') {
    score += 15
    findings.push({ type: 'success', category: 'DMARC', title: 'Policy: reject', detail: 'Strongest policy — unauthenticated emails are rejected outright.' })
  } else if (policy === 'quarantine') {
    score += 10
    findings.push({
      type: 'warning', category: 'DMARC', title: 'Policy: quarantine',
      detail: 'Medium policy — unauthenticated emails are sent to spam/junk.',
      recommendation: 'Consider upgrading to p=reject once you have verified all legitimate senders.',
    })
  } else {
    score += 5
    findings.push({
      type: 'warning', category: 'DMARC', title: 'Policy: none (monitoring only)',
      detail: 'Weakest policy — no action is taken on unauthenticated emails. You receive reports only.',
      recommendation: 'Move to p=quarantine after analyzing your DMARC reports, then progress to p=reject.',
    })
  }

  if (tags.sp) {
    score += 5
    findings.push({ type: 'success', category: 'DMARC', title: `Subdomain Policy Set: ${tags.sp}`, detail: 'A separate DMARC policy is defined for subdomains.' })
  } else {
    findings.push({
      type: 'info', category: 'DMARC', title: 'No Subdomain Policy',
      detail: 'Subdomains inherit the parent domain policy. Consider setting sp= explicitly.',
      recommendation: 'Add sp=reject or sp=quarantine to protect subdomains independently.',
    })
  }

  if (tags.rua) {
    score += 5
    findings.push({ type: 'success', category: 'DMARC', title: 'Aggregate Reporting Configured', detail: `Reports are sent to: ${tags.rua}` })
  } else {
    findings.push({
      type: 'warning', category: 'DMARC', title: 'No Aggregate Reporting (rua)',
      detail: "Without rua, you won't receive DMARC aggregate reports.",
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
      type: 'error', category: 'SPF', title: 'No SPF Record Found',
      detail: 'Your domain does not have an SPF TXT record (v=spf1).',
      recommendation: 'Add an SPF record like: v=spf1 include:_spf.google.com ~all',
    })
    return { pillar: { score: 0, maxScore: 30, percentage: 0, status: 'fail' }, findings }
  }

  score += 15
  findings.push({ type: 'success', category: 'SPF', title: 'SPF Record Found', detail: `Record: ${parsed.record}` })

  const allMech = parsed.mechanisms.find((m) => m.endsWith('all'))
  if (allMech === '-all') {
    score += 10
    findings.push({ type: 'success', category: 'SPF', title: 'Hard Fail (-all)', detail: 'Unauthorized senders are explicitly rejected. Strongest SPF posture.' })
  } else if (allMech === '~all') {
    score += 7
    findings.push({
      type: 'warning', category: 'SPF', title: 'Soft Fail (~all)',
      detail: 'Unauthorized senders are marked but not rejected.',
      recommendation: "Consider upgrading to -all (hard fail) once you're confident in your sender list.",
    })
  } else if (allMech === '?all') {
    score += 3
    findings.push({
      type: 'warning', category: 'SPF', title: 'Neutral (?all)',
      detail: 'SPF result is neutral for unknown senders — provides little protection.',
      recommendation: 'Upgrade to ~all or -all to actively reject unauthorized senders.',
    })
  } else if (allMech === '+all') {
    findings.push({
      type: 'error', category: 'SPF', title: 'Permissive (+all)',
      detail: 'This allows ANY server to send email as your domain. Extremely dangerous.',
      recommendation: 'Remove +all immediately and replace with ~all or -all.',
    })
  }

  const lookupMechs = parsed.mechanisms.filter((m) =>
    m.startsWith('include:') || m.startsWith('a:') || m.startsWith('mx:') ||
    m.startsWith('redirect=') || m === 'a' || m === 'mx',
  )
  if (lookupMechs.length <= 8) {
    score += 5
    findings.push({ type: 'success', category: 'SPF', title: `DNS Lookup Count: ${lookupMechs.length}/10`, detail: 'SPF record is within the 10-lookup limit.' })
  } else if (lookupMechs.length <= 10) {
    score += 3
    findings.push({
      type: 'warning', category: 'SPF', title: `DNS Lookup Count: ${lookupMechs.length}/10`,
      detail: 'Approaching the 10-lookup limit. Exceeding will cause SPF to fail.',
      recommendation: 'Consider flattening your SPF record to reduce lookup count.',
    })
  } else {
    findings.push({
      type: 'error', category: 'SPF', title: `DNS Lookup Count: ${lookupMechs.length}/10`,
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

  // 400 ms per selector — all fire in parallel, so total DKIM phase is capped
  // at 400 ms regardless of selector count (vs 1000 ms × sequential).
  const results = await Promise.allSettled(
    DKIM_SELECTORS.map(async (selector) => {
      const record = await lookupTxt(`${selector}._domainkey.${domain}`, 400)
      return { selector, record }
    }),
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
      type: 'success', category: 'DKIM',
      title: `DKIM Record Found (selector: ${foundSelector})`,
      detail: 'A DKIM public key is published, allowing receivers to verify email signatures.',
    })
    return { pillar: { score: 25, maxScore: 25, percentage: 100, status: 'pass' }, findings, rawRecord: foundRecord }
  }

  findings.push({
    type: 'warning', category: 'DKIM',
    title: 'No DKIM Record Found (common selectors)',
    detail: `Checked selectors: ${DKIM_SELECTORS.join(', ')}. Your DKIM selector may use a custom name.`,
    recommendation: 'Ensure your email provider has DKIM signing enabled and the public key is published in DNS.',
  })
  return { pillar: { score: 0, maxScore: 25, percentage: 0, status: 'fail' }, findings, rawRecord: null }
}

function scoreConfig(dmarcTags: Record<string, string>): { pillar: PillarResult; findings: Finding[] } {
  let score = 0
  const findings: Finding[] = []

  const adkim = dmarcTags.adkim?.toLowerCase()
  const aspf = dmarcTags.aspf?.toLowerCase()

  if (adkim === 's' || aspf === 's') {
    score += 5
    findings.push({
      type: 'success', category: 'Config', title: 'Strict Alignment Configured',
      detail: `DKIM alignment: ${adkim || 'r (relaxed/default)'}, SPF alignment: ${aspf || 'r (relaxed/default)'}`,
    })
  } else if (dmarcTags.v) {
    score += 2
    findings.push({
      type: 'info', category: 'Config', title: 'Relaxed Alignment (default)',
      detail: 'Both DKIM and SPF alignment are set to relaxed mode.',
      recommendation: 'Consider setting adkim=s and/or aspf=s for stricter alignment.',
    })
  }

  const pct = dmarcTags.pct
  if (!pct || pct === '100') {
    score += 5
    if (dmarcTags.v) {
      findings.push({ type: 'success', category: 'Config', title: 'Full Policy Coverage (pct=100)', detail: 'DMARC policy applies to 100% of messages.' })
    }
  } else {
    const pctNum = parseInt(pct, 10)
    if (pctNum >= 50) score += 3
    else if (pctNum > 0) score += 1
    findings.push({
      type: 'warning', category: 'Config', title: `Partial Coverage: pct=${pct}`,
      detail: `DMARC policy only applies to ${pct}% of messages.`,
      recommendation: "Increase pct to 100 once you're confident your legitimate mail passes authentication.",
    })
  }

  const percentage = Math.round((score / 10) * 100)
  const status: PillarResult['status'] = score >= 8 ? 'pass' : score >= 4 ? 'partial' : 'fail'
  return { pillar: { score, maxScore: 10, percentage, status }, findings }
}

/** Fetch BIMI raw record only — runs in parallel with DMARC/SPF/DKIM. */
export async function fetchBimiRaw(domain: string): Promise<string | null> {
  return lookupTxt(`default._bimi.${domain}`, 600)
}

/** Pure scoring — no DNS. Call after fetchBimiRaw + DMARC policy are known. */
function scoreBimi(
  domain: string,
  rawRecord: string | null,
  dmarcPolicy: string | null,
): { findings: Finding[]; rawRecord: string | null; status: 'pass' | 'partial' | 'fail'; hasRecord: boolean; logoUrl: string | null; vmcUrl: string | null; dmarcReady: boolean } {
  const findings: Finding[] = []
  let logoUrl: string | null = null
  let vmcUrl: string | null = null
  const dmarcReady = dmarcPolicy === 'quarantine' || dmarcPolicy === 'reject'

  if (!rawRecord || !rawRecord.includes('v=BIMI1')) {
    findings.push({
      type: 'info', category: 'BIMI', title: 'No BIMI Record Found',
      detail: `No BIMI TXT record at default._bimi.${domain}. BIMI lets you display your brand logo in supporting email clients.`,
      recommendation: 'Publish a BIMI record (v=BIMI1) with your SVG logo URL to boost brand visibility in inboxes.',
    })
    if (!dmarcReady) {
      findings.push({
        type: 'info', category: 'BIMI', title: 'DMARC Policy Not Ready for BIMI',
        detail: `BIMI requires a DMARC policy of quarantine or reject. Current policy: ${dmarcPolicy || 'none'}.`,
        recommendation: 'Upgrade your DMARC policy to p=quarantine or p=reject before implementing BIMI.',
      })
    }
    return { findings, rawRecord: null, status: 'fail', hasRecord: false, logoUrl: null, vmcUrl: null, dmarcReady }
  }

  const bimiTags: Record<string, string> = {}
  rawRecord.split(';').forEach((part) => {
    const [key, ...valParts] = part.trim().split('=')
    if (key && valParts.length) bimiTags[key.trim().toLowerCase()] = valParts.join('=').trim()
  })

  findings.push({
    type: 'success', category: 'BIMI', title: 'BIMI Record Found',
    detail: 'Your domain has a BIMI TXT record published, enabling brand logo display in email clients.',
  })

  logoUrl = bimiTags['l'] || null
  if (logoUrl) {
    findings.push({ type: 'success', category: 'BIMI', title: 'Logo URL Present', detail: `Logo: ${logoUrl}` })
  } else {
    findings.push({
      type: 'warning', category: 'BIMI', title: 'No Logo URL (l= tag)',
      detail: 'BIMI record exists but no logo URL is specified.',
      recommendation: 'Add l=https://yourdomain.com/logo.svg pointing to a Tiny P/S SVG file.',
    })
  }

  vmcUrl = bimiTags['a'] || null
  if (vmcUrl) {
    findings.push({ type: 'success', category: 'BIMI', title: 'VMC Certificate Present', detail: `Authority evidence: ${vmcUrl}` })
  } else {
    findings.push({
      type: 'info', category: 'BIMI', title: 'No VMC Certificate (a= tag)',
      detail: 'A Verified Mark Certificate (VMC) is not required but is needed for logo display in Gmail.',
      recommendation: 'Obtain a VMC from DigiCert or Entrust to display your logo in Gmail and Apple Mail.',
    })
  }

  if (!dmarcReady) {
    findings.push({
      type: 'warning', category: 'BIMI', title: 'DMARC Policy Not Enforcing',
      detail: `BIMI requires DMARC policy of quarantine or reject. Current: ${dmarcPolicy || 'none'}.`,
      recommendation: "Your BIMI record exists but won't be honored until your DMARC policy is p=quarantine or p=reject.",
    })
  } else {
    findings.push({
      type: 'success', category: 'BIMI', title: 'DMARC Policy Ready for BIMI',
      detail: `DMARC policy (${dmarcPolicy}) meets the minimum requirement for BIMI.`,
    })
  }

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
  let spamPenalty = 0
  let rejectPenalty = 0

  if (pillars.dmarc.score === 0) { spamPenalty += 18; rejectPenalty += 8 }
  else {
    const policy = dmarcTags.p?.toLowerCase()
    if (policy === 'none') spamPenalty += 10
    else if (policy === 'quarantine') spamPenalty += 3
    if (!dmarcTags.rua) spamPenalty += 2
    if (!dmarcTags.sp) spamPenalty += 1
  }

  if (pillars.spf.score === 0) { spamPenalty += 15; rejectPenalty += 5 }
  else if (pillars.spf.score < 15) spamPenalty += 8
  else if (pillars.spf.score < 25) spamPenalty += 3

  if (pillars.dkim.score === 0) { spamPenalty += 14; rejectPenalty += 4 }

  if (pillars.config.score < 4) spamPenalty += 3
  else if (pillars.config.score < 8) spamPenalty += 1

  spamPenalty = Math.min(spamPenalty, 55)
  rejectPenalty = Math.min(rejectPenalty, 30)

  const rejected = Math.round(rejectPenalty)
  const spam = Math.round(spamPenalty)
  const delivered = Math.max(100 - rejected - spam, 5)
  const deliveryRate = delivered

  const AVG_LEAD_VALUE = 25
  const CONVERSION_RATE = 2.5
  const MONTHLY_VOLUME = 10000

  const emailsLostPer100 = spam + rejected
  const monthlyEmailsLost = Math.round((emailsLostPer100 / 100) * MONTHLY_VOLUME)
  const potentialLeadsLost = Math.round(monthlyEmailsLost * (CONVERSION_RATE / 100))
  const revenueAtRisk = potentialLeadsLost * AVG_LEAD_VALUE

  const riskFactors: RevenueImpact['riskFactors'] = []
  if (pillars.dmarc.score === 0) {
    riskFactors.push({
      factor: 'No DMARC Record', impact: 'critical',
      description: 'Google & Yahoo now require DMARC for bulk senders. Without it, up to 26% of your emails may land in spam or be rejected.',
    })
  } else if (dmarcTags.p?.toLowerCase() === 'none') {
    riskFactors.push({
      factor: 'DMARC Policy: Monitor Only', impact: 'high',
      description: "p=none only monitors — it doesn't stop spoofing. Receivers give less trust to domains without enforcement, costing ~10% deliverability.",
    })
  }
  if (pillars.spf.score === 0) {
    riskFactors.push({
      factor: 'Missing SPF Record', impact: 'critical',
      description: 'Without SPF, receiving servers cannot verify authorized senders. Expect ~20% of emails to be flagged or rejected.',
    })
  } else if (pillars.spf.percentage < 60) {
    riskFactors.push({
      factor: 'Weak SPF Configuration', impact: 'high',
      description: 'Soft-fail (~all) or neutral (?all) mechanisms provide limited protection. Hard-fail (-all) significantly improves deliverability.',
    })
  }
  if (pillars.dkim.score === 0) {
    riskFactors.push({
      factor: 'No DKIM Signing', impact: 'critical',
      description: 'Gmail penalizes unsigned emails heavily. Without DKIM, ~18% of emails to Gmail users may go to spam or be rejected.',
    })
  }
  if (pillars.config.score < 4 && pillars.dmarc.score > 0) {
    riskFactors.push({
      factor: 'Relaxed Alignment & Partial Coverage', impact: 'medium',
      description: 'Relaxed DKIM/SPF alignment and partial pct coverage weaken your DMARC enforcement effectiveness by ~3-5%.',
    })
  }
  if (totalScore >= 85 && riskFactors.length === 0) {
    riskFactors.push({
      factor: 'Strong Email Authentication', impact: 'low',
      description: 'Your domain has robust email authentication. Minimal deliverability risk from DNS configuration.',
    })
  }

  return {
    per100: { delivered, spam, rejected, deliveryRate },
    monthly: { emailVolume: MONTHLY_VOLUME, emailsLost: monthlyEmailsLost, potentialLeadsLost, revenueAtRisk },
    assumptions: { avgLeadValue: AVG_LEAD_VALUE, conversionRate: CONVERSION_RATE, monthlyVolume: MONTHLY_VOLUME },
    riskFactors,
  }
}

function classifyRisk(score: number): { level: ScanResult['riskLevel']; label: string } {
  if (score >= 85) return { level: 'healthy', label: 'Healthy' }
  if (score >= 60) return { level: 'medium', label: 'Needs Attention' }
  if (score >= 30) return { level: 'high', label: 'At Risk' }
  return { level: 'critical', label: 'Critical' }
}

/* ─── Public entrypoint ─────────────────────────────────────── */
export async function scanDomain(domain: string): Promise<ScanResult> {
  const start = Date.now()

  // All four DNS fetches fire simultaneously — BIMI no longer waits for DMARC.
  // Total DNS phase is bounded by the slowest of the four, not their sum.
  const [dmarcRaw, spfRaw, dkimResult, bimiRaw] = await Promise.all([
    lookupTxt(`_dmarc.${domain}`),
    lookupTxt(domain),
    scoreDkim(domain),
    fetchBimiRaw(domain),
  ])

  // Parse + score (all synchronous after DNS)
  const dmarcTags = parseDmarc(dmarcRaw)
  const spfParsed = parseSpf(spfRaw)
  const dmarcScore = scoreDmarc(dmarcTags)
  const spfScore = scoreSpf(spfParsed)
  const configScore = scoreConfig(dmarcTags)
  const bimiResult = scoreBimi(domain, bimiRaw, dmarcTags.p || null)

  // Aggregate
  const totalScore = dmarcScore.pillar.score + spfScore.pillar.score + dkimResult.pillar.score + configScore.pillar.score
  const risk = classifyRisk(totalScore)
  const findings = [
    ...dmarcScore.findings, ...spfScore.findings, ...dkimResult.findings,
    ...configScore.findings, ...bimiResult.findings,
  ]
  const pillars = {
    dmarc: dmarcScore.pillar, spf: spfScore.pillar,
    dkim: dkimResult.pillar, config: configScore.pillar,
  }
  const revenueImpact = calculateRevenueImpact(totalScore, pillars, dmarcTags)

  return {
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
    durationMs: Date.now() - start,
  }
}
