'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search, Download, Mail, Globe, Shield, ShieldAlert, ShieldX, ShieldCheck,
  ChevronLeft, ChevronRight, Filter, Users, BarChart3,
} from 'lucide-react'

interface Scan {
  id: string
  domain: string
  score: number
  riskLevel: string
  dmarcScore: number
  spfScore: number
  dkimScore: number
  configScore: number
  email: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface Summary {
  totalScans: number
  leadsWithEmail: number
  riskBreakdown: Record<string, number>
}

interface ApiResponse {
  scans: Scan[]
  total: number
  page: number
  totalPages: number
  summary: Summary
}

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ShieldCheck },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ShieldAlert },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: ShieldAlert },
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', icon: ShieldX },
}

export default function AdminLeadsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '30')
    if (search) params.set('search', search)
    if (riskFilter) params.set('risk', riskFilter)
    if (emailFilter) params.set('hasEmail', emailFilter)

    try {
      const res = await fetch(`/api/admin/leads?${params}`)
      if (res.ok) setData(await res.json())
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, riskFilter, emailFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const exportCsv = () => {
    const params = new URLSearchParams()
    params.set('format', 'csv')
    if (search) params.set('search', search)
    if (riskFilter) params.set('risk', riskFilter)
    if (emailFilter) params.set('hasEmail', emailFilter)
    window.open(`/api/admin/leads?${params}`, '_blank')
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Domain Scan Leads</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Every domain scanned from the landing page, with optional email capture.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{summary.totalScans.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Scans</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{summary.leadsWithEmail.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">With Email</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.totalScans > 0 ? Math.round((summary.leadsWithEmail / summary.totalScans) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Capture Rate</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldX className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {(summary.riskBreakdown.critical || 0) + (summary.riskBreakdown.high || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">High/Critical Risk</div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by domain or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </form>
        <div className="flex gap-2">
          <select
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="">All Risk Levels</option>
            <option value="healthy">Healthy</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={emailFilter}
            onChange={e => { setEmailFilter(e.target.value); setPage(1) }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-slate-700"
          >
            <option value="">All Scans</option>
            <option value="true">With Email</option>
            <option value="false">No Email</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Domain</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Score</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Risk</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">DMARC</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">SPF</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">DKIM</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">IP</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading && !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-4 py-3">
                    <div className="h-5 bg-slate-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data?.scans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No scans found matching your filters.
                </td>
              </tr>
            ) : (
              data?.scans.map(scan => {
                const risk = RISK_CONFIG[scan.riskLevel] || RISK_CONFIG.medium
                const RiskIcon = risk.icon
                return (
                  <tr key={scan.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-white font-medium">{scan.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${risk.color}`}>{scan.score}</span>
                      <span className="text-slate-600">/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>
                        <RiskIcon className="w-3 h-3" />
                        {risk.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{scan.dmarcScore}/35</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{scan.spfScore}/30</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{scan.dkimScore}/25</td>
                    <td className="px-4 py-3">
                      {scan.email ? (
                        <a href={`mailto:${scan.email}`} className="text-brand-400 hover:text-brand-300 text-xs font-medium">
                          {scan.email}
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono hidden lg:table-cell">
                      {scan.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(scan.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {((data.page - 1) * 30) + 1}–{Math.min(data.page * 30, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              {data.page} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
