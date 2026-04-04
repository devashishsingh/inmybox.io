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

  const enrichment: IpEnrichmentData = {
    ip,
    reverseDns,
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
      provider: provider || null,
      providerType: providerType || null,
      isKnownSender,
      lastUpdated: new Date(),
    },
    update: {
      reverseDns: reverseDns || null,
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
