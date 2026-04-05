'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  HelpCircle,
  X,
  Globe,
  Server,
} from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

interface Enrichment {
  asn: string | null
  asnOrg: string | null
  country: string | null
  city: string | null
  provider: string | null
  providerType: string | null
  reverseDns: string | null
  isKnownSender: boolean
}

interface Sender {
  id: string
  ip: string
  hostname: string | null
  label: string | null
  status: string
  notes: string | null
  tags: string | null
  totalVolume: number
  failCount: number
  lastSeen: string | null
  enrichment: Enrichment | null
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingSender, setEditingSender] = useState<Sender | null>(null)
  const [editForm, setEditForm] = useState({ label: '', status: '', notes: '' })
  const [whoisSender, setWhoisSender] = useState<Sender | null>(null)
  const [whoisData, setWhoisData] = useState<Enrichment | null>(null)
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const openWhois = async (sender: Sender) => {
    setWhoisSender(sender)
    setWhoisData(sender.enrichment) // show cached immediately
    setWhoisLoading(true)
    try {
      const res = await fetch('/api/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: sender.ip }),
      })
      if (res.ok) {
        const { enrichment } = await res.json()
        setWhoisData(enrichment)
      }
    } catch (err) {
      console.error('WHOIS lookup failed:', err)
    } finally {
      setWhoisLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/senders')
      .then((r) => r.json())
      .then((d) => setSenders(d.senders || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = senders.filter((s) => {
    const matchesSearch =
      s.ip.includes(search) ||
      s.label?.toLowerCase().includes(search.toLowerCase()) ||
      s.hostname?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || s.status === filter
    return matchesSearch && matchesFilter
  })

  const startEdit = (sender: Sender) => {
    setEditingSender(sender)
    setEditForm({
      label: sender.label || '',
      status: sender.status,
      notes: sender.notes || '',
    })
  }

  const saveEdit = async () => {
    if (!editingSender) return
    try {
      const res = await fetch(`/api/senders?id=${editingSender.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setSenders((prev) =>
          prev.map((s) =>
            s.id === editingSender.id
              ? { ...s, label: editForm.label, status: editForm.status, notes: editForm.notes }
              : s
          )
        )
        setEditingSender(null)
      }
    } catch (e) {
      console.error('Failed to update sender', e)
    }
  }

  const toggleTrust = async (sender: Sender) => {
    const newStatus = sender.status === 'trusted' ? 'unknown' : 'trusted'
    setTogglingId(sender.id)
    try {
      const res = await fetch(`/api/senders?id=${sender.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setSenders((prev) =>
          prev.map((s) => (s.id === sender.id ? { ...s, status: newStatus } : s))
        )
      }
    } catch (e) {
      console.error('Failed to toggle trust', e)
    } finally {
      setTogglingId(null)
    }
  }

  const markSuspicious = async (sender: Sender) => {
    const newStatus = sender.status === 'suspicious' ? 'unknown' : 'suspicious'
    setTogglingId(sender.id)
    try {
      const res = await fetch(`/api/senders?id=${sender.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setSenders((prev) =>
          prev.map((s) => (s.id === sender.id ? { ...s, status: newStatus } : s))
        )
      }
    } catch (e) {
      console.error('Failed to mark suspicious', e)
    } finally {
      setTogglingId(null)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'trusted': return <ShieldCheck className="w-4 h-4 text-emerald-500" />
      case 'known': return <Shield className="w-4 h-4 text-brand-500" />
      case 'suspicious': return <ShieldAlert className="w-4 h-4 text-red-500" />
      default: return <HelpCircle className="w-4 h-4 text-amber-500" />
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      trusted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      known: 'bg-brand-50 text-brand-700 border-brand-200',
      suspicious: 'bg-red-50 text-red-700 border-red-200',
      unknown: 'bg-amber-50 text-amber-700 border-amber-200',
    }
    return styles[status] || styles.unknown
  }

  const counts = {
    all: senders.length,
    known: senders.filter((s) => s.status === 'known').length,
    trusted: senders.filter((s) => s.status === 'trusted').length,
    unknown: senders.filter((s) => s.status === 'unknown').length,
    suspicious: senders.filter((s) => s.status === 'suspicious').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sender Intelligence</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage and classify every IP sending under your domain
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Known', count: counts.known, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Trusted', count: counts.trusted, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unknown', count: counts.unknown, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Suspicious', count: counts.suspicious, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, label, or hostname..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'known', 'trusted', 'unknown', 'suspicious'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f} ({(counts as any)[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No senders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">Fail Rate</th>
                  <th className="px-6 py-3">Last Seen</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((sender) => {
                  const failRate = sender.totalVolume > 0 ? sender.failCount / sender.totalVolume : 0
                  const e = sender.enrichment
                  return (
                    <tr key={sender.id} className="table-row-hover">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          {statusIcon(sender.status)}
                          <span className="font-mono text-slate-700">{sender.ip}</span>
                          <button
                            onClick={() => openWhois(sender)}
                            className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="WHOIS Lookup"
                          >
                            <Server className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {(sender.hostname || e?.reverseDns) && (
                          <div className="text-xs text-slate-400 ml-6 truncate max-w-[200px]">{sender.hostname || e?.reverseDns}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-slate-700 text-xs font-medium">
                          {e?.asnOrg || e?.provider || sender.label || '—'}
                        </div>
                        {e?.country && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" />
                            {e.city ? `${e.city}, ${e.country}` : e.country}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(sender.status)}`}>
                          {sender.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {formatNumber(sender.totalVolume)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`font-medium ${failRate > 0.3 ? 'text-red-600' : failRate > 0.1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatPercent(failRate)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs">
                        {sender.lastSeen ? new Date(sender.lastSeen).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleTrust(sender)}
                            disabled={togglingId === sender.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              sender.status === 'trusted'
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                            }`}
                            title={sender.status === 'trusted' ? 'Remove trust' : 'Mark as trusted'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => markSuspicious(sender)}
                            disabled={togglingId === sender.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              sender.status === 'suspicious'
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                            }`}
                            title={sender.status === 'suspicious' ? 'Remove suspicious' : 'Mark as suspicious'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEdit(sender)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit sender"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Edit Sender</h3>
              <button
                onClick={() => setEditingSender(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-500 mb-5 font-mono bg-slate-50 px-3 py-2 rounded-lg">
              {editingSender.ip}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Label</label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g., Google Workspace, Mailchimp..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                >
                  <option value="unknown">Unknown</option>
                  <option value="known">Known</option>
                  <option value="trusted">Trusted</option>
                  <option value="suspicious">Suspicious</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Add notes about this sender..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSender(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHOIS Modal */}
      {whoisSender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setWhoisSender(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-brand-600" />
                WHOIS / IP Info
              </h3>
              <button
                onClick={() => setWhoisSender(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 mb-5 font-mono text-sm text-slate-700 dark:text-slate-300">
              {whoisSender.ip}
            </div>

            {(() => {
              const e = whoisData
              if (whoisLoading && !e) {
                return (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Looking up IP information...</p>
                  </div>
                )
              }
              if (!e) {
                return (
                  <div className="text-center py-8">
                    <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No enrichment data available yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Data populates after the first senders page load.</p>
                  </div>
                )
              }
              return (
                <div className="space-y-4">
                  {whoisLoading && (
                    <div className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 dark:bg-brand-950/30 px-3 py-2 rounded-lg">
                      <div className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      Refreshing live data...
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <WhoisField label="Reverse DNS" value={e.reverseDns} mono />
                    <WhoisField label="ASN" value={e.asn ? `${e.asn}` : null} />
                    <WhoisField label="Organization" value={e.asnOrg} />
                    <WhoisField label="Provider" value={e.provider} badge={e.providerType} />
                    <WhoisField label="Country" value={e.country} />
                    <WhoisField label="City" value={e.city} />
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Known Sender:</span>
                      <span className={`text-xs font-semibold ${e.isKnownSender ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {e.isKnownSender ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {whoisSender.notes && (
                      <span className="text-xs text-slate-400 italic truncate max-w-[200px]" title={whoisSender.notes}>
                        {whoisSender.notes}
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setWhoisSender(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WhoisField({ label, value, mono, badge }: { label: string; value: string | null | undefined; mono?: boolean; badge?: string | null }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
      <p className={`text-sm text-slate-700 dark:text-slate-200 mt-0.5 break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
        {badge && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded text-[10px] uppercase">{badge}</span>
        )}
      </p>
    </div>
  )
}
