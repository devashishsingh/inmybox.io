'use client'

import { useEffect, useState } from 'react'
import { Search, Building2, Globe, Users, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function AdminInspectPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState('')
  const [section, setSection] = useState('overview')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tenants?limit=100')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants || []))
  }, [])

  const inspect = () => {
    if (!selectedTenant) return
    setLoading(true)
    fetch(`/api/admin/inspect?tenantId=${selectedTenant}&section=${section}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedTenant) inspect()
  }, [selectedTenant, section])

  const sections = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'senders', label: 'Senders', icon: Globe },
    { key: 'action-items', label: 'Action Items', icon: AlertTriangle },
    { key: 'ingestion', label: 'Ingestion', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Inspection</h1>
        <p className="text-sm text-slate-400 mt-0.5">Deep-dive into tenant data for support and debugging</p>
      </div>

      {/* Tenant Selector */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select Tenant to Inspect</label>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
        >
          <option value="">Choose a tenant...</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTenant && (
        <>
          {/* Section Tabs */}
          <div className="flex gap-2">
            {sections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  section === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 min-h-[300px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 bg-slate-800 rounded animate-pulse" />
                ))}
              </div>
            ) : !data ? (
              <div className="text-center text-slate-500 py-12">Select a tenant to begin inspection</div>
            ) : section === 'overview' ? (
              <OverviewSection data={data} />
            ) : section === 'senders' ? (
              <SendersSection data={data} />
            ) : section === 'action-items' ? (
              <ActionItemsSection data={data} />
            ) : (
              <IngestionSection data={data} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function OverviewSection({ data }: { data: any }) {
  if (!data?.tenant) return <div className="text-slate-500">No data</div>
  const t = data.tenant
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <InfoCard label="Company" value={t.name} />
        <InfoCard label="Status" value={t.status} />
        <InfoCard label="Plan" value={t.plan} />
        <InfoCard label="Domains" value={t._count?.domains || 0} />
        <InfoCard label="Members" value={t._count?.members || 0} />
        <InfoCard label="Created" value={new Date(t.createdAt).toLocaleDateString()} />
      </div>
      {t.domains?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">Domains</h3>
          <div className="space-y-1">
            {t.domains.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 text-sm">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-white">{d.domain}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${d.dmarcSetupStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {d.dmarcSetupStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SendersSection({ data }: { data: any }) {
  const senders = data?.senders || []
  if (senders.length === 0) return <div className="text-slate-500 text-center py-12">No senders found for this tenant.</div>
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Source IP</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Hostname</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">SPF</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">DKIM</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Volume</th>
          </tr>
        </thead>
        <tbody>
          {senders.map((s: any, i: number) => (
            <tr key={i} className="border-b border-slate-800/50">
              <td className="px-3 py-2 text-white font-mono text-xs">{s.sourceIp}</td>
              <td className="px-3 py-2 text-slate-300 text-xs">{s.hostname || '—'}</td>
              <td className="px-3 py-2">
                {s.spfResult === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </td>
              <td className="px-3 py-2">
                {s.dkimResult === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </td>
              <td className="px-3 py-2 text-slate-400 text-xs">{s.messageCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionItemsSection({ data }: { data: any }) {
  const items = data?.actionItems || []
  if (items.length === 0) return <div className="text-emerald-400 text-center py-12 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> No action items — everything looks good!</div>
  return (
    <div className="space-y-3">
      {items.map((item: any, i: number) => (
        <div key={i} className={`px-4 py-3 rounded-xl border ${item.severity === 'high' ? 'bg-red-500/5 border-red-500/30' : item.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${item.severity === 'high' ? 'text-red-400' : item.severity === 'medium' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-white text-sm font-medium">{item.title}</div>
              <div className="text-slate-400 text-xs mt-0.5">{item.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function IngestionSection({ data }: { data: any }) {
  const logs = data?.logs || []
  if (logs.length === 0) return <div className="text-slate-500 text-center py-12">No ingestion history for this tenant.</div>
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-3 py-2 text-slate-400 font-medium">File</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Status</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Records</th>
            <th className="text-left px-3 py-2 text-slate-400 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id} className="border-b border-slate-800/50">
              <td className="px-3 py-2 text-white text-xs font-mono">{log.filename?.slice(0, 40) || '—'}</td>
              <td className="px-3 py-2">
                <span className={`text-xs ${log.status === 'completed' ? 'text-emerald-400' : log.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                  {log.status}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-400 text-xs">{log.recordsProcessed || 0}</td>
              <td className="px-3 py-2 text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-white font-medium mt-0.5">{String(value)}</div>
    </div>
  )
}
