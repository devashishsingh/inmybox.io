'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Send, Copy, XCircle, CheckCircle2, Clock } from 'lucide-react'

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', tenantId: '', role: 'admin' })
  const [tenants, setTenants] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const fetchInvitations = () => {
    setLoading(true)
    fetch('/api/admin/invitations')
      .then((r) => r.json())
      .then((d) => setInvitations(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInvitations()
    fetch('/api/admin/tenants?limit=100')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants || []))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setForm({ email: '', tenantId: '', role: 'admin' })
      fetchInvitations()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (invitationId: string, action: 'resend' | 'revoke') => {
    await fetch('/api/admin/invitations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId, action }),
    })
    fetchInvitations()
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite?token=${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-amber-400 text-xs"><Clock className="w-3 h-3" /> Pending</span>
      case 'accepted': return <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" /> Accepted</span>
      case 'revoked': return <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Revoked</span>
      case 'expired': return <span className="flex items-center gap-1 text-slate-500 text-xs"><Clock className="w-3 h-3" /> Expired</span>
      default: return <span className="text-xs text-slate-500">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invitations</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage tenant user invitations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors">
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Expires</th>
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
            ) : invitations.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No invitations sent yet.</td></tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white">{inv.email}</td>
                  <td className="px-4 py-3 text-slate-300">{inv.tenant?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{inv.role}</td>
                  <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyLink(inv.token)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                          <Copy className="w-3 h-3" /> {copied === inv.token ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => handleAction(inv.id, 'resend')} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                          <Send className="w-3 h-3" /> Resend
                        </button>
                        <button onClick={() => handleAction(inv.id, 'revoke')} className="text-xs text-red-400 hover:text-red-300">
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invitation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Invite Tenant User</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none" placeholder="user@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none">
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50">
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
