'use client'

import { useEffect, useState } from 'react'
import { Globe, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ tenantId: '', domain: '', isPrimary: false, notes: '' })
  const [tenants, setTenants] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchDomains = () => {
    setLoading(true)
    fetch('/api/admin/domains')
      .then((r) => r.json())
      .then((d) => setDomains(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDomains()
    fetch('/api/admin/tenants?limit=100')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants || []))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowAdd(false)
      setForm({ tenantId: '', domain: '', isPrimary: false, notes: '' })
      fetchDomains()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (domainId: string, dmarcSetupStatus: string) => {
    await fetch('/api/admin/domains', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId, dmarcSetupStatus }),
    })
    fetchDomains()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Domains</h1>
          <p className="text-sm text-slate-400 mt-0.5">{domains.length} domains across all tenants</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
          <Plus className="w-4 h-4" /> Add Domain
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Domain</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Primary</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">DMARC Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Reports</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td colSpan={6} className="px-4 py-4"><div className="h-5 bg-slate-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : domains.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No domains found.</td></tr>
            ) : (
              domains.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                      <Globe className="w-4 h-4 text-slate-500" />
                      {d.domain}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{d.tenant?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {d.isPrimary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.dmarcSetupStatus}
                      onChange={(e) => updateStatus(d.id, e.target.value)}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="configured">Configured</option>
                      <option value="verified">Verified</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{d._count?.reports || 0}</td>
                  <td className="px-4 py-3 text-slate-300">{d._count?.senders || 0} senders</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Domain Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add Domain</h2>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tenant *</label>
                <select required value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none">
                  <option value="">Select tenant...</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain *</label>
                <input type="text" required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none" placeholder="example.com" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                  className="rounded border-slate-600" />
                Set as primary domain
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
