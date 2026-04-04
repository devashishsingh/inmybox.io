'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Globe,
  AtSign,
  Users,
  Activity,
  UserPlus,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Search,
  Copy,
  AlertTriangle,
} from 'lucide-react'

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', contactEmail: '', status: '', plan: '', timezone: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchTenant = () => {
    setLoading(true)
    fetch(`/api/admin/tenants/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setTenant(d)
        setEditForm({
          name: d.name || '',
          contactEmail: d.contactEmail || '',
          status: d.status || 'active',
          plan: d.plan || 'free',
          timezone: d.timezone || 'UTC',
          notes: d.notes || '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTenant() }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: params.id, ...editForm }),
      })
      setEditMode(false)
      fetchTenant()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
      </div>
    )
  }

  if (!tenant) {
    return <div className="text-slate-400 text-center py-20">Tenant not found.</div>
  }

  const onboarding = tenant.onboarding
  const checklistSteps = onboarding ? [
    { label: 'Domain Added', done: onboarding.domainAdded },
    { label: 'Alias Assigned', done: onboarding.aliasAssigned },
    { label: 'DMARC RUA Updated', done: onboarding.dmarcRuaUpdated },
    { label: 'Sample Report', done: onboarding.sampleReportUploaded },
    { label: 'First Report', done: onboarding.firstReportReceived },
    { label: 'Parsing Complete', done: onboarding.parsingComplete },
    { label: 'Senders Reviewed', done: onboarding.sendersReviewed },
    { label: 'Assumptions Set', done: onboarding.assumptionsConfigured },
    { label: 'Dashboard Ready', done: onboarding.dashboardReady },
  ] : []

  const completedSteps = checklistSteps.filter((s) => s.done).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/tenants')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {tenant.name}
            {tenant.status === 'active' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
             tenant.status === 'paused' ? <PauseCircle className="w-5 h-5 text-amber-400" /> :
             <XCircle className="w-5 h-5 text-red-400" />}
          </h1>
          <p className="text-sm text-slate-400">{tenant.slug} &middot; {tenant.plan} plan</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/inspect?tenantId=${tenant.id}`}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Inspect
          </Link>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant Info */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Tenant Details</h3>
            {editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Contact Email</label>
                    <input value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none">
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Plan</label>
                    <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none">
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Timezone</label>
                    <input value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm outline-none resize-none focus:border-brand-500" />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Company:</span> <span className="text-white ml-2">{tenant.name}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-white ml-2">{tenant.contactEmail || '—'}</span></div>
                <div><span className="text-slate-500">Plan:</span> <span className="text-white ml-2 capitalize">{tenant.plan}</span></div>
                <div><span className="text-slate-500">Timezone:</span> <span className="text-white ml-2">{tenant.timezone}</span></div>
                <div><span className="text-slate-500">Created:</span> <span className="text-white ml-2">{new Date(tenant.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-white ml-2 capitalize">{tenant.status}</span></div>
                {tenant.notes && (
                  <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="text-slate-300 ml-2">{tenant.notes}</span></div>
                )}
              </div>
            )}
          </div>

          {/* Domains */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" /> Domains ({tenant.domains.length})
            </h3>
            {tenant.domains.length === 0 ? (
              <p className="text-sm text-slate-500">No domains configured.</p>
            ) : (
              <div className="space-y-2">
                {tenant.domains.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 text-sm text-white">
                      {d.domain}
                      {d.isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-medium">PRIMARY</span>}
                    </div>
                    <span className={`text-xs font-medium ${d.dmarcSetupStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'} capitalize`}>
                      {d.dmarcSetupStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Members ({tenant.memberships.length})
            </h3>
            {tenant.memberships.length === 0 ? (
              <p className="text-sm text-slate-500">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {tenant.memberships.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50">
                    <div className="text-sm">
                      <span className="text-white">{m.user.name || m.user.email}</span>
                      <span className="text-slate-500 ml-2">{m.user.email}</span>
                    </div>
                    <span className="text-xs text-slate-400 capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invitations */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400" /> Invitations ({tenant.invitations.length})
            </h3>
            {tenant.invitations.length === 0 ? (
              <p className="text-sm text-slate-500">No invitations sent.</p>
            ) : (
              <div className="space-y-2">
                {tenant.invitations.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50">
                    <div className="text-sm">
                      <span className="text-white">{inv.email}</span>
                      <span className={`ml-2 text-xs font-medium ${inv.status === 'accepted' ? 'text-emerald-400' : inv.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                        {inv.status}
                      </span>
                    </div>
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy Link
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-6">
          {/* Onboarding Progress */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Onboarding Progress</h3>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">{completedSteps} of {checklistSteps.length} complete</span>
                <span className="text-white font-medium">{Math.round((completedSteps / checklistSteps.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${(completedSteps / checklistSteps.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {checklistSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-xs">
                  {step.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <span className={step.done ? 'text-slate-300' : 'text-slate-500'}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Ingestion Logs</span>
                <span className="text-white">{tenant._count.ingestionLogs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Action Items</span>
                <span className="text-white">{tenant._count.actionItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2"><AtSign className="w-3.5 h-3.5" /> Aliases</span>
                <span className="text-white">{tenant.aliases.length}</span>
              </div>
            </div>
          </div>

          {/* Aliases */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Report Aliases</h3>
            {tenant.aliases.length === 0 ? (
              <p className="text-xs text-slate-500">No aliases configured.</p>
            ) : (
              <div className="space-y-2">
                {tenant.aliases.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-mono text-xs">{a.alias}</span>
                    <span className={`text-xs ${a.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
