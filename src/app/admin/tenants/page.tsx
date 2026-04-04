'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Globe,
  Users,
  Activity,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  contactEmail: string | null
  plan: string
  status: string
  timezone: string
  createdAt: string
  domains: { id: string; domain: string; isPrimary: boolean }[]
  aliases: { id: string; alias: string; isActive: boolean }[]
  _count: { memberships: number; ingestionLogs: number; actionItems: number }
  onboarding: { completedAt: string | null } | null
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const fetchTenants = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    fetch(`/api/admin/tenants?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setTenants(d.tenants || [])
        setTotal(d.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTenants() }, [search, statusFilter])

  const statusIcon = (s: string) => {
    switch (s) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case 'paused': return <PauseCircle className="w-4 h-4 text-amber-400" />
      case 'suspended': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <XCircle className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} total tenants</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" /> New Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-brand-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Domain</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Users</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Onboarding</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-5 bg-slate-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No tenants found. Create one to get started.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const primaryDomain = t.domains.find((d) => d.isPrimary)?.domain || t.domains[0]?.domain || '—'
                  return (
                    <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-sm font-bold">
                            {t.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          {primaryDomain}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(t.status)}
                          <span className="text-slate-300 capitalize">{t.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 capitalize">{t.plan}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {t._count.memberships}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {t.onboarding?.completedAt ? (
                          <span className="text-emerald-400 text-xs font-medium">Complete</span>
                        ) : (
                          <span className="text-amber-400 text-xs font-medium">In Progress</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTenants() }}
        />
      )}
    </div>
  )
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    companyName: '',
    contactEmail: '',
    primaryDomain: '',
    reportAlias: '',
    timezone: 'UTC',
    plan: 'free',
    notes: '',
    inviteEmail: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reportAlias: form.reportAlias || undefined,
          inviteEmail: form.inviteEmail || undefined,
          notes: form.notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create tenant')

      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Provision New Tenant</h2>
          <p className="text-xs text-slate-400 mt-0.5">Create a new company workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name *</label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact Email *</label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
              placeholder="admin@acme.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Primary Domain *</label>
            <input
              type="text"
              required
              value={form.primaryDomain}
              onChange={(e) => setForm({ ...form, primaryDomain: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
              placeholder="acme.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Report Alias</label>
            <input
              type="text"
              value={form.reportAlias}
              onChange={(e) => setForm({ ...form, reportAlias: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
              placeholder="acme@mydomain.site"
            />
            <p className="text-xs text-slate-500 mt-1">Unique email alias for DMARC report collection</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-brand-500 outline-none"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
                placeholder="UTC"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Invite Tenant Admin</label>
            <input
              type="email"
              value={form.inviteEmail}
              onChange={(e) => setForm({ ...form, inviteEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none"
              placeholder="user@acme.com"
            />
            <p className="text-xs text-slate-500 mt-1">Optional: send invite link to customer admin</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-brand-500 outline-none resize-none"
              placeholder="Internal comments..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Provision Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
