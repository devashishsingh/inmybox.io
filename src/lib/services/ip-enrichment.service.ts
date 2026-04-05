import { prisma } from '@/lib/prisma'
import type { IpEnrichmentData } from '@/types'
import dns from 'dns'
import { promisify } from 'util'

const reverseLookup = promisify(dns.reverse)

// Known email provider IP ranges and PTR patterns
const KNOWN_PROVIDERS: { pattern: RegExp; provider: string; type: string }[] = [
  { pattern: /\.google\.com$/i, provider: 'Google', type: 'cloud' },
  { pattern: /\.googleusercontent\.com$/i, provider: 'Google', type: 'cloud' },
  { pattern: /\.amazonaws\.com$/i, provider: 'Amazon SES', type: 'cloud' },
  { pattern: /\.outlook\.com$/i, provider: 'Microsoft 365', type: 'cloud' },
  { pattern: /\.protection\.outlook\.com$/i, provider: 'Microsoft 365', type: 'cloud' },
  { pattern: /\.mcsv\.net$/i, provider: 'Mailchimp', type: 'cloud' },
  { pattern: /\.rsgsv\.net$/i, provider: 'Mailchimp', type: 'cloud' },
  { pattern: /\.sendgrid\.net$/i, provider: 'SendGrid', type: 'cloud' },
  { pattern: /\.mailgun\.org$/i, provider: 'Mailgun', type: 'cloud' },
  { pattern: /\.postmarkapp\.com$/i, provider: 'Postmark', type: 'cloud' },
  { pattern: /\.sparkpostmail\.com$/i, provider: 'SparkPost', type: 'cloud' },
  { pattern: /\.constantcontact\.com$/i, provider: 'Constant Contact', type: 'cloud' },
  { pattern: /\.hubspot\.com$/i, provider: 'HubSpot', type: 'cloud' },
  { pattern: /\.mimecast\.com$/i, provider: 'Mimecast', type: 'enterprise' },
  { pattern: /\.pphosted\.com$/i, provider: 'Proofpoint', type: 'enterprise' },
  { pattern: /\.messagelabs\.com$/i, provider: 'Broadcom/Symantec', type: 'enterprise' },
  { pattern: /\.cloudflare\.com$/i, provider: 'Cloudflare', type: 'cloud' },
  { pattern: /\.ovh\.(net|com)$/i, provider: 'OVH', type: 'hosting' },
  { pattern: /\.hetzner\.(com|de)$/i, provider: 'Hetzner', type: 'hosting' },
  { pattern: /\.linode\.com$/i, provider: 'Linode', type: 'cloud' },
  { pattern: /\.digitalocean\.com$/i, provider: 'DigitalOcean', type: 'cloud' },
]

// ─── RDAP/WHOIS LOOKUP ─────────────────────────────────────────────

interface RdapResult {
  asn?: string
  asnOrg?: string
  country?: string
  city?: string
  netName?: string
  netRange?: string
}

/**
 * Performs RDAP lookup for an IP address using public RDAP endpoints.
 * Falls back gracefully if the lookup fails.
 */
async function rdapLookup(ip: string): Promise<RdapResult> {
  const result: RdapResult = {}

  try {
    // RDAP IP lookup via ARIN (redirects to correct RIR)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`https://rdap.org/ip/${encodeURIComponent(ip)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return result

    const data = await res.json()

    // Extract network name
    result.netName = data.name || undefined

    // Extract country from entities or top-level
    if (data.country) {
      result.country = data.country
    }

    // Extract CIDR/range
    if (data.startAddress && data.endAddress) {
      result.netRange = `${data.startAddress} - ${data.endAddress}`
    }

    // Extract org from entities
    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.vcardArray) {
          const vcard = entity.vcardArray[1]
          if (Array.isArray(vcard)) {
            for (const field of vcard) {
              if (field[0] === 'fn') result.asnOrg = result.asnOrg || field[3]
              if (field[0] === 'adr' && Array.isArray(field[3])) {
                const adr = field[3]
                result.city = result.city || (typeof adr[3] === 'string' ? adr[3] : undefined)
                result.country = result.country || (typeof adr[6] === 'string' ? adr[6] : undefined)
              }
            }
          }
        }
        // Check for ASN handle
        if (entity.handle && /^AS\d+$/i.test(entity.handle)) {
          result.asn = entity.handle
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn(`[ip-enrichment] RDAP lookup failed for ${ip}:`, err.message)
    }
  }

  // If no ASN yet, try ASN lookup
  if (!result.asn) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(
        `https://api.bgpview.io/ip/${encodeURIComponent(ip)}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        if (data.data?.prefixes?.[0]) {
          const prefix = data.data.prefixes[0]
          result.asn = prefix.asn?.asn ? `AS${prefix.asn.asn}` : undefined
          result.asnOrg = result.asnOrg || prefix.asn?.description || prefix.asn?.name
          result.country = result.country || prefix.asn?.country_code
        }
      }
    } catch {
      // BGPView fallback failed silently
    }
  }

  return result
}

/**
 * Enriches an IP address with reverse DNS, provider detection.
 * Checks cache first, then performs live lookups.
 */
export async function enrichIp(ip: string): Promise<IpEnrichmentData> {
  // Check cache first
  const cached = await prisma.ipEnrichment.findUnique({ where: { ip } })
  if (cached) {
    // Return cached if less than 7 days old
    const age = Date.now() - cached.lastUpdated.getTime()
    if (age < 7 * 24 * 60 * 60 * 1000) {
      return {
        ip: cached.ip,
        reverseDns: cached.reverseDns || undefined,
        asn: cached.asn || undefined,
        asnOrg: cached.asnOrg || undefined,
        country: cached.country || undefined,
        city: cached.city || undefined,
        provider: cached.provider || undefined,
        providerType: (cached.providerType as IpEnrichmentData['providerType']) || undefined,
        isKnownSender: cached.isKnownSender,
      }
    }
  }

  // Perform reverse DNS lookup
  let reverseDns: string | undefined
  try {
    const hostnames = await reverseLookup(ip)
    reverseDns = hostnames[0]
  } catch {
    // No reverse DNS available
  }

  // Detect provider from reverse DNS
  let provider: string | undefined
  let providerType: string | undefined
  let isKnownSender = false

  if (reverseDns) {
    for (const entry of KNOWN_PROVIDERS) {
      if (entry.pattern.test(reverseDns)) {
        provider = entry.provider
        providerType = entry.type
        isKnownSender = true
        break
      }
    }
  }

  // RDAP/WHOIS lookup for ASN, org, country, city
  const rdap = await rdapLookup(ip)

  const enrichment: IpEnrichmentData = {
    ip,
    reverseDns,
    asn: rdap.asn,
    asnOrg: rdap.asnOrg,
    country: rdap.country,
    city: rdap.city,
    provider,
    providerType: providerType as IpEnrichmentData['providerType'],
    isKnownSender,
  }

  // Upsert to cache
  await prisma.ipEnrichment.upsert({
    where: { ip },
    create: {
      ip,
      reverseDns: reverseDns || null,
      asn: rdap.asn || null,
      asnOrg: rdap.asnOrg || null,
      country: rdap.country || null,
      city: rdap.city || null,
      provider: provider || null,
      providerType: providerType || null,
      isKnownSender,
      lastUpdated: new Date(),
    },
    update: {
      reverseDns: reverseDns || null,
      asn: rdap.asn || null,
      asnOrg: rdap.asnOrg || null,
      country: rdap.country || null,
      city: rdap.city || null,
      provider: provider || null,
      providerType: providerType || null,
      isKnownSender,
      lastUpdated: new Date(),
    },
  })

  return enrichment
}

/**
 * Batch enriches multiple IPs. Skips already-cached ones.
 */
export async function batchEnrichIps(ips: string[]): Promise<IpEnrichmentData[]> {
  const unique = Array.from(new Set(ips))
  const results: IpEnrichmentData[] = []

  for (const ip of unique) {
    try {
      const enrichment = await enrichIp(ip)
      results.push(enrichment)
    } catch {
      results.push({ ip, isKnownSender: false })
    }
  }

  return results
}

/**
 * Gets cached enrichment data for an IP without performing lookup.
 */
export async function getCachedEnrichment(ip: string) {
  return prisma.ipEnrichment.findUnique({ where: { ip } })
}
