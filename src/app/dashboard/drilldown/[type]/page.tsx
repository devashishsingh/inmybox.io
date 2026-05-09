'use client'

import { Fragment, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Server,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  BarChart3,
} from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

interface Enrichment {
  asn: string | null
  asnOrg: string | null
  country: string | null
  provider: string | null
  providerType: string | null
  reverseDns: string | null
  isKnownSender: boolean
}

interface DrilldownRecord {
  id: string
  sourceIp: string
  count: number
  disposition: string
  // alignment
  spfResult: string
  dkimResult: string
  // authentication (resolved — heuristic for legacy nulls)
  spfAuthResult: string
  dkimAuthResult: string
  spfAuthInferred: boolean
  dkimAuthInferred: boolean
  spfAuthResultRaw: string | null
  dkimAuthResultRaw: string | null
  dmarcResult: string
  headerFrom: string | null
  envelopeFrom: string | null
  spfDomain: string | null
  dkimDomain: string | null
  reportOrg: string
  reportDomain: string
  reportDate: string
  reportEnd: string
  policy: string | null
  enrichment: Enrichment | null
}

type FailureReason = 'fully_aligned' | 'misaligned' | 'auth_failed' | 'mixed'

interface IpAgg {
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
  domains: string[]
  headerFroms: string[]
  spfDomains: string[]
  dkimDomains: string[]
  orgs: string[]
  lastSeen: string
  enrichment: Enrichment | null
  failureReason: FailureReason
}

interface Summary {
  totalRecords: number
  totalVolume: number
  passVolume: number
  failVolume: number
  passRate: number
  failRate: number
  fullyAlignedVolume: number
  misalignedVolume: number
  authFailedVolume: number
  totalSenders: number
  fullyAlignedSenders: number
  misalignedSenders: number
  authFailedSenders: number
  topMisaligned: {
    ip: string
    volume: number
    providerName: string | null
    spfDomains: string[]
    dkimDomains: string[]
    headerFroms: string[]
  } | null
}

// Common ESP SPF includes for fix recommendations. Keyed by lowercase token
// matched against IpEnrichment.provider or asnOrg.
const ESP_FIX_HINTS: Record<string, { spfInclude: string; docsLabel: string }> = {
  sendgrid:   { spfInclude: 'include:sendgrid.net',                docsLabel: 'SendGrid sender authentication' },
  mailchimp:  { spfInclude: 'include:servers.mcsv.net',            docsLabel: 'Mailchimp domain authentication' },
  amazonses:  { spfInclude: 'include:amazonses.com',               docsLabel: 'Amazon SES verified identity' },
  amazon:     { spfInclude: 'include:amazonses.com',               docsLabel: 'Amazon SES verified identity' },
  google:     { spfInclude: 'include:_spf.google.com',             docsLabel: 'Google Workspace DKIM' },
  microsoft:  { spfInclude: 'include:spf.protection.outlook.com',  docsLabel: 'Microsoft 365 custom DKIM' },
  mailgun:    { spfInclude: 'include:mailgun.org',                 docsLabel: 'Mailgun domain verification' },
  postmark:   { spfInclude: 'include:spf.mtasv.net',               docsLabel: 'Postmark sender signatures' },
  zendesk:    { spfInclude: 'include:mail.zendesk.com',            docsLabel: 'Zendesk DKIM signing' },
  hubspot:    { spfInclude: 'include:_spf.hubspot.com',            docsLabel: 'HubSpot connected email' },
  klaviyo:    { spfInclude: 'include:_spf.klaviyo.com',            docsLabel: 'Klaviyo dedicated sending domain' },
}

function identifyEsp(
  enrichment: Enrichment | null
): { key: string; name: string; hint: typeof ESP_FIX_HINTS[string] } | null {
  if (!enrichment) return null
  const haystack = `${enrichment.provider || ''} ${enrichment.asnOrg || ''}`.toLowerCase()
  for (const [key, hint] of Object.entries(ESP_FIX_HINTS)) {
    if (haystack.includes(key)) {
      return { key, name: enrichment.provider || enrichment.asnOrg || key, hint }
    }
  }
  return null
}

const REASON_STYLES: Record<FailureReason, { bg: string; text: string; border: string; label: string; Icon: any }> = {
  fully_aligned: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Fully Aligned', Icon: CheckCircle2 },
  misaligned:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Misaligned',    Icon: AlertTriangle },
  auth_failed:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Auth Failed',   Icon: XCircle },
  mixed:         { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-200',   label: 'Mixed Results', Icon: AlertTriangle },
}

function ReasonBadge({ reason }: { reason: FailureReason }) {
  const s = REASON_STYLES[reason]
  const Icon = s.Icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function AuthCell({
  result,
  domain,
  inferred,
}: {
  result: string
  domain?: string | null
  inferred?: boolean
}) {
  const pass = result === 'pass'
  return (
    <div className="flex items-center gap-1.5">
      {pass ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      )}
      <span className={`text-xs font-medium ${pass ? 'text-emerald-700' : 'text-red-700'}`}>
        {pass ? 'Pass' : 'Fail'}
      </span>
      {domain && (
        <span className="text-xs text-slate-400 font-mono truncate max-w-[140px]" title={domain}>
          ({domain})
        </span>
      )}
      {inferred && (
        <span
          className="text-[10px] text-slate-400 cursor-help"
          title="Inferred from legacy data — re-fetch reports to capture exact authentication results"
        >
          ℹ
        </span>
      )}
    </div>
  )
}

function buildRecommendation(ip: IpAgg): { title: string; body: React.ReactNode } | null {
  if (ip.failureReason === 'fully_aligned' && ip.misalignedVolume === 0 && ip.authFailedVolume === 0) {
    return {
      title: 'Fully authenticated and aligned',
      body: <>No action needed for this sender.</>,
    }
  }

  const headerFrom = ip.headerFroms[0] || ip.domains[0] || 'your domain'
  const authedDomain = ip.spfDomains[0] || ip.dkimDomains[0] || null
  const esp = identifyEsp(ip.enrichment)
  const orgName = ip.enrichment?.provider || ip.enrichment?.asnOrg || null

  if (ip.misalignedVolume >= ip.authFailedVolume && ip.misalignedVolume > 0) {
    return {
      title: 'Authenticates correctly but does not align with your domain',
      body: (
        <>
          <p>
            SPF and/or DKIM pass for{' '}
            <span className="font-mono text-slate-700">{authedDomain || 'a third-party domain'}</span>{' '}
            but your <span className="font-mono">From:</span> address uses{' '}
            <span className="font-mono text-slate-700">{headerFrom}</span>. These domains must match
            (or be organisationally aligned) for DMARC to pass.
          </p>
          {esp ? (
            <p className="mt-2">
              This sender is <span className="font-medium">{esp.name}</span>. Configure them to send
              using your domain identity:
            </p>
          ) : orgName ? (
            <p className="mt-2">
              This sender appears to be <span className="font-medium">{orgName}</span>. Configure
              them to send using your domain identity:
            </p>
          ) : (
            <p className="mt-2">Configure this sending platform to send using your domain identity:</p>
          )}
          <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-600">
            <li>Add a custom sending domain pointing to <span className="font-mono">{headerFrom}</span></li>
            <li>Enable DKIM signing with <span className="font-mono">{headerFrom}</span> as the d= domain</li>
            <li>Set the envelope-from (Return-Path) to a subdomain of <span className="font-mono">{headerFrom}</span></li>
            {esp && (
              <li>See <span className="font-medium">{esp.hint.docsLabel}</span> for platform-specific steps</li>
            )}
          </ol>
        </>
      ),
    }
  }

  if (esp) {
    return {
      title: `${esp.name} is not authorised on your DNS`,
      body: (
        <>
          <p>
            This IP belongs to <span className="font-medium">{esp.name}</span> but is sending as{' '}
            <span className="font-mono text-slate-700">{headerFrom}</span> without passing
            authentication. Add the following to your domain&apos;s SPF record:
          </p>
          <pre className="mt-2 px-3 py-2 bg-slate-900 text-emerald-300 text-xs rounded-lg overflow-x-auto">
            {esp.hint.spfInclude}
          </pre>
          <p className="mt-2">
            Then enable DKIM signing in your {esp.name} account using{' '}
            <span className="font-mono">{headerFrom}</span> as the signing domain.
          </p>
        </>
      ),
    }
  }

  return {
    title: 'Unauthenticated sender',
    body: (
      <>
        <p>
          IP <span className="font-mono text-slate-700">{ip.ip}</span>
          {orgName && <> ({orgName})</>} is sending as{' '}
          <span className="font-mono text-slate-700">{headerFrom}</span> but is not authenticated.
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>If you recognise this sender, add it to your SPF record and enable DKIM.</li>
          <li>
            If you do not recognise it, this may be an unauthorised sender — consider moving DMARC
            to <span className="font-mono">p=quarantine</span> or{' '}
            <span className="font-mono">p=reject</span>.
          </li>
        </ul>
      </>
    ),
  }
}

function AlignmentSummaryBanner({ summary }: { summary: Summary }) {
  if (!summary || summary.totalSenders === 0) return null
  const { fullyAlignedSenders, misalignedSenders, authFailedSenders, totalSenders, topMisaligned } = summary
  return (
    <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200 p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">Fully Aligned</div>
          <div className="text-2xl font-bold text-emerald-600">
            {fullyAlignedSenders}
            <span className="text-sm text-slate-400 font-normal"> / {totalSenders}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{formatNumber(summary.fullyAlignedVolume)} emails</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Alignment Issues</div>
          <div className="text-2xl font-bold text-amber-600">{misalignedSenders}</div>
          <div className="text-xs text-slate-500 mt-0.5">{formatNumber(summary.misalignedVolume)} emails misaligned</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Authentication Failures</div>
          <div className="text-2xl font-bold text-red-600">{authFailedSenders}</div>
          <div className="text-xs text-slate-500 mt-0.5">{formatNumber(summary.authFailedVolume)} emails failed auth</div>
        </div>
      </div>
      {topMisaligned && topMisaligned.volume > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <span className="font-medium">Top priority:</span> Fix alignment for{' '}
            <span className="font-mono text-slate-900">{topMisaligned.ip}</span>
            {topMisaligned.providerName && (
              <span className="text-slate-500"> ({topMisaligned.providerName})</span>
            )}
            {' '}— affecting <span className="font-semibold">{formatNumber(topMisaligned.volume)}</span> emails.
          </div>
        </div>
      )}
    </div>
  )
}

const TYPE_CONFIG: Record<string, { label: string; description: string; icon: any; passLabel: string; failLabel: string }> = {
  spf: {
    label: 'SPF Authentication',
    description: 'Sender Policy Framework — verifies the sending IP is authorized for the domain',
    icon: Shield,
    passLabel: 'SPF Pass',
    failLabel: 'SPF Fail',
  },
  dkim: {
    label: 'DKIM Signatures',
    description: 'DomainKeys Identified Mail — verifies email content integrity via cryptographic signatures',
    icon: ShieldCheck,
    passLabel: 'DKIM Pass',
    failLabel: 'DKIM Fail',
  },
  dmarc: {
    label: 'DMARC Alignment',
    description: 'Domain-based Message Authentication — combines SPF and DKIM alignment with policy enforcement',
    icon: ShieldAlert,
    passLabel: 'DMARC Pass',
    failLabel: 'DMARC Fail',
  },
  disposition: {
    label: 'Message Disposition',
    description: 'How receiving mail servers handled messages based on DMARC policy',
    icon: Mail,
    passLabel: 'Delivered (none)',
    failLabel: 'Quarantined / Rejected',
  },
  ip: {
    label: 'Source IP Analysis',
    description: 'Complete authentication breakdown per sending IP address',
    icon: Server,
    passLabel: 'All Pass',
    failLabel: 'Has Failures',
  },
}

export default function DrilldownPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string

  const [records, setRecords] = useState<DrilldownRecord[]>([])
  const [ipAggregation, setIpAggregation] = useState<IpAgg[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedIp, setExpandedIp] = useState<string | null>(null)
  const [ipRecords, setIpRecords] = useState<DrilldownRecord[]>([])
  const [ipRecordsLoading, setIpRecordsLoading] = useState(false)
  const [sortField, setSortField] = useState<string>('count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const config = TYPE_CONFIG[type]

  useEffect(() => {
    if (!type || !config) return
    setLoading(true)
    const filterParam = activeFilter !== 'all' ? `&filter=${activeFilter}` : ''
    fetch(`/api/analytics/drilldown?type=${type}${filterParam}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records || [])
        setIpAggregation(d.ipAggregation || [])
        setSummary(d.summary || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [type, activeFilter])

  const loadIpRecords = (ip: string) => {
    if (expandedIp === ip) {
      setExpandedIp(null)
      return
    }
    setExpandedIp(ip)
    setIpRecordsLoading(true)
    fetch(`/api/analytics/drilldown?type=ip&filter=${encodeURIComponent(ip)}`)
      .then((r) => r.json())
      .then((d) => setIpRecords(d.records || []))
      .catch(console.error)
      .finally(() => setIpRecordsLoading(false))
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldX className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unknown drill-down type</h2>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">Back to Dashboard</Link>
      </div>
    )
  }

  // Filter IPs by search
  const filteredIps = ipAggregation.filter(
    (ip) =>
      ip.ip.includes(search) ||
      ip.domains.some((d) => d.toLowerCase().includes(search.toLowerCase())) ||
      ip.orgs.some((o) => o.toLowerCase().includes(search.toLowerCase()))
  )

  // Sort IPs
  const sortedIps = [...filteredIps].sort((a, b) => {
    let aVal: number, bVal: number
    switch (sortField) {
      case 'spfFail': aVal = a.spfFail; bVal = b.spfFail; break
      case 'dkimFail': aVal = a.dkimFail; bVal = b.dkimFail; break
      case 'dmarcFail': aVal = a.dmarcFail; bVal = b.dmarcFail; break
      case 'rejected': aVal = a.dispositionQuarantine + a.dispositionReject; bVal = b.dispositionQuarantine + b.dispositionReject; break
      default: aVal = a.totalVolume; bVal = b.totalVolume
    }
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  // Filter records by search
  const filteredRecords = records.filter(
    (r) =>
      r.sourceIp.includes(search) ||
      r.reportOrg?.toLowerCase().includes(search.toLowerCase()) ||
      r.reportDomain?.toLowerCase().includes(search.toLowerCase()) ||
      r.headerFrom?.toLowerCase().includes(search.toLowerCase()) ||
      r.envelopeFrom?.toLowerCase().includes(search.toLowerCase())
  )

  const StatusBadge = ({ value, type: badgeType }: { value: string; type?: string }) => {
    const isPass = value === 'pass' || value === 'none'
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isPass
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : value === 'quarantine'
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {value}
      </span>
    )
  }

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => {
        if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
        else { setSortField(field); setSortDir('desc') }
      }}
      className="flex items-center gap-1 hover:text-slate-700 transition-colors"
    >
      {children}
      {sortField === field && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard" className="mt-1 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <config.icon className="w-6 h-6 text-brand-600" />
              {config.label}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(summary.totalVolume)}</div>
            <div className="text-xs text-slate-400 mt-1">{summary.totalRecords} records</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 mb-1">Pass Rate</div>
            <div className={`text-2xl font-bold ${summary.passRate > 0.9 ? 'text-emerald-600' : summary.passRate > 0.7 ? 'text-amber-600' : 'text-red-600'}`}>
              {formatPercent(summary.passRate)}
            </div>
            <div className="text-xs text-slate-400 mt-1">{formatNumber(summary.passVolume)} emails</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 mb-1">{config.passLabel}</div>
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(summary.passVolume)}</div>
            <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> passing
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500 mb-1">{config.failLabel}</div>
            <div className="text-2xl font-bold text-red-600">{formatNumber(summary.failVolume)}</div>
            <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> failing
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, domain, organization..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          {type !== 'ip' && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: type === 'disposition' ? 'none' : 'pass', label: type === 'disposition' ? 'Delivered' : 'Pass' },
                { key: type === 'disposition' ? 'quarantine' : 'fail', label: type === 'disposition' ? 'Quarantine' : 'Fail' },
                ...(type === 'disposition' ? [{ key: 'reject', label: 'Reject' }] : []),
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeFilter === f.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : type === 'ip' ? (
        /* ═══════ IP AGGREGATION VIEW ═══════ */
        <>
          {summary && <AlignmentSummaryBanner summary={summary} />}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">Source IP</th>
                  <th className="px-6 py-3"><SortHeader field="count">Volume</SortHeader></th>
                  <th className="px-6 py-3">Authentication</th>
                  <th className="px-6 py-3">Alignment</th>
                  <th className="px-6 py-3">DMARC Result</th>
                  <th className="px-6 py-3"><SortHeader field="rejected">Disposition</SortHeader></th>
                  <th className="px-6 py-3">Reporter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedIps.map((ip) => {
                  const isExpanded = expandedIp === ip.ip
                  const orgName = ip.enrichment?.provider || ip.enrichment?.asnOrg
                  const spfAuthPass = ip.spfAuthPass > ip.spfAuthFail
                  const dkimAuthPass = ip.dkimAuthPass > ip.dkimAuthFail
                  const spfAlignPass = ip.spfPass > ip.spfFail
                  const dkimAlignPass = ip.dkimPass > ip.dkimFail
                  const spfAuthDomain = ip.spfDomains[0] || null
                  const dkimAuthDomain = ip.dkimDomains[0] || null
                  const inferred = ip.inferredVolume > 0
                  const dmarcPassDominant = ip.dmarcPass >= ip.dmarcFail
                  const rec = buildRecommendation(ip)
                  return (
                    <Fragment key={ip.ip}>
                      <tr
                        onClick={() => loadIpRecords(ip.ip)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-brand-50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <ReasonBadge reason={ip.failureReason} />
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="font-mono text-slate-700">{ip.ip}</span>
                          </div>
                          {orgName && (
                            <div className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5">{orgName}</div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-700 align-top">{formatNumber(ip.totalVolume)}</td>
                        <td className="px-6 py-3.5 align-top space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 w-10">SPF</span>
                            <AuthCell result={spfAuthPass ? 'pass' : 'fail'} domain={spfAuthDomain} inferred={inferred} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 w-10">DKIM</span>
                            <AuthCell result={dkimAuthPass ? 'pass' : 'fail'} domain={dkimAuthDomain} inferred={inferred} />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 align-top space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 w-10">SPF</span>
                            <AuthCell result={spfAlignPass ? 'pass' : 'fail'} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 w-10">DKIM</span>
                            <AuthCell result={dkimAlignPass ? 'pass' : 'fail'} />
                          </div>
                        </td>
                        <td className="px-6 py-3.5 align-top">
                          <StatusBadge value={dmarcPassDominant ? 'pass' : 'fail'} />
                        </td>
                        <td className="px-6 py-3.5 align-top">
                          <div className="flex items-center gap-1.5 text-xs flex-wrap">
                            {ip.dispositionNone > 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                                {formatNumber(ip.dispositionNone)} ok
                              </span>
                            )}
                            {ip.dispositionQuarantine > 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                                {formatNumber(ip.dispositionQuarantine)} quar
                              </span>
                            )}
                            {ip.dispositionReject > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-medium">
                                {formatNumber(ip.dispositionReject)} rej
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-500 align-top">{ip.orgs.join(', ')}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${ip.ip}-detail`}>
                          <td colSpan={7} className="p-0">
                            <div className="bg-slate-50 border-y border-slate-200 p-4 space-y-4">
                              {rec && (
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ReasonBadge reason={ip.failureReason} />
                                    <h4 className="text-sm font-semibold text-slate-800">{rec.title}</h4>
                                  </div>
                                  <div className="text-xs text-slate-600 leading-relaxed">{rec.body}</div>
                                </div>
                              )}
                              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Server className="w-4 h-4 text-brand-500" />
                                All records from {ip.ip}
                              </h4>
                              {ipRecordsLoading ? (
                                <div className="h-20 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        <th className="px-4 py-2">Count</th>
                                        <th className="px-4 py-2">SPF Auth</th>
                                        <th className="px-4 py-2">DKIM Auth</th>
                                        <th className="px-4 py-2">SPF Align</th>
                                        <th className="px-4 py-2">DKIM Align</th>
                                        <th className="px-4 py-2">DMARC</th>
                                        <th className="px-4 py-2">Disposition</th>
                                        <th className="px-4 py-2">From</th>
                                        <th className="px-4 py-2">Reporter</th>
                                        <th className="px-4 py-2">Date</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {ipRecords.map((r) => (
                                        <tr key={r.id} className="hover:bg-white transition-colors">
                                          <td className="px-4 py-2 font-medium text-slate-700">{formatNumber(r.count)}</td>
                                          <td className="px-4 py-2"><AuthCell result={r.spfAuthResult} domain={r.spfDomain} inferred={r.spfAuthInferred} /></td>
                                          <td className="px-4 py-2"><AuthCell result={r.dkimAuthResult} domain={r.dkimDomain} inferred={r.dkimAuthInferred} /></td>
                                          <td className="px-4 py-2"><AuthCell result={r.spfResult} /></td>
                                          <td className="px-4 py-2"><AuthCell result={r.dkimResult} /></td>
                                          <td className="px-4 py-2"><StatusBadge value={r.dmarcResult} /></td>
                                          <td className="px-4 py-2"><StatusBadge value={r.disposition} /></td>
                                          <td className="px-4 py-2 text-slate-500">{r.headerFrom || r.envelopeFrom || '—'}</td>
                                          <td className="px-4 py-2 text-slate-500">{r.reportOrg}</td>
                                          <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                                            {new Date(r.reportDate).toLocaleDateString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          {sortedIps.length === 0 && (
            <div className="p-16 text-center">
              <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No source IPs found</p>
            </div>
          )}
          </div>
        </>
      ) : (
        /* ═══════ RECORD-LEVEL VIEW (SPF/DKIM/DMARC/Disposition) ═══════ */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">Source IP</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">SPF Auth</th>
                  <th className="px-6 py-3">DKIM Auth</th>
                  <th className="px-6 py-3">SPF Align</th>
                  <th className="px-6 py-3">DKIM Align</th>
                  <th className="px-6 py-3">DMARC</th>
                  <th className="px-6 py-3">Disposition</th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">Reporter</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/dashboard/drilldown/ip?search=${rec.sourceIp}`}
                        className="font-mono text-brand-600 hover:underline"
                      >
                        {rec.sourceIp}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">{formatNumber(rec.count)}</td>
                    <td className="px-6 py-3.5"><AuthCell result={rec.spfAuthResult} domain={rec.spfDomain} inferred={rec.spfAuthInferred} /></td>
                    <td className="px-6 py-3.5"><AuthCell result={rec.dkimAuthResult} domain={rec.dkimDomain} inferred={rec.dkimAuthInferred} /></td>
                    <td className="px-6 py-3.5"><AuthCell result={rec.spfResult} /></td>
                    <td className="px-6 py-3.5"><AuthCell result={rec.dkimResult} /></td>
                    <td className="px-6 py-3.5"><StatusBadge value={rec.dmarcResult} /></td>
                    <td className="px-6 py-3.5"><StatusBadge value={rec.disposition} /></td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{rec.headerFrom || rec.envelopeFrom || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{rec.reportOrg}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(rec.reportDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      {rec.policy && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.policy === 'reject' ? 'bg-emerald-50 text-emerald-700' :
                          rec.policy === 'quarantine' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          p={rec.policy}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRecords.length === 0 && (
            <div className="p-16 text-center">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No records match the current filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniBar({ pass, fail }: { pass: number; fail: number }) {
  const total = pass + fail
  if (total === 0) return <div className="w-16 h-2 rounded-full bg-slate-200" />
  const passPercent = (pass / total) * 100
  return (
    <div className="w-16 h-2 rounded-full bg-red-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${passPercent}%` }}
      />
    </div>
  )
}
