'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Edit3,
  Tag,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
} from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

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
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingSender, setEditingSender] = useState<Sender | null>(null)
  const [editForm, setEditForm] = useState({ label: '', status: '', notes: '' })

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
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Label</th>
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
                  return (
                    <tr key={sender.id} className="table-row-hover">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          {statusIcon(sender.status)}
                          <span className="font-mono text-slate-700">{sender.ip}</span>
                        </div>
                        {sender.hostname && (
                          <div className="text-xs text-slate-400 ml-6">{sender.hostname}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-slate-700">{sender.label || '—'}</span>
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
                        <button
                          onClick={() => startEdit(sender)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Edit sender"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
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
    </div>
  )
}
