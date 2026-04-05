import { prisma } from '@/lib/prisma'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)
const resolveMx = promisify(dns.resolveMx)

// ─── TYPES ──────────────────────────────────────────────────────────

export type ReadinessStatus = 'ready' | 'partially_ready' | 'blocked' | 'unknown'
export type BimiOverallStatus = 'not_started' | 'setup' | 'ready' | 'published' | 'misconfigured' | 'regression'

interface ReadinessCheck {
  check: string
  status: 'pass' | 'fail' | 'warning'
  detail: string
}

interface ReadinessResult {
  status: ReadinessStatus
  score: number
  checks: ReadinessCheck[]
  blockers: string[]
  warnings: string[]
}

interface AssetValidationResult {
  logoValid: boolean
  logoError?: string
  certValid?: boolean
  certError?: string
  details: {
    logoUrl?: string
    logoStatusCode?: number
    logoContentType?: string
    logoAccessible?: boolean
    certUrl?: string
    certStatusCode?: number
    certAccessible?: boolean
  }
}

interface BimiRecord {
  dnsName: string
  txtValue: string
  copyReady: string
}

// ─── DNS HELPERS ────────────────────────────────────────────────────

async function lookupTxt(name: string): Promise<string[]> {
  try {
    const records = await resolveTxt(name)
    return records.map((r) => r.join(''))
  } catch {
    return []
  }
}

function parseDmarcRecord(txt: string): Record<string, string> {
  const tags: Record<string, string> = {}
  txt.split(';').forEach((part) => {
    const [key, ...vals] = part.trim().split('=')
    if (key && vals.length) tags[key.trim().toLowerCase()] = vals.join('=').trim()
  })
  return tags
}

// ─── 1. BIMI READINESS ENGINE ───────────────────────────────────────

export async function checkBimiReadiness(domainName: string, tenantId: string): Promise<ReadinessResult> {
  const checks: ReadinessCheck[] = []
  const blockers: string[] = []
  const warnings: string[] = []

  // Get domain data from our DB for sender intelligence
  const domain = await prisma.domain.findFirst({
    where: { domain: domainName, tenantId },
    include: {
      senders: { select: { ip: true, status: true, totalVolume: true, failCount: true } },
      reports: {
        orderBy: { dateEnd: 'desc' },
        take: 50,
        include: {
          records: { select: { spfResult: true, dkimResult: true, dmarcResult: true, count: true, sourceIp: true, spfDomain: true, dkimDomain: true, headerFrom: true } },
        },
      },
    },
  })

  // ── PARALLEL DNS LOOKUPS ──
  const [spfRecords, dmarcRecords] = await Promise.all([
    lookupTxt(domainName),
    lookupTxt(`_dmarc.${domainName}`),
  ])

  // ── SPF CHECK ──
  const spfRecord = spfRecords.find((r) => r.startsWith('v=spf1'))

  if (spfRecord) {
    checks.push({ check: 'SPF record exists', status: 'pass', detail: spfRecord })
  } else {
    checks.push({ check: 'SPF record exists', status: 'fail', detail: 'No SPF record found' })
    blockers.push('SPF record missing')
  }

  // SPF alignment from reports
  if (domain?.reports?.length) {
    const allRecords = domain.reports.flatMap((r) => r.records)
    const total = allRecords.reduce((s, r) => s + r.count, 0)
    const spfPass = allRecords.filter((r) => r.spfResult === 'pass').reduce((s, r) => s + r.count, 0)
    const spfRate = total > 0 ? spfPass / total : 0

    if (spfRate >= 0.95) {
      checks.push({ check: 'SPF alignment', status: 'pass', detail: `${(spfRate * 100).toFixed(1)}% pass rate` })
    } else if (spfRate >= 0.8) {
      checks.push({ check: 'SPF alignment', status: 'warning', detail: `${(spfRate * 100).toFixed(1)}% — should be ≥95%` })
      warnings.push(`SPF alignment at ${(spfRate * 100).toFixed(1)}% — needs improvement`)
    } else {
      checks.push({ check: 'SPF alignment', status: 'fail', detail: `${(spfRate * 100).toFixed(1)}% — too low` })
      blockers.push(`SPF alignment too low: ${(spfRate * 100).toFixed(1)}%`)
    }
  } else {
    checks.push({ check: 'SPF alignment', status: 'warning', detail: 'No report data to assess alignment' })
    warnings.push('No DMARC report data available to verify SPF alignment')
  }

  // ── DKIM CHECK ──
  // Check common DKIM selectors (parallel)
  const selectors = ['google', 'default', 'selector1', 'selector2', 'k1', 'mail', 'dkim', 's1', 's2']
  const dkimResults = await Promise.all(
    selectors.map(async (sel) => {
      const dkimRecords = await lookupTxt(`${sel}._domainkey.${domainName}`)
      return dkimRecords.some((r) => r.includes('v=DKIM1')) ? sel : null
    })
  )
  const validSelectors = dkimResults.filter((s): s is string => s !== null)

  if (validSelectors.length > 0) {
    checks.push({ check: 'DKIM record exists', status: 'pass', detail: `Selectors: ${validSelectors.join(', ')}` })
    checks.push({ check: 'DKIM selectors valid', status: 'pass', detail: `${validSelectors.length} valid selector(s)` })
  } else {
    checks.push({ check: 'DKIM record exists', status: 'fail', detail: 'No DKIM selectors found' })
    checks.push({ check: 'DKIM selectors valid', status: 'fail', detail: 'No valid selectors' })
    blockers.push('No valid DKIM selectors found')
  }

  // DKIM alignment from reports
  if (domain?.reports?.length) {
    const allRecords = domain.reports.flatMap((r) => r.records)
    const total = allRecords.reduce((s, r) => s + r.count, 0)
    const dkimPass = allRecords.filter((r) => r.dkimResult === 'pass').reduce((s, r) => s + r.count, 0)
    const dkimRate = total > 0 ? dkimPass / total : 0

    if (dkimRate >= 0.95) {
      checks.push({ check: 'DKIM alignment', status: 'pass', detail: `${(dkimRate * 100).toFixed(1)}% pass rate` })
    } else if (dkimRate >= 0.8) {
      checks.push({ check: 'DKIM alignment', status: 'warning', detail: `${(dkimRate * 100).toFixed(1)}% — should be ≥95%` })
      warnings.push(`DKIM alignment at ${(dkimRate * 100).toFixed(1)}% — needs improvement`)
    } else {
      checks.push({ check: 'DKIM alignment', status: 'fail', detail: `${(dkimRate * 100).toFixed(1)}% — too low` })
      blockers.push(`DKIM alignment too low: ${(dkimRate * 100).toFixed(1)}%`)
    }
  }

  // ── DMARC CHECK ──
  const dmarcTxt = dmarcRecords.find((r) => r.startsWith('v=DMARC1'))

  if (dmarcTxt) {
    checks.push({ check: 'DMARC record exists', status: 'pass', detail: dmarcTxt })
    const tags = parseDmarcRecord(dmarcTxt)

    // Policy strength
    const policy = tags.p?.toLowerCase()
    if (policy === 'reject') {
      checks.push({ check: 'DMARC policy strength', status: 'pass', detail: 'p=reject — strongest policy' })
    } else if (policy === 'quarantine') {
      checks.push({ check: 'DMARC policy strength', status: 'pass', detail: 'p=quarantine — acceptable for BIMI' })
    } else {
      checks.push({ check: 'DMARC policy strength', status: 'fail', detail: `p=${policy || 'none'} — must be quarantine or reject` })
      blockers.push(`DMARC policy is p=${policy || 'none'} — must be quarantine or reject`)
    }

    // pct check
    const pct = tags.pct ? parseInt(tags.pct) : 100
    if (pct === 100) {
      checks.push({ check: 'DMARC pct=100', status: 'pass', detail: 'Full policy enforcement' })
    } else {
      checks.push({ check: 'DMARC pct=100', status: 'fail', detail: `pct=${pct} — must be 100` })
      blockers.push(`DMARC pct is ${pct} — must be 100`)
    }
  } else {
    checks.push({ check: 'DMARC record exists', status: 'fail', detail: 'No DMARC record found' })
    checks.push({ check: 'DMARC policy strength', status: 'fail', detail: 'No DMARC record' })
    checks.push({ check: 'DMARC pct=100', status: 'fail', detail: 'No DMARC record' })
    blockers.push('DMARC record missing')
  }

  // ── SENDER INTELLIGENCE ──
  if (domain?.senders?.length) {
    const unknownSenders = domain.senders.filter((s) => s.status === 'unknown')
    const suspiciousSenders = domain.senders.filter((s) => s.status === 'suspicious')
    const totalVolume = domain.senders.reduce((s, sender) => s + sender.totalVolume, 0)
    const failingVolume = domain.senders.reduce((s, sender) => s + sender.failCount, 0)
    const failRate = totalVolume > 0 ? failingVolume / totalVolume : 0

    if (unknownSenders.length === 0) {
      checks.push({ check: 'No unknown senders', status: 'pass', detail: 'All senders identified' })
    } else {
      checks.push({ check: 'No unknown senders', status: 'warning', detail: `${unknownSenders.length} unknown sender(s)` })
      warnings.push(`${unknownSenders.length} unknown sender(s) — should be reviewed`)
    }

    if (suspiciousSenders.length === 0) {
      checks.push({ check: 'No unauthorized senders', status: 'pass', detail: 'No suspicious activity detected' })
    } else {
      checks.push({ check: 'No unauthorized senders', status: 'fail', detail: `${suspiciousSenders.length} suspicious sender(s)` })
      blockers.push(`${suspiciousSenders.length} unauthorized/suspicious sender(s) detected`)
    }

    // Authentication drift risk
    if (failRate > 0.1) {
      checks.push({ check: 'Authentication drift risk', status: 'fail', detail: `${(failRate * 100).toFixed(1)}% fail rate` })
      blockers.push(`High authentication fail rate: ${(failRate * 100).toFixed(1)}%`)
    } else if (failRate > 0.05) {
      checks.push({ check: 'Authentication drift risk', status: 'warning', detail: `${(failRate * 100).toFixed(1)}% fail rate` })
      warnings.push(`Authentication drift risk: ${(failRate * 100).toFixed(1)}% fail rate`)
    } else {
      checks.push({ check: 'Authentication drift risk', status: 'pass', detail: `${(failRate * 100).toFixed(1)}% fail rate — healthy` })
    }

    // Misaligned third-party vendors
    if (domain.reports?.length) {
      const allRecords = domain.reports.flatMap((r) => r.records)
      const misaligned = allRecords.filter(
        (r) => r.dmarcResult === 'fail' && r.headerFrom && r.headerFrom !== domainName
      )
      if (misaligned.length > 0) {
        const uniqueIps = new Set(misaligned.map((r) => r.sourceIp))
        checks.push({ check: 'Third-party vendor alignment', status: 'warning', detail: `${uniqueIps.size} misaligned vendor IP(s)` })
        warnings.push(`${uniqueIps.size} third-party vendor(s) with DMARC misalignment`)
      } else {
        checks.push({ check: 'Third-party vendor alignment', status: 'pass', detail: 'All vendors aligned' })
      }
    }
  }

  // ── CALCULATE SCORE ──
  const passCount = checks.filter((c) => c.status === 'pass').length
  const totalChecks = checks.length
  const score = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0

  let status: ReadinessStatus = 'unknown'
  if (blockers.length === 0 && score >= 90) {
    status = 'ready'
  } else if (blockers.length === 0 && score >= 60) {
    status = 'partially_ready'
  } else if (blockers.length > 0) {
    status = 'blocked'
  } else {
    status = 'partially_ready'
  }

  return { status, score, checks, blockers, warnings }
}

// ─── 2. BIMI ASSET VALIDATOR ────────────────────────────────────────

export async function validateBimiAssets(
  logoUrl?: string,
  certificateUrl?: string
): Promise<AssetValidationResult> {
  const result: AssetValidationResult = {
    logoValid: false,
    details: {},
  }

  // Validate logo
  if (logoUrl) {
    result.details.logoUrl = logoUrl

    if (!logoUrl.startsWith('https://')) {
      result.logoError = 'Logo URL must use HTTPS'
      result.details.logoAccessible = false
    } else {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(logoUrl, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        })
        clearTimeout(timeout)

        result.details.logoStatusCode = res.status
        result.details.logoContentType = res.headers.get('content-type') || undefined

        if (!res.ok) {
          result.logoError = `Logo URL returned HTTP ${res.status}`
          result.details.logoAccessible = false
        } else {
          result.details.logoAccessible = true
          const contentType = res.headers.get('content-type') || ''

          if (!contentType.includes('svg') && !contentType.includes('image/svg+xml')) {
            result.logoError = `Invalid content type: ${contentType} — must be image/svg+xml`
          } else {
            // Fetch actual content for basic SVG validation
            const svgRes = await fetch(logoUrl, { signal: AbortSignal.timeout(8000) })
            const svgText = await svgRes.text()

            if (!svgText.includes('<svg') || !svgText.includes('</svg>')) {
              result.logoError = 'File does not appear to be valid SVG'
            } else if (svgText.includes('<script') || svgText.includes('javascript:')) {
              result.logoError = 'SVG contains scripts — BIMI requires Tiny PS SVG without scripts'
            } else {
              result.logoValid = true
            }
          }
        }
      } catch (err: any) {
        result.logoError = err.name === 'AbortError' ? 'Logo URL timed out' : `Logo URL unreachable: ${err.message}`
        result.details.logoAccessible = false
      }
    }
  } else {
    result.logoError = 'No logo URL provided'
  }

  // Validate certificate (optional)
  if (certificateUrl) {
    result.details.certUrl = certificateUrl

    if (!certificateUrl.startsWith('https://')) {
      result.certValid = false
      result.certError = 'Certificate URL must use HTTPS'
      result.details.certAccessible = false
    } else {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(certificateUrl, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        })
        clearTimeout(timeout)

        result.details.certStatusCode = res.status
        result.details.certAccessible = res.ok

        if (!res.ok) {
          result.certValid = false
          result.certError = `Certificate URL returned HTTP ${res.status}`
        } else {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('pem') || contentType.includes('x-pem-file') || contentType.includes('pkix-cert') || contentType.includes('octet-stream')) {
            result.certValid = true
          } else {
            result.certValid = true // Don't block on content type alone for certs
          }
        }
      } catch (err: any) {
        result.certValid = false
        result.certError = err.name === 'AbortError' ? 'Certificate URL timed out' : `Certificate URL unreachable: ${err.message}`
        result.details.certAccessible = false
      }
    }
  }

  return result
}

// ─── 3. BIMI RECORD GENERATOR ───────────────────────────────────────

export function generateBimiRecord(
  domainName: string,
  logoUrl: string,
  certificateUrl?: string
): BimiRecord {
  const dnsName = `default._bimi.${domainName}`
  const certPart = certificateUrl ? ` a=${certificateUrl};` : ''
  const txtValue = `v=BIMI1; l=${logoUrl};${certPart}`
  const copyReady = `${dnsName} TXT "${txtValue}"`

  return { dnsName, txtValue, copyReady }
}

// ─── 4. CHECK EXISTING BIMI DNS ─────────────────────────────────────

export async function checkBimiDns(domainName: string): Promise<{
  found: boolean
  record?: string
  logoUrl?: string
  certUrl?: string
}> {
  const records = await lookupTxt(`default._bimi.${domainName}`)
  const bimiTxt = records.find((r) => r.startsWith('v=BIMI1'))

  if (!bimiTxt) return { found: false }

  const tags = parseDmarcRecord(bimiTxt)
  return {
    found: true,
    record: bimiTxt,
    logoUrl: tags.l,
    certUrl: tags.a,
  }
}

// ─── 5. FULL BIMI ASSESSMENT ────────────────────────────────────────

export async function runFullBimiCheck(tenantId: string, domainId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { domain: true, tenantId: true },
  })

  if (!domain || domain.tenantId !== tenantId) {
    throw new Error('Domain not found or unauthorized')
  }

  // Get or create BIMI config
  let config = await prisma.bimiConfig.findUnique({
    where: { tenantId_domainId: { tenantId, domainId } },
  })

  if (!config) {
    config = await prisma.bimiConfig.create({
      data: { tenantId, domainId },
    })
  }

  // 1. Readiness check
  const readiness = await checkBimiReadiness(domain.domain, tenantId)

  // 2. Asset validation (if URLs configured)
  let assetResult: AssetValidationResult | undefined
  if (config.logoUrl) {
    assetResult = await validateBimiAssets(config.logoUrl, config.certificateUrl || undefined)
  }

  // 3. Check existing BIMI DNS
  const dnsResult = await checkBimiDns(domain.domain)

  // Determine overall status
  let overallStatus: BimiOverallStatus = 'not_started'
  if (dnsResult.found && readiness.status === 'ready') {
    overallStatus = 'published'
  } else if (dnsResult.found && readiness.status !== 'ready') {
    overallStatus = 'regression'
  } else if (readiness.status === 'ready' && assetResult?.logoValid) {
    overallStatus = 'ready'
  } else if (config.logoUrl || config.certificateUrl) {
    overallStatus = 'setup'
  } else if (readiness.status === 'blocked') {
    overallStatus = 'not_started'
  }

  // Update config
  await prisma.bimiConfig.update({
    where: { id: config.id },
    data: {
      readinessStatus: readiness.status,
      readinessScore: readiness.score,
      blockers: JSON.stringify(readiness.blockers),
      logoValid: assetResult?.logoValid ?? false,
      logoError: assetResult?.logoError || null,
      certValid: assetResult?.certValid ?? null,
      certError: assetResult?.certError || null,
      overallStatus,
      lastCheckAt: new Date(),
      lastCheckResult: JSON.stringify({
        readiness,
        assets: assetResult,
        dns: dnsResult,
      }),
    },
  })

  // Log check
  await prisma.bimiCheck.create({
    data: {
      bimiConfigId: config.id,
      checkType: 'readiness',
      status: readiness.status === 'ready' ? 'pass' : readiness.status === 'partially_ready' ? 'warning' : 'fail',
      details: JSON.stringify({ readiness, assets: assetResult, dns: dnsResult }),
    },
  })

  return {
    configId: config.id,
    domain: domain.domain,
    readiness,
    assets: assetResult,
    dns: dnsResult,
    overallStatus,
    record: config.logoUrl
      ? generateBimiRecord(domain.domain, config.logoUrl, config.certificateUrl || undefined)
      : null,
  }
}

// ─── 6. UPDATE BIMI ASSETS ──────────────────────────────────────────

export async function updateBimiAssets(
  tenantId: string,
  domainId: string,
  data: { logoUrl?: string; certificateUrl?: string }
) {
  const existing = await prisma.bimiConfig.findUnique({
    where: { tenantId_domainId: { tenantId, domainId } },
  })

  const config = existing
    ? await prisma.bimiConfig.update({
        where: { id: existing.id },
        data: {
          logoUrl: data.logoUrl ?? existing.logoUrl,
          certificateUrl: data.certificateUrl ?? existing.certificateUrl,
          overallStatus: 'setup',
        },
      })
    : await prisma.bimiConfig.create({
        data: {
          tenantId,
          domainId,
          logoUrl: data.logoUrl,
          certificateUrl: data.certificateUrl,
          overallStatus: 'setup',
        },
      })

  // Generate record if logo provided
  const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { domain: true } })
  if (domain && config.logoUrl) {
    const record = generateBimiRecord(domain.domain, config.logoUrl, config.certificateUrl || undefined)
    await prisma.bimiConfig.update({
      where: { id: config.id },
      data: { generatedRecord: record.txtValue },
    })
  }

  return config
}

// ─── 7. MARK AS PUBLISHED ───────────────────────────────────────────

export async function markBimiPublished(tenantId: string, domainId: string) {
  const config = await prisma.bimiConfig.findUnique({
    where: { tenantId_domainId: { tenantId, domainId } },
  })
  if (!config) throw new Error('BIMI config not found')

  return prisma.bimiConfig.update({
    where: { id: config.id },
    data: {
      publishedAt: new Date(),
      overallStatus: 'published',
    },
  })
}

// ─── 8. GET BIMI STATUS ─────────────────────────────────────────────

export async function getBimiStatus(tenantId: string, domainId: string) {
  const config = await prisma.bimiConfig.findUnique({
    where: { tenantId_domainId: { tenantId, domainId } },
    include: {
      domain: { select: { domain: true } },
      checks: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  return config
}

// ─── 9. MONITORING ──────────────────────────────────────────────────

export async function monitorAllBimiConfigs() {
  const activeConfigs = await prisma.bimiConfig.findMany({
    where: {
      overallStatus: { in: ['published', 'ready', 'setup', 'regression'] },
    },
    include: {
      domain: { select: { domain: true, tenantId: true } },
    },
  })

  const results = []

  for (const config of activeConfigs) {
    try {
      const result = await runFullBimiCheck(config.tenantId, config.domainId)
      results.push({ domain: config.domain.domain, status: result.overallStatus })
    } catch (err: any) {
      results.push({ domain: config.domain.domain, status: 'error', error: err.message })
    }
  }

  return results
}

// ─── 10. PROVIDER DETECTION ─────────────────────────────────────────

export async function detectEmailProvider(domainName: string): Promise<{
  provider: string
  bimiSupport: 'full' | 'partial' | 'none' | 'unknown'
  guidance: string
}> {
  try {
    const mxRecords = await resolveMx(domainName)
    const mxHosts = mxRecords.map((r) => r.exchange.toLowerCase())

    if (mxHosts.some((h) => h.includes('google') || h.includes('gmail'))) {
      return {
        provider: 'Google Workspace',
        bimiSupport: 'full',
        guidance: 'Google Gmail fully supports BIMI. When your domain meets all requirements (DMARC p=quarantine/reject at pct=100, valid SVG logo, and optionally a VMC certificate), your brand logo will appear in Gmail on web and mobile.',
      }
    }

    if (mxHosts.some((h) => h.includes('outlook') || h.includes('microsoft'))) {
      return {
        provider: 'Microsoft 365',
        bimiSupport: 'none',
        guidance: 'Microsoft Outlook and Exchange Online do not currently render BIMI logos in their inbox. However, configuring BIMI still strengthens your domain reputation with other mailbox providers like Gmail and Yahoo, and positions you for future Microsoft support.',
      }
    }

    if (mxHosts.some((h) => h.includes('yahoo') || h.includes('yahoodns'))) {
      return {
        provider: 'Yahoo Mail',
        bimiSupport: 'full',
        guidance: 'Yahoo Mail fully supports BIMI. Your brand logo will appear next to your emails in Yahoo Mail when all requirements are met.',
      }
    }

    if (mxHosts.some((h) => h.includes('protonmail') || h.includes('proton'))) {
      return {
        provider: 'ProtonMail',
        bimiSupport: 'partial',
        guidance: 'ProtonMail has partial BIMI support. Your logo may appear for some recipients. Full BIMI benefits are best observed on Gmail and Yahoo.',
      }
    }

    if (mxHosts.some((h) => h.includes('zoho'))) {
      return {
        provider: 'Zoho Mail',
        bimiSupport: 'partial',
        guidance: 'Zoho has begun rolling out BIMI support. Your logo visibility may vary. Full benefits are currently best on Gmail and Yahoo.',
      }
    }

    return {
      provider: mxHosts[0] || 'Unknown',
      bimiSupport: 'unknown',
      guidance: 'Your email provider\'s BIMI support status is unknown. BIMI is a DNS-standard that works independently of your sending provider. Gmail and Yahoo are the primary receivers that display BIMI logos.',
    }
  } catch {
    return {
      provider: 'Unknown',
      bimiSupport: 'unknown',
      guidance: 'Could not detect your email provider. BIMI is a DNS-level brand authentication standard. It works with any sending infrastructure and is primarily displayed by Gmail and Yahoo Mail.',
    }
  }
}
