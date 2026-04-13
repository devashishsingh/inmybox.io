'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Globe,
  BarChart3,
  Bell,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('domains')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    conversionRate: 2,
    avgLeadValue: 50,
    campaignBenchmark: 15,
    reportRetention: 90,
    notifications: true,
  })
  const [domains, setDomains] = useState<{ id: string; domain: string }[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings({
            conversionRate: d.settings.conversionRate * 100,
            avgLeadValue: d.settings.avgLeadValue,
            campaignBenchmark: d.settings.campaignBenchmark * 100,
            reportRetention: d.settings.reportRetention,
            notifications: d.settings.notifications,
          })
        }
        if (d.domains) setDomains(d.domains)
      })
      .catch(console.error)
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversionRate: settings.conversionRate / 100,
          avgLeadValue: settings.avgLeadValue,
          campaignBenchmark: settings.campaignBenchmark / 100,
          reportRetention: settings.reportRetention,
          notifications: settings.notifications,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save settings', e)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })
      const data = await res.json()
      if (data.domain) {
        setDomains((prev) => [...prev, data.domain])
        setNewDomain('')
      }
    } catch (e) {
      console.error('Failed to add domain', e)
      setError('Failed to add domain. Please try again.')
    }
  }

  const tabs = [
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'impact', label: 'Business Impact', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dash-heading">Settings</h1>
        <p className="dash-subheading mt-0.5">
          Manage your workspace, domains, and analysis preferences
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'dash-sidebar-item-active text-brand-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 dash-card p-6">
          {activeTab === 'domains' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-1">Domain Management</h2>
                <p className="text-sm text-slate-500">
                  Add and manage the domains you want to monitor
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                />
                <button
                  onClick={addDomain}
                  className="inline-flex items-center gap-2 px-4 py-2.5 dash-btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Domain
                </button>
              </div>

              <div className="space-y-2">
                {domains.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-8">
                    No domains added yet. Add your first domain above.
                  </div>
                ) : (
                  domains.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{d.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-1">Business Impact Assumptions</h2>
                <p className="text-sm text-slate-500">
                  Configure the formulas used to estimate business impact from delivery data
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Expected Conversion Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.conversionRate}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, conversionRate: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-4 py-2.5 pr-8 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Percentage of reached emails that convert to leads
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Average Lead Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={settings.avgLeadValue}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, avgLeadValue: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Average revenue value per converted lead
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Campaign Benchmark
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.campaignBenchmark}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, campaignBenchmark: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-4 py-2.5 pr-8 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Target delivery rate for campaign health scoring
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Report Retention
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="30"
                      max="365"
                      value={settings.reportRetention}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, reportRetention: parseInt(e.target.value) || 90 }))
                      }
                      className="w-full px-4 py-2.5 pr-12 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">days</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    How long to keep processed report data
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.06]">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 dash-btn-primary text-sm disabled:opacity-60"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-1">Notification Preferences</h2>
                <p className="text-sm text-slate-500">
                  Control how and when you receive alerts
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Email notifications', desc: 'Receive alerts for critical delivery failures', key: 'notifications' },
                  { label: 'Weekly digest', desc: 'Get a weekly summary of your email health', key: 'weekly' },
                  { label: 'New sender alerts', desc: 'Get notified when a new IP sends under your domain', key: 'newSender' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-700">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((s) => ({ ...s, notifications: !s.notifications }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.notifications ? 'bg-brand-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          settings.notifications ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-1">Profile</h2>
                <p className="text-sm text-slate-500">
                  Your account information
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-200">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-sm text-slate-500">{session?.user?.email || ''}</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    defaultValue={session?.user?.name || ''}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={session?.user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
