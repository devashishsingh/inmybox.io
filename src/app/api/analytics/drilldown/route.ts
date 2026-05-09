import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getDomainIds } from '@/lib/services/domain.service'

// Determine the effective auth result for a record, falling back to a
// heuristic for legacy rows where spfAuthResult/dkimAuthResult is null.
// Heuristic: if alignment passed, auth necessarily passed (you can't align
// without authenticating). If alignment failed, presence of an authenticated
// domain is a weak signal that auth produced an identity (likely passed but
// did not align). Absent domain implies auth did not produce a usable
// identity, treated as 'fail'. The `inferred` flag lets the UI render a
// subtle indicator for legacy data.
function resolveAuth(
  storedAuth: string | null,
  alignmentResult: string,
  domain: string | null
): { result: string; inferred: boolean } {
  if (storedAuth) return { result: storedAuth, inferred: false }
  if (alignmentResult === 'pass') return { result: 'pass', inferred: true }
  if (domain && domain.length > 0) return { result: 'pass', inferred: true }
  return { result: 'fail', inferred: true }
}

function isPass(v: string | null | undefined): boolean {
  return v === 'pass'
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)
  if (!ctx) {
    return NextResponse.json({ records: [], ipAggregation: [], summary: {} })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const filter = searchParams.get('filter')

  const domainIds = await getDomainIds(ctx.tenantId)
  if (domainIds.length === 0) {
    return NextResponse.json({ records: [], ipAggregation: [], summary: {} })
  }

  const records = await prisma.dmarcRecord.findMany({
    where: { report: { domainId: { in: domainIds } } },
    include: {
      report: {
        select: {
          reportId: true,
          orgName: true,
          dateBegin: true,
          dateEnd: true,
          policyP: true,
          domain: { select: { domain: true } },
        },
      },
      ipEnrichment: {
        select: {
          asn: true,
          asnOrg: true,
          country: true,
          provider: true,
          providerType: true,
          reverseDns: true,
          isKnownSender: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // ─── Aggregation ────────────────────────────────────────────────
  let totalVolume = 0
  let passVolume = 0
  let failVolume = 0

  type IpAgg = {
    ip: string
    totalVolume: number
    spfPass: number; spfFail: number
    dkimPass: number; dkimFail: number
    dmarcPass: number; dmarcFail: number
    spfAuthPass: number; spfAuthFail: number
    dkimAuthPass: number; dkimAuthFail: number
    fullyAlignedVolume: number
    misalignedVolume: number
    authFailedVolume: number
    inferredVolume: number
    dispositionNone: number; dispositionQuarantine: number; dispositionReject: number
    domains: Set<string>
    headerFroms: Set<string>
    spfDomains: Set<string>
    dkimDomains: Set<string>
    orgs: Set<string>
    lastSeen: Date
    enrichment: typeof records[number]['ipEnrichment']
  }

  const ipMap = new Map<string, IpAgg>()

  let fullyAlignedTotal = 0
  let misalignedTotal = 0
  let authFailedTotal = 0

  for (const rec of records) {
    totalVolume += rec.count

    if (type === 'spf') {
      isPass(rec.spfResult) ? (passVolume += rec.count) : (failVolume += rec.count)
    } else if (type === 'dkim') {
      isPass(rec.dkimResult) ? (passVolume += rec.count) : (failVolume += rec.count)
    } else if (type === 'dmarc') {
      isPass(rec.dmarcResult) ? (passVolume += rec.count) : (failVolume += rec.count)
    } else if (type === 'disposition') {
      rec.disposition === 'none' ? (passVolume += rec.count) : (failVolume += rec.count)
    }

    const spfAuth = resolveAuth(rec.spfAuthResult, rec.spfResult, rec.spfDomain)
    const dkimAuth = resolveAuth(rec.dkimAuthResult, rec.dkimResult, rec.dkimDomain)

    const spfFullyOk = isPass(spfAuth.result) && isPass(rec.spfResult)
    const dkimFullyOk = isPass(dkimAuth.result) && isPass(rec.dkimResult)
    const anyAuthPass = isPass(spfAuth.result) || isPass(dkimAuth.result)

    let outcome: 'fully_aligned' | 'misaligned' | 'auth_failed'
    if (spfFullyOk || dkimFullyOk) outcome = 'fully_aligned'
    else if (anyAuthPass) outcome = 'misaligned'
    else outcome = 'auth_failed'

    if (outcome === 'fully_aligned') fullyAlignedTotal += rec.count
    else if (outcome === 'misaligned') misalignedTotal += rec.count
    else authFailedTotal += rec.count

    const existing: IpAgg = ipMap.get(rec.sourceIp) || {
      ip: rec.sourceIp,
      totalVolume: 0,
      spfPass: 0, spfFail: 0,
      dkimPass: 0, dkimFail: 0,
      dmarcPass: 0, dmarcFail: 0,
      spfAuthPass: 0, spfAuthFail: 0,
      dkimAuthPass: 0, dkimAuthFail: 0,
      fullyAlignedVolume: 0,
      misalignedVolume: 0,
      authFailedVolume: 0,
      inferredVolume: 0,
      dispositionNone: 0, dispositionQuarantine: 0, dispositionReject: 0,
      domains: new Set<string>(),
      headerFroms: new Set<string>(),
      spfDomains: new Set<string>(),
      dkimDomains: new Set<string>(),
      orgs: new Set<string>(),
      lastSeen: new Date(0),
      enrichment: rec.ipEnrichment,
    }

    existing.totalVolume += rec.count
    isPass(rec.spfResult) ? (existing.spfPass += rec.count) : (existing.spfFail += rec.count)
    isPass(rec.dkimResult) ? (existing.dkimPass += rec.count) : (existing.dkimFail += rec.count)
    isPass(rec.dmarcResult) ? (existing.dmarcPass += rec.count) : (existing.dmarcFail += rec.count)
    isPass(spfAuth.result) ? (existing.spfAuthPass += rec.count) : (existing.spfAuthFail += rec.count)
    isPass(dkimAuth.result) ? (existing.dkimAuthPass += rec.count) : (existing.dkimAuthFail += rec.count)

    if (outcome === 'fully_aligned') existing.fullyAlignedVolume += rec.count
    else if (outcome === 'misaligned') existing.misalignedVolume += rec.count
    else existing.authFailedVolume += rec.count
    if (spfAuth.inferred || dkimAuth.inferred) existing.inferredVolume += rec.count

    if (rec.disposition === 'none') existing.dispositionNone += rec.count
    if (rec.disposition === 'quarantine') existing.dispositionQuarantine += rec.count
    if (rec.disposition === 'reject') existing.dispositionReject += rec.count

    if (rec.report.domain?.domain) existing.domains.add(rec.report.domain.domain)
    if (rec.headerFrom) existing.headerFroms.add(rec.headerFrom)
    if (rec.spfDomain) existing.spfDomains.add(rec.spfDomain)
    if (rec.dkimDomain) existing.dkimDomains.add(rec.dkimDomain)
    if (rec.report.orgName) existing.orgs.add(rec.report.orgName)

    const recDate = new Date(rec.report.dateEnd)
    if (recDate > existing.lastSeen) existing.lastSeen = recDate
    if (!existing.enrichment && rec.ipEnrichment) existing.enrichment = rec.ipEnrichment

    ipMap.set(rec.sourceIp, existing)
  }

  // ─── Filter records ─────────────────────────────────────────────
  let filtered = records
  if (type && type !== 'ip' && filter) {
    filtered = records.filter((rec) => {
      switch (type) {
        case 'spf': return rec.spfResult === filter
        case 'dkim': return rec.dkimResult === filter
        case 'dmarc': return rec.dmarcResult === filter
        case 'disposition': return rec.disposition === filter
        default: return true
      }
    })
  } else if (type === 'ip' && filter) {
    filtered = records.filter((rec) => rec.sourceIp === filter)
  }

  // ─── Serialize records ──────────────────────────────────────────
  const serialized = filtered.map((rec) => {
    const spfAuth = resolveAuth(rec.spfAuthResult, rec.spfResult, rec.spfDomain)
    const dkimAuth = resolveAuth(rec.dkimAuthResult, rec.dkimResult, rec.dkimDomain)
    return {
      id: rec.id,
      sourceIp: rec.sourceIp,
      count: rec.count,
      disposition: rec.disposition,
      // alignment (existing)
      spfResult: rec.spfResult,
      dkimResult: rec.dkimResult,
      // authentication (resolved — heuristic for legacy nulls)
      spfAuthResult: spfAuth.result,
      dkimAuthResult: dkimAuth.result,
      spfAuthInferred: spfAuth.inferred,
      dkimAuthInferred: dkimAuth.inferred,
      spfAuthResultRaw: rec.spfAuthResult,
      dkimAuthResultRaw: rec.dkimAuthResult,
      dmarcResult: rec.dmarcResult,
      headerFrom: rec.headerFrom,
      envelopeFrom: rec.envelopeFrom,
      spfDomain: rec.spfDomain,
      dkimDomain: rec.dkimDomain,
      reportOrg: rec.report.orgName,
      reportDomain: rec.report.domain?.domain,
      reportDate: rec.report.dateBegin,
      reportEnd: rec.report.dateEnd,
      policy: rec.report.policyP,
      enrichment: rec.ipEnrichment,
    }
  })

  // ─── Serialize IP aggregation ───────────────────────────────────
  const ipAggregation = Array.from(ipMap.values())
    .map((ip) => {
      // Per-IP failure reason — dominant bucket with a "mixed" tiebreaker.
      let failureReason: 'fully_aligned' | 'misaligned' | 'auth_failed' | 'mixed'
      const buckets: Array<[number, 'fully_aligned' | 'misaligned' | 'auth_failed']> = [
        [ip.fullyAlignedVolume, 'fully_aligned'],
        [ip.misalignedVolume, 'misaligned'],
        [ip.authFailedVolume, 'auth_failed'],
      ]
      buckets.sort((a, b) => b[0] - a[0])
      const top = buckets[0]
      const second = buckets[1]
      if (second[0] > 0 && second[0] / Math.max(top[0], 1) > 0.9) {
        failureReason = 'mixed'
      } else {
        failureReason = top[1]
      }

      return {
        ip: ip.ip,
        totalVolume: ip.totalVolume,
        spfPass: ip.spfPass, spfFail: ip.spfFail,
        dkimPass: ip.dkimPass, dkimFail: ip.dkimFail,
        dmarcPass: ip.dmarcPass, dmarcFail: ip.dmarcFail,
        spfAuthPass: ip.spfAuthPass, spfAuthFail: ip.spfAuthFail,
        dkimAuthPass: ip.dkimAuthPass, dkimAuthFail: ip.dkimAuthFail,
        fullyAlignedVolume: ip.fullyAlignedVolume,
        misalignedVolume: ip.misalignedVolume,
        authFailedVolume: ip.authFailedVolume,
        inferredVolume: ip.inferredVolume,
        dispositionNone: ip.dispositionNone,
        dispositionQuarantine: ip.dispositionQuarantine,
        dispositionReject: ip.dispositionReject,
        domains: Array.from(ip.domains),
        headerFroms: Array.from(ip.headerFroms),
        spfDomains: Array.from(ip.spfDomains),
        dkimDomains: Array.from(ip.dkimDomains),
        orgs: Array.from(ip.orgs),
        lastSeen: ip.lastSeen,
        enrichment: ip.enrichment,
        failureReason,
      }
    })
    .sort((a, b) => b.totalVolume - a.totalVolume)

  const topMisaligned = ipAggregation
    .filter((ip) => ip.failureReason === 'misaligned' || ip.misalignedVolume > 0)
    .sort((a, b) => b.misalignedVolume - a.misalignedVolume)[0] || null

  const fullyAlignedSenders = ipAggregation.filter((ip) => ip.failureReason === 'fully_aligned').length
  const misalignedSenders = ipAggregation.filter((ip) => ip.misalignedVolume > 0 && ip.failureReason !== 'fully_aligned').length
  const authFailedSenders = ipAggregation.filter((ip) => ip.authFailedVolume > 0 && ip.failureReason !== 'fully_aligned').length

  return NextResponse.json({
    records: serialized,
    ipAggregation,
    summary: {
      totalRecords: records.length,
      totalVolume,
      passVolume,
      failVolume,
      passRate: totalVolume > 0 ? passVolume / totalVolume : 0,
      failRate: totalVolume > 0 ? failVolume / totalVolume : 0,
      fullyAlignedVolume: fullyAlignedTotal,
      misalignedVolume: misalignedTotal,
      authFailedVolume: authFailedTotal,
      totalSenders: ipAggregation.length,
      fullyAlignedSenders,
      misalignedSenders,
      authFailedSenders,
      topMisaligned: topMisaligned
        ? {
            ip: topMisaligned.ip,
            volume: topMisaligned.misalignedVolume,
            providerName: topMisaligned.enrichment?.provider || topMisaligned.enrichment?.asnOrg || null,
            spfDomains: topMisaligned.spfDomains,
            dkimDomains: topMisaligned.dkimDomains,
            headerFroms: topMisaligned.headerFroms,
          }
        : null,
    },
  })
}
