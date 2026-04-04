'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
  Eye,
  XCircle,
  Filter,
} from 'lucide-react'

interface ActionItem {
  id: string
  type: string
  severity: string
  title: string
  description: string
  recommendation: string
  sourceIp: string | null
  status: string
  createdAt: string
}

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: ShieldAlert },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Shield },
  info: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Eye },
}

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [severityFilter, setSeverityFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchItems = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (severityFilter) params.set('severity', severityFilter)

    fetch(`/api/action-items?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.actionItems || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [statusFilter, severityFilter])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      await fetch('/api/action-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      fetchItems()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(null)
    }
  }

  const openCount = items.filter((i) => i.status === 'open').length
  const criticalCount = items.filter((i) => i.severity === 'critical' || i.severity === 'high').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Actions Required</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {statusFilter === 'open'
              ? `${items.length} open action${items.length !== 1 ? 's' : ''}`
              : `${items.length} action item${items.length !== 1 ? 's' : ''}`}
            {criticalCount > 0 && statusFilter === 'open' && (
              <span className="text-red-600 font-medium"> &middot; {criticalCount} high priority</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {['open', 'acknowledged', 'resolved', 'dismissed', ''].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {['', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {s || 'All Severity'}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">All clear!</h3>
          <p className="text-sm text-slate-500 mt-1">
            {statusFilter === 'open'
              ? 'No open action items. Your email authentication looks healthy.'
              : 'No action items match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const config = severityConfig[item.severity] || severityConfig.info
            const Icon = config.icon
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border ${item.status === 'open' ? config.border : 'border-slate-200'} p-5 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'open' ? config.bg : 'bg-slate-100'}`}>
                    <Icon className={`w-5 h-5 ${item.status === 'open' ? config.color : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-semibold ${item.status === 'resolved' || item.status === 'dismissed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                            {item.severity}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">{item.type.replace(/_/g, ' ')}</span>
                          {item.sourceIp && (
                            <span className="text-xs text-slate-400 font-mono">{item.sourceIp}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                    {item.recommendation && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Recommendation</p>
                        <p className="text-sm text-slate-700">{item.recommendation}</p>
                      </div>
                    )}
                    {/* Actions */}
                    {item.status === 'open' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateStatus(item.id, 'acknowledged')}
                          disabled={updating === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'resolved')}
                          disabled={updating === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'dismissed')}
                          disabled={updating === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {item.status === 'acknowledged' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateStatus(item.id, 'resolved')}
                          disabled={updating === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'open')}
                          disabled={updating === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
