'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, Globe, AtSign, Activity, AlertTriangle, Trash2 } from 'lucide-react'

interface Stats {
  tenants: number
  users: number
  domains: number
  aliases: number
  pendingIngestion: number
  failedIngestion: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/tenants?limit=1').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/domains').then((r) => r.json()),
      fetch('/api/admin/aliases').then((r) => r.json()),
      fetch('/api/admin/ingestion?limit=1').then((r) => r.json()),
    ])
      .then(([tenants, users, domains, aliases, ingestion]) => {
        setStats({
          tenants: tenants.total || 0,
          users: Array.isArray(users) ? users.length : 0,
          domains: Array.isArray(domains) ? domains.length : 0,
          aliases: Array.isArray(aliases) ? aliases.length : 0,
          pendingIngestion: ingestion.summary?.processing || 0,
          failedIngestion: ingestion.summary?.failed || 0,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Tenants', value: stats?.tenants || 0, icon: Building2, href: '/admin/tenants', color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Users', value: stats?.users || 0, icon: Users, href: '/admin/users', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Domains', value: stats?.domains || 0, icon: Globe, href: '/admin/domains', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Aliases', value: stats?.aliases || 0, icon: AtSign, href: '/admin/aliases', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Processing', value: stats?.pendingIngestion || 0, icon: Activity, href: '/admin/ingestion', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Failed Jobs', value: stats?.failedIngestion || 0, icon: AlertTriangle, href: '/admin/ingestion?status=failed', color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage tenants, domains, aliases, and monitor ingestion.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-slate-400">{card.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <DangerZone />
    </div>
  )
}

function DangerZone() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setOpen(false)
    setConfirmText('')
    setError(null)
  }

  const handlePurge = async () => {
    if (confirmText !== 'PURGE') return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/purge-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'PURGE' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Request failed (${res.status})`)
        setBusy(false)
        return
      }
      reset()
      setToast('All report data purged. Ready for fresh testing.')
      setTimeout(() => setToast(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = confirmText === 'PURGE' && !busy

  return (
    <>
      <div className="bg-slate-900 rounded-2xl border border-red-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
            <p className="text-sm text-slate-400 mt-1">
              Permanently delete all DMARC reports, sender data, and ingestion
              logs for the current tenant. Tenant configuration, users,
              domains, and alias mappings are preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/10 border border-red-700/40 text-sm font-medium text-red-300 hover:bg-red-600/20 hover:text-red-200 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Purge Report Data
          </button>
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) reset()
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white">
                  Purge all report data?
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  This will permanently delete all DMARC reports, sender data,
                  and ingestion logs. Tenant configuration will be preserved.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs text-slate-400 mb-1.5">
                Type <span className="font-mono text-red-400">PURGE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={busy}
                autoFocus
                placeholder="PURGE"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none font-mono text-sm"
              />
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {busy ? 'Deleting…' : 'Delete All Report Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm shadow-lg animate-fade-in"
        >
          {toast}
        </div>
      )}
    </>
  )
}
