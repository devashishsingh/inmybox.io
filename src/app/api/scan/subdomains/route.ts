import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'

const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

// Common subdomains that typically have their own mail configuration
const COMMON_SUBDOMAINS = [
  'mail', 'smtp', 'email', 'mx',
  'app', 'portal', 'my',
  'blog', 'shop', 'store', 'www',
  'dev', 'staging', 'test', 'sandbox',
  'marketing', 'sales', 'support', 'help',
  'newsletter', 'notify', 'notifications',
  'crm', 'hr', 'internal', 'intranet',
  'api', 'cdn', 'status',
]

function isValidDomain(domain: string): boolean {
  if (domain.length > 253) return false
  const pattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/
  return pattern.test(domain)
}

function resolveMxFast(hostname: string, timeoutMs = 2000): Promise<dns.MxRecord[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve([]), timeoutMs)
    resolver.resolveMx(hostname, (err, records) => {
      clearTimeout(timer)
      if (err) resolve([])
      else resolve(records || [])
    })
  })
}

function resolveTxtFast(hostname: string, timeoutMs = 2000): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve([]), timeoutMs)
    resolver.resolveTxt(hostname, (err, records) => {
      clearTimeout(timer)
      if (err) resolve([])
      else resolve(records || [])
    })
  })
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
    // Check all common subdomains in parallel for MX + SPF/DMARC records
    const results = await Promise.allSettled(
      COMMON_SUBDOMAINS.map(async (sub) => {
        const fqdn = `${sub}.${domain}`
        const [mx, txt] = await Promise.all([
          resolveMxFast(fqdn, 1500),
          resolveTxtFast(fqdn, 1500),
        ])

        const hasMx = mx.length > 0
        const txtJoined = txt.map(chunks => chunks.join('')).join('\n')
        const hasSpf = txtJoined.includes('v=spf1')
        const hasDmarc = false // DMARC is always at _dmarc.subdomain.domain

        // Also check DMARC for this subdomain
        let dmarcFound = false
        try {
          const dmarcTxt = await resolveTxtFast(`_dmarc.${fqdn}`, 1000)
          const dmarcJoined = dmarcTxt.map(c => c.join('')).join('\n')
          dmarcFound = dmarcJoined.includes('v=DMARC1')
        } catch {}

        return {
          subdomain: sub,
          fqdn,
          hasMx,
          hasSpf,
          hasDmarc: dmarcFound,
          mxRecords: mx.map(r => `${r.exchange} (priority ${r.priority})`),
          // Consider it "email-active" if it has MX or SPF
          emailActive: hasMx || hasSpf,
        }
      })
    )

    const discovered = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(r => r.emailActive)

    return NextResponse.json({
      domain,
      totalChecked: COMMON_SUBDOMAINS.length,
      discovered,
    })
  } catch (err) {
    // INMYBOX ENHANCEMENT — Phase 5: Safe error logging (no raw objects)
    console.error(`[scan/subdomains] Subdomain discovery error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return NextResponse.json(
      { error: 'Failed to discover subdomains. Please try again.' },
      { status: 500 }
    )
  }
}
