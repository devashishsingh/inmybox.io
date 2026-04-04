'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react'

export default function AdminIngestionPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 20

  const fetchLogs = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/ingestion?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || [])
        setSummary(d.summary || null)
        setTotal(d.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [page, statusFilter])

  const reprocess = async (logId: string) => {
    await fetch('/api/admin/ingestion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId }),
    })
    fetchLogs()
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      case 'processing': return <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
      default: return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingestion Monitoring</h1>
          <p className="text-sm text-slate-400 mt-0.5">DMARC report processing pipeline</p>
        </div>
        <button onClick={fetchLogs} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Processed', value: summary.total || 0, color: 'text-white' },
            { label: 'Completed', value: summary.completed || 0, color: 'text-emerald-400' },
            { label: 'Failed', value: summary.failed || 0, color: 'text-red-400' },
            { label: 'Processing', value: summary.processing || 0, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'processing', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">File</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Records</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td colSpan={6} className="px-4 py-4"><div className="h-5 bg-slate-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No ingestion logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">{statusIcon(log.status)} <span className="text-xs text-slate-300 capitalize">{log.status}</span></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-white text-xs font-mono">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {log.filename?.slice(0, 40) || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{log.tenant?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.recordsProcessed || 0}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {log.status === 'failed' && (
                      <button
                        onClick={() => reprocess(log.id)}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Reprocess
                      </button>
                    )}
                    {log.error && (
                      <span title={log.error} className="ml-2 text-red-500 cursor-help"><AlertTriangle className="w-3 h-3 inline" /></span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white disabled:opacity-50">
            Previous
          </button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
