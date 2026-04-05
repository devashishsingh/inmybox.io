'use client'

import { useEffect, useState } from 'react'
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

interface DrilldownRecord {
  id: string
  sourceIp: string
  count: number
  disposition: string
  spfResult: string
  dkimResult: string
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
}

interface IpAgg {
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
  domains: string[]
  orgs: string[]
  lastSeen: string
}

interface Summary {
  totalRecords: number
  totalVolume: number
  passVolume: number
  failVolume: number
  passRate: number
  failRate: number
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">Source IP</th>
                  <th className="px-6 py-3"><SortHeader field="count">Volume</SortHeader></th>
                  <th className="px-6 py-3"><SortHeader field="spfFail">SPF</SortHeader></th>
                  <th className="px-6 py-3"><SortHeader field="dkimFail">DKIM</SortHeader></th>
                  <th className="px-6 py-3"><SortHeader field="dmarcFail">DMARC</SortHeader></th>
                  <th className="px-6 py-3"><SortHeader field="rejected">Disposition</SortHeader></th>
                  <th className="px-6 py-3">Domains</th>
                  <th className="px-6 py-3">Reporter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedIps.map((ip) => {
                  const hasFailures = ip.spfFail > 0 || ip.dkimFail > 0 || ip.dmarcFail > 0
                  const isExpanded = expandedIp === ip.ip
                  return (
                    <>
                      <tr
                        key={ip.ip}
                        onClick={() => loadIpRecords(ip.ip)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-brand-50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {hasFailures ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            <span className="font-mono text-slate-700">{ip.ip}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-700">{formatNumber(ip.totalVolume)}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <MiniBar pass={ip.spfPass} fail={ip.spfFail} />
                            <span className="text-xs text-slate-500">
                              {formatPercent(ip.totalVolume > 0 ? ip.spfPass / ip.totalVolume : 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <MiniBar pass={ip.dkimPass} fail={ip.dkimFail} />
                            <span className="text-xs text-slate-500">
                              {formatPercent(ip.totalVolume > 0 ? ip.dkimPass / ip.totalVolume : 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <MiniBar pass={ip.dmarcPass} fail={ip.dmarcFail} />
                            <span className="text-xs text-slate-500">
                              {formatPercent(ip.totalVolume > 0 ? ip.dmarcPass / ip.totalVolume : 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs">
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
                        <td className="px-6 py-3.5 text-xs text-slate-500">{ip.domains.join(', ')}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">{ip.orgs.join(', ')}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${ip.ip}-detail`}>
                          <td colSpan={8} className="p-0">
                            <div className="bg-slate-50 border-y border-slate-200 p-4">
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
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
                                        <th className="px-4 py-2">SPF</th>
                                        <th className="px-4 py-2">DKIM</th>
                                        <th className="px-4 py-2">DMARC</th>
                                        <th className="px-4 py-2">Disposition</th>
                                        <th className="px-4 py-2">From</th>
                                        <th className="px-4 py-2">SPF Domain</th>
                                        <th className="px-4 py-2">DKIM Domain</th>
                                        <th className="px-4 py-2">Reporter</th>
                                        <th className="px-4 py-2">Date</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {ipRecords.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-white transition-colors">
                                          <td className="px-4 py-2 font-medium text-slate-700">{formatNumber(rec.count)}</td>
                                          <td className="px-4 py-2"><StatusBadge value={rec.spfResult} /></td>
                                          <td className="px-4 py-2"><StatusBadge value={rec.dkimResult} /></td>
                                          <td className="px-4 py-2"><StatusBadge value={rec.dmarcResult} /></td>
                                          <td className="px-4 py-2"><StatusBadge value={rec.disposition} /></td>
                                          <td className="px-4 py-2 text-slate-500">{rec.headerFrom || rec.envelopeFrom || '—'}</td>
                                          <td className="px-4 py-2 text-slate-500 font-mono">{rec.spfDomain || '—'}</td>
                                          <td className="px-4 py-2 text-slate-500 font-mono">{rec.dkimDomain || '—'}</td>
                                          <td className="px-4 py-2 text-slate-500">{rec.reportOrg}</td>
                                          <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                                            {new Date(rec.reportDate).toLocaleDateString()}
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
                    </>
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
      ) : (
        /* ═══════ RECORD-LEVEL VIEW (SPF/DKIM/DMARC/Disposition) ═══════ */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">Source IP</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">SPF</th>
                  <th className="px-6 py-3">DKIM</th>
                  <th className="px-6 py-3">DMARC</th>
                  <th className="px-6 py-3">Disposition</th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">Domain</th>
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
                    <td className="px-6 py-3.5"><StatusBadge value={rec.spfResult} /></td>
                    <td className="px-6 py-3.5"><StatusBadge value={rec.dkimResult} /></td>
                    <td className="px-6 py-3.5"><StatusBadge value={rec.dmarcResult} /></td>
                    <td className="px-6 py-3.5"><StatusBadge value={rec.disposition} /></td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{rec.headerFrom || rec.envelopeFrom || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-500 text-xs">{rec.reportDomain}</td>
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
