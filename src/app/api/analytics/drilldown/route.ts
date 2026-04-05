import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { resolveTenantContext } from '@/lib/services/tenant.service'
import { getDomainIds } from '@/lib/services/domain.service'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const ctx = await resolveTenantContext(userId)

  if (!ctx) {
    return NextResponse.json({ records: [], summary: {} })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // spf, dkim, dmarc, ip, disposition
  const filter = searchParams.get('filter') // pass, fail, none, quarantine, reject, or specific IP

  const domainIds = await getDomainIds(ctx.tenantId)
  if (domainIds.length === 0) {
    return NextResponse.json({ records: [], summary: {} })
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
    },
    orderBy: { createdAt: 'desc' },
  })

  // Build summary counts
  let totalVolume = 0
  let passVolume = 0
  let failVolume = 0

  const resultField = (rec: typeof records[0]) => {
    switch (type) {
      case 'spf': return rec.spfResult
      case 'dkim': return rec.dkimResult
      case 'dmarc': return rec.dmarcResult
      case 'disposition': return rec.disposition
      case 'ip': return rec.sourceIp
      default: return rec.dmarcResult
    }
  }

  // Compute per-IP aggregation for IP view
  const ipMap = new Map<string, {
    ip: string
    totalVolume: number
    spfPass: number
    spfFail: number
    dkimPass: number
    dkimFail: number
    dmarcPass: number
    dmarcFail: number
    dispositionNone: number
    dispositionQuarantine: number
    dispositionReject: number
    domains: Set<string>
    orgs: Set<string>
    lastSeen: Date
  }>()

  for (const rec of records) {
    totalVolume += rec.count

    if (type === 'spf') {
      if (rec.spfResult === 'pass') passVolume += rec.count
      else failVolume += rec.count
    } else if (type === 'dkim') {
      if (rec.dkimResult === 'pass') passVolume += rec.count
      else failVolume += rec.count
    } else if (type === 'dmarc') {
      if (rec.dmarcResult === 'pass') passVolume += rec.count
      else failVolume += rec.count
    } else if (type === 'disposition') {
      if (rec.disposition === 'none') passVolume += rec.count
      else failVolume += rec.count
    }

    // Build IP aggregation
    const existing = ipMap.get(rec.sourceIp) || {
      ip: rec.sourceIp,
      totalVolume: 0,
      spfPass: 0, spfFail: 0,
      dkimPass: 0, dkimFail: 0,
      dmarcPass: 0, dmarcFail: 0,
      dispositionNone: 0, dispositionQuarantine: 0, dispositionReject: 0,
      domains: new Set<string>(),
      orgs: new Set<string>(),
      lastSeen: new Date(0),
    }

    existing.totalVolume += rec.count
    if (rec.spfResult === 'pass') existing.spfPass += rec.count; else existing.spfFail += rec.count
    if (rec.dkimResult === 'pass') existing.dkimPass += rec.count; else existing.dkimFail += rec.count
    if (rec.dmarcResult === 'pass') existing.dmarcPass += rec.count; else existing.dmarcFail += rec.count
    if (rec.disposition === 'none') existing.dispositionNone += rec.count
    if (rec.disposition === 'quarantine') existing.dispositionQuarantine += rec.count
    if (rec.disposition === 'reject') existing.dispositionReject += rec.count
    if (rec.report.domain?.domain) existing.domains.add(rec.report.domain.domain)
    if (rec.report.orgName) existing.orgs.add(rec.report.orgName)
    const recDate = new Date(rec.report.dateEnd)
    if (recDate > existing.lastSeen) existing.lastSeen = recDate

    ipMap.set(rec.sourceIp, existing)
  }

  // Filter records based on type + filter
  let filtered = records
  if (type && type !== 'ip' && filter) {
    filtered = records.filter((rec) => {
      const val = resultField(rec)
      return val === filter
    })
  } else if (type === 'ip' && filter) {
    filtered = records.filter((rec) => rec.sourceIp === filter)
  }

  // Serialize records
  const serialized = filtered.map((rec) => ({
    id: rec.id,
    sourceIp: rec.sourceIp,
    count: rec.count,
    disposition: rec.disposition,
    spfResult: rec.spfResult,
    dkimResult: rec.dkimResult,
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
  }))

  // Serialize IP aggregation
  const ipAggregation = Array.from(ipMap.values())
    .map((ip) => ({
      ...ip,
      domains: Array.from(ip.domains),
      orgs: Array.from(ip.orgs),
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)

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
    },
  })
}
