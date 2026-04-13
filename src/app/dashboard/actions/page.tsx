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
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: ShieldAlert },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Shield },
  info: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Eye },
}

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [severityFilter, setSeverityFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchItems = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (severityFilter) params.set('severity', severityFilter)

    fetch(`/api/action-items?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.actionItems || []))
      .catch(() => setError('Failed to load action items.'))
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
      setError('Failed to update action item.')
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
          <h1 className="dash-heading">Actions Required</h1>
          <p className="dash-subheading mt-0.5">
            {statusFilter === 'open'
              ? `${items.length} open action${items.length !== 1 ? 's' : ''}`
              : `${items.length} action item${items.length !== 1 ? 's' : ''}`}
            {criticalCount > 0 && statusFilter === 'open' && (
              <span className="text-red-400 font-medium"> &middot; {criticalCount} high priority</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 dash-filter p-1">
          {['open', 'acknowledged', 'resolved', 'dismissed', ''].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'dash-date-active'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 dash-filter p-1">
          {['', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === s
                  ? 'dash-date-active'
                  : 'text-slate-400 hover:text-slate-200'
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
            <div key={i} className="h-28 dash-skeleton animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="dash-empty p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">All clear!</h3>
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
                className={`dash-action-card ${item.status === 'open' ? config.border : 'border-white/[0.06]'} p-5 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'open' ? config.bg : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${item.status === 'open' ? config.color : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-semibold ${item.status === 'resolved' || item.status === 'dismissed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
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
                    <p className="text-sm text-slate-400 mt-2">{item.description}</p>
                    {item.recommendation && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Recommendation</p>
                        <p className="text-sm text-slate-300">{item.recommendation}</p>
                      </div>
                    )}
                    {/* Actions */}
                    {item.status === 'open' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateStatus(item.id, 'acknowledged')}
                          disabled={updating === item.id}
                          className="dash-btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'resolved')}
                          disabled={updating === item.id}
                          className="dash-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
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
