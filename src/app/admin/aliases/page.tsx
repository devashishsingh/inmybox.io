'use client'

import { useEffect, useState } from 'react'
import { AtSign, Plus, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminAliasesPage() {
  const [aliases, setAliases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ alias: '', tenantId: '', notes: '' })
  const [tenants, setTenants] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchAliases = () => {
    setLoading(true)
    fetch('/api/admin/aliases')
      .then((r) => r.json())
      .then((d) => setAliases(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAliases()
    fetch('/api/admin/tenants?limit=100')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants || []))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowAdd(false)
      setForm({ alias: '', tenantId: '', notes: '' })
      fetchAliases()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (aliasId: string, isActive: boolean) => {
    await fetch('/api/admin/aliases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aliasId, isActive }),
    })
    fetchAliases()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alias Mapping</h1>
          <p className="text-sm text-slate-400 mt-0.5">DMARC report email alias → tenant mapping</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
          <Plus className="w-4 h-4" /> Add Alias
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Alias</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td colSpan={5} className="px-4 py-4"><div className="h-5 bg-slate-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : aliases.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No aliases configured.</td></tr>
            ) : (
              aliases.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-white font-mono text-xs">
                      <AtSign className="w-4 h-4 text-slate-500" />
                      {a.alias}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.tenant?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {a.isActive ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(a.id, !a.isActive)}
                      className={`text-xs px-3 py-1 rounded-lg border ${a.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Alias Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add Alias Mapping</h2>
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Alias Email *</label>
                <input type="text" required value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none" placeholder="company@mydomain.site" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none" placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Alias'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
