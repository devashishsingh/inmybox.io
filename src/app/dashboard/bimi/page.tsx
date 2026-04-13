'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Image,
  Award,
  Globe,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
  Eye,
  Upload,
  ArrowRight,
  Mail,
  Wrench,
} from 'lucide-react'

// ─── REMEDIATION GUIDANCE ───────────────────────────────────────────

const REMEDIATION_MAP: Record<string, { fix: string; link?: string }> = {
  'SPF record missing': {
    fix: 'Add an SPF record to your domain\'s DNS. Example: v=spf1 include:_spf.google.com ~all',
    link: 'https://support.google.com/a/answer/33786',
  },
  'No valid DKIM selectors found': {
    fix: 'Enable DKIM signing in your email provider (Google Workspace, Microsoft 365, etc.) and add the DKIM key to DNS.',
    link: 'https://support.google.com/a/answer/174124',
  },
  'DMARC record missing': {
    fix: 'Add a DMARC record: v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com; pct=100',
  },
  'must be quarantine or reject': {
    fix: 'Update your DMARC policy from p=none to p=quarantine or p=reject. Start with quarantine if unsure.',
  },
  'pct is': {
    fix: 'Update your DMARC record to include pct=100 for full policy enforcement.',
  },
  'SPF alignment too low': {
    fix: 'Ensure all legitimate senders are included in your SPF record. Review the Senders page to identify failing IPs.',
  },
  'DKIM alignment too low': {
    fix: 'Verify DKIM signing is active for all sending services. Check that DKIM domain matches your From domain.',
  },
  'unauthorized/suspicious': {
    fix: 'Review suspicious senders on the Senders page. Block or classify them to improve your authentication posture.',
  },
  'High authentication fail rate': {
    fix: 'Identify the source IPs causing failures in the Senders page and either authorize or block them.',
  },
}

function getRemediation(blocker: string): { fix: string; link?: string } | null {
  for (const [key, val] of Object.entries(REMEDIATION_MAP)) {
    if (blocker.toLowerCase().includes(key.toLowerCase())) return val
  }
  return null
}

// ─── PROVIDER-SPECIFIC DNS STEPS ────────────────────────────────────

const PROVIDER_DNS_STEPS: Record<string, string[]> = {
  'Google Workspace': [
    'Go to admin.google.com → Domains → Manage domains',
    'Click "DNS records" next to your domain, or open your domain registrar\'s DNS settings',
    'Add a new TXT record with Host = default._bimi and the generated value',
    'Note: Google may take up to 48 hours to display BIMI logos',
  ],
  'Microsoft 365': [
    'Sign in to your domain registrar\'s DNS management panel',
    'Create a TXT record with Name = default._bimi.yourdomain.com',
    'Note: Microsoft 365 has limited BIMI support; logos may not display in all Outlook clients',
  ],
  'Yahoo': [
    'Yahoo fully supports BIMI. Add the TXT record at your DNS provider.',
    'Yahoo does NOT require a VMC certificate to display logos.',
    'Logos typically appear within 24-48 hours after publishing.',
  ],
  'Zoho': [
    'Go to Zoho Mail Admin → Domains → DNS Manager',
    'Add a TXT record: Host = default._bimi, Value = your BIMI record',
    'Zoho has partial BIMI support; verify display with test emails.',
  ],
}

// ─── TYPES ──────────────────────────────────────────────────────────

interface DomainBimi {
  id: string
  domain: string
  bimiConfigs: {
    id: string
    readinessScore: number
    readinessStatus: string
    overallStatus: string
    lastCheckAt: string | null
    logoUrl: string | null
    certificateUrl: string | null
  }[]
}

interface ReadinessCheck {
  check: string
  status: 'pass' | 'fail' | 'warning'
  detail: string
}

interface FullCheckResult {
  configId: string
  domain: string
  readiness: {
    status: string
    score: number
    checks: ReadinessCheck[]
    blockers: string[]
    warnings: string[]
  }
  assets?: {
    logoValid: boolean
    logoError?: string
    certValid?: boolean
    certError?: string
    details: Record<string, any>
  }
  dns: {
    found: boolean
    record?: string
    logoUrl?: string
    certUrl?: string
  }
  overallStatus: string
  record: {
    dnsName: string
    txtValue: string
    copyReady: string
  } | null
}

interface ProviderInfo {
  provider: string
  bimiSupport: 'full' | 'partial' | 'none' | 'unknown'
  guidance: string
}

// ─── COMPONENT ──────────────────────────────────────────────────────

export default function BimiPage() {
  const [domains, setDomains] = useState<DomainBimi[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [checkResult, setCheckResult] = useState<FullCheckResult | null>(null)
  const [provider, setProvider] = useState<ProviderInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [certUrl, setCertUrl] = useState('')
  const [wizardStep, setWizardStep] = useState(0) // 0=overview, 1=readiness, 2=assets, 3=record, 4=publish
  const [expandedChecks, setExpandedChecks] = useState(true)

  // Load domains
  useEffect(() => {
    fetch('/api/bimi')
      .then((r) => r.json())
      .then((d) => {
        setDomains(d.domains || [])
        if (d.domains?.length === 1) {
          setSelectedDomain(d.domains[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-populate asset URLs when domain selected
  useEffect(() => {
    if (!selectedDomain) return
    const d = domains.find((d) => d.id === selectedDomain)
    if (d?.bimiConfigs?.length) {
      const cfg = d.bimiConfigs[0]
      setLogoUrl(cfg.logoUrl || '')
      setCertUrl(cfg.certificateUrl || '')
    } else {
      setLogoUrl('')
      setCertUrl('')
    }
  }, [selectedDomain, domains])

  const selectedDomainName = domains.find((d) => d.id === selectedDomain)?.domain || ''

  // Run full check
  const runCheck = useCallback(async () => {
    if (!selectedDomain) return
    setChecking(true)
    try {
      const res = await fetch('/api/bimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', domainId: selectedDomain }),
      })
      const data = await res.json()
      setCheckResult(data.result)

      // Also detect provider
      const pRes = await fetch('/api/bimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect-provider', domainId: selectedDomain }),
      })
      const pData = await pRes.json()
      setProvider(pData.provider)
    } catch (err) {
      console.error('BIMI check failed:', err)
      setError('BIMI check failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }, [selectedDomain])

  // Save assets
  const saveAssets = async () => {
    if (!selectedDomain) return
    setSaving(true)
    try {
      await fetch('/api/bimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-assets',
          domainId: selectedDomain,
          logoUrl: logoUrl || undefined,
          certificateUrl: certUrl || undefined,
        }),
      })
      // Re-run check to update everything
      await runCheck()
    } catch (err) {
      console.error('Save failed:', err)
      setError('Failed to save BIMI assets. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Mark published
  const markPublished = async () => {
    if (!selectedDomain) return
    try {
      await fetch('/api/bimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-published', domainId: selectedDomain }),
      })
      await runCheck()
    } catch (err) {
      console.error('Mark published failed:', err)
      setError('Failed to mark BIMI record as published.')
    }
  }

  // Copy to clipboard
  const copyRecord = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-run check when domain selected
  useEffect(() => {
    if (selectedDomain) {
      runCheck()
    }
  }, [selectedDomain, runCheck])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    )
  }

  const score = checkResult?.readiness?.score ?? 0
  const status = checkResult?.overallStatus ?? 'not_started'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dash-heading flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-400" />
            BIMI &amp; Brand Trust
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Display your brand logo in email inboxes. Verify readiness, configure assets, and publish your BIMI record.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">×</button>
          </div>
        )}
        {selectedDomain && (
          <button
            onClick={runCheck}
            disabled={checking}
            className="dash-btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Run Check'}
          </button>
        )}
      </div>

      {/* Domain Selector */}
      {domains.length > 1 && (
        <div className="dash-card p-4">
          <label className="text-sm font-medium text-slate-300 mb-2 block">Select Domain</label>
          <select
            value={selectedDomain || ''}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 text-sm"
          >
            <option value="">Choose a domain...</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.domain}
                {d.bimiConfigs?.length
                  ? ` — ${d.bimiConfigs[0].overallStatus} (${d.bimiConfigs[0].readinessScore}%)`
                  : ' — not started'}
              </option>
            ))}
          </select>
        </div>
      )}

      {domains.length === 0 && (
        <div className="dash-empty p-8 text-center">
          <Globe className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">No domains configured</h3>
          <p className="text-sm text-slate-500 mt-1">
            Add a domain in Settings to start BIMI configuration.
          </p>
        </div>
      )}

      {selectedDomain && !checkResult && !checking && (
        <div className="dash-card p-8 text-center">
          <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">Run a BIMI check</h3>
          <p className="text-sm text-slate-500 mt-1">Click &quot;Run Check&quot; to analyze your domain&apos;s BIMI readiness.</p>
        </div>
      )}

      {/* ─── RESULTS ──────────────────────────────────────────── */}
      {checkResult && (
        <>
          {/* Wizard Steps */}
          <div className="flex items-center gap-1 dash-filter p-2">
            {['Overview', 'Readiness', 'Assets', 'DNS Record', 'Publish'].map((step, i) => (
              <button
                key={step}
                onClick={() => setWizardStep(i)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                  wizardStep === i
                    ? 'dash-date-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {step}
              </button>
            ))}
          </div>

          {/* ─── STEP 0: OVERVIEW ────────────────────────────── */}
          {wizardStep === 0 && (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="dash-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200">
                      BIMI Readiness — {selectedDomainName}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Last checked: {checkResult.readiness ? new Date().toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Score Ring */}
                <div className="flex items-center gap-8">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-700" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 327} 327`}
                        className={score >= 90 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${score >= 90 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {score}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    {checkResult.readiness.blockers.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          {checkResult.readiness.blockers.length} Blocker{checkResult.readiness.blockers.length > 1 ? 's' : ''}
                        </h4>
                        <ul className="mt-1.5 space-y-1">
                          {checkResult.readiness.blockers.map((b, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-400">&bull; {b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {checkResult.readiness.warnings.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          {checkResult.readiness.warnings.length} Warning{checkResult.readiness.warnings.length > 1 ? 's' : ''}
                        </h4>
                        <ul className="mt-1.5 space-y-1">
                          {checkResult.readiness.warnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-600 dark:text-amber-400">&bull; {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {checkResult.readiness.blockers.length === 0 && checkResult.readiness.warnings.length === 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          All Clear
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          Your domain meets all BIMI prerequisites. Proceed to configure your brand assets.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/\[0.05\] text-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Checks
                  </button>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 rounded-xl text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Configure Assets
                  </button>
                  {checkResult.record && (
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      View DNS Record
                    </button>
                  )}
                </div>
              </div>

              {/* Provider Card */}
              {provider && (
                <div className="dash-card p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      provider.bimiSupport === 'full' ? 'bg-emerald-100 bg-emerald-500/10' :
                      provider.bimiSupport === 'partial' ? 'bg-amber-100 bg-amber-500/10' :
                      provider.bimiSupport === 'none' ? 'bg-red-100 bg-red-500/10' :
                      'bg-white/\[0.05\]'
                    }`}>
                      <Info className={`w-5 h-5 ${
                        provider.bimiSupport === 'full' ? 'text-emerald-600' :
                        provider.bimiSupport === 'partial' ? 'text-amber-600' :
                        provider.bimiSupport === 'none' ? 'text-red-600' :
                        'text-slate-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {provider.provider} — BIMI Support: {provider.bimiSupport === 'full' ? 'Full' : provider.bimiSupport === 'partial' ? 'Partial' : provider.bimiSupport === 'none' ? 'Not Supported' : 'Unknown'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{provider.guidance}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inbox Mockup Preview */}
              {(logoUrl || checkResult?.dns?.logoUrl) && (
                <div className="dash-card p-5">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-brand-600" />
                    Inbox Preview
                  </h3>
                  <div className="space-y-2">
                    {/* Gmail-style row */}
                    <div className="flex items-center gap-3 p-3 bg-white/\[0.03\] rounded-xl border border-white/\[0.06\]">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-white/\[0.08\] flex items-center justify-center overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl || checkResult?.dns?.logoUrl || ''}
                          alt="BIMI logo"
                          className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200 truncate">{selectedDomainName}</span>
                          {certUrl && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">Your latest email subject line preview...</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">2:30 PM</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Approximate preview — actual rendering varies by email client
                    </p>
                  </div>
                </div>
              )}

              {/* Existing BIMI DNS */}
              {checkResult.dns.found && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    BIMI Record Found in DNS
                  </h3>
                  <code className="block mt-2 text-xs bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg text-emerald-800 dark:text-emerald-300 break-all">
                    {checkResult.dns.record}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 1: READINESS CHECKS ────────────────────── */}
          {wizardStep === 1 && (
            <div className="dash-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Readiness Checks</h2>
                <button
                  onClick={() => setExpandedChecks(!expandedChecks)}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  {expandedChecks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {expandedChecks ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <div className="space-y-2">
                {checkResult.readiness.checks.map((check, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                    check.status === 'pass' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' :
                    check.status === 'warning' ? 'bg-amber-50/50 dark:bg-amber-950/20' :
                    'bg-red-50/50 dark:bg-red-950/20'
                  }`}>
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{check.check}</p>
                      {expandedChecks && (
                        <p className="text-xs text-slate-500 mt-0.5 break-all">{check.detail}</p>
                      )}
                      {/* Guided Remediation */}
                      {expandedChecks && check.status === 'fail' && (() => {
                        const remedy = getRemediation(check.detail) || getRemediation(check.check)
                        if (!remedy) return null
                        return (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                              <Wrench className="w-3 h-3 mt-0.5 shrink-0" />
                              <span><strong>Fix:</strong> {remedy.fix}</span>
                            </p>
                            {remedy.link && (
                              <a href={remedy.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 inline-flex items-center gap-0.5">
                                Learn more <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Next: Configure Assets <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: ASSET CONFIGURATION ─────────────────── */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="dash-card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-brand-600" />
                  Brand Assets
                </h2>

                <div className="space-y-4">
                  {/* Logo URL */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      SVG Logo URL <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Must be HTTPS, SVG Tiny PS format, square aspect ratio, no scripts/animations.
                    </p>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://yourdomain.com/brand/logo.svg"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/\[0.08\] bg-white bg-white/\[0.03\] text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    {checkResult.assets?.logoValid && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logo validated successfully
                      </p>
                    )}
                    {checkResult.assets?.logoError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {checkResult.assets.logoError}
                      </p>
                    )}
                  </div>

                  {/* Certificate URL */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                      VMC Certificate URL <span className="text-slate-400">(optional)</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Verified Mark Certificate (VMC) from DigiCert or Entrust. Required for the blue checkmark on Gmail.
                    </p>
                    <input
                      type="url"
                      value={certUrl}
                      onChange={(e) => setCertUrl(e.target.value)}
                      placeholder="https://yourdomain.com/certs/vmc.pem"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/\[0.08\] bg-white bg-white/\[0.03\] text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    {checkResult.assets?.certValid && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Certificate accessible
                      </p>
                    )}
                    {checkResult.assets?.certError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {checkResult.assets.certError}
                      </p>
                    )}
                  </div>

                  {/* No VMC Info */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      No VMC yet?
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      You can still publish a BIMI record without a VMC. Gmail will display your logo for
                      self-authenticated domains, but the blue verified checkmark requires a VMC.
                      Yahoo and other providers may display your logo without a VMC.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={saveAssets}
                    disabled={saving || !logoUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {saving ? 'Saving & Validating...' : 'Save & Validate'}
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 text-slate-300 hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Next: DNS Record <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: DNS RECORD ──────────────────────────── */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="dash-card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand-600" />
                  BIMI DNS Record
                </h2>

                {checkResult.record ? (
                  <div className="space-y-4">
                    {/* Generated Record */}
                    <div className="bg-white/\[0.03\] rounded-xl p-4 border border-white/\[0.06\]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DNS TXT Record</span>
                        <button
                          onClick={() => copyRecord(checkResult.record!.copyReady)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-500">Host / Name:</span>
                          <code className="block text-sm font-mono text-slate-200 mt-0.5">
                            {checkResult.record.dnsName}
                          </code>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Type:</span>
                          <code className="block text-sm font-mono text-slate-200 mt-0.5">TXT</code>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Value:</span>
                          <code className="block text-sm font-mono text-slate-200 mt-0.5 break-all">
                            {checkResult.record.txtValue}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* DNS Setup Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3">Setup Instructions</h3>
                      <ol className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">1.</span>
                          Log in to your DNS provider (e.g., Cloudflare, GoDaddy, Route53, Namecheap).
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">2.</span>
                          Navigate to DNS management for <strong>{selectedDomainName}</strong>.
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">3.</span>
                          Add a new <strong>TXT</strong> record with the host name <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">default._bimi</code>.
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">4.</span>
                          Set the value to: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded break-all">{checkResult.record.txtValue}</code>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">5.</span>
                          Save the record and wait for DNS propagation (usually 5-60 minutes).
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold shrink-0">6.</span>
                          Come back here and click &quot;Run Check&quot; to verify your record is live.
                        </li>
                      </ol>
                    </div>

                    {/* Provider-Specific DNS Steps */}
                    {provider && PROVIDER_DNS_STEPS[provider.provider] && (
                      <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                        <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-1.5">
                          <Info className="w-4 h-4" />
                          {provider.provider}-Specific Tips
                        </h3>
                        <ul className="space-y-2 text-xs text-violet-700 dark:text-violet-300">
                          {PROVIDER_DNS_STEPS[provider.provider].map((step, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-bold shrink-0">&bull;</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Current DNS Status */}
                    <div className={`rounded-xl p-4 border ${
                      checkResult.dns.found
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : 'bg-white/\[0.03\] border-white/\[0.06\]'
                    }`}>
                      <div className="flex items-center gap-2">
                        {checkResult.dns.found ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">BIMI record detected in DNS</span>
                          </>
                        ) : (
                          <>
                            <Info className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-500">BIMI record not yet detected in DNS</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Configure your brand logo first to generate a BIMI record.</p>
                    <button
                      onClick={() => setWizardStep(2)}
                      className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      &larr; Go to Assets
                    </button>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                  >
                    &larr; Back to Assets
                  </button>
                  <button
                    onClick={() => setWizardStep(4)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    Next: Publish <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: PUBLISH & MONITOR ───────────────────── */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="dash-card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-600" />
                  Publish &amp; Monitor
                </h2>

                {/* Status Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <MiniCard
                    label="DNS Ready"
                    value={checkResult.readiness.status === 'ready' || checkResult.readiness.status === 'partially_ready' ? 'Yes' : 'No'}
                    ok={checkResult.readiness.status === 'ready'}
                  />
                  <MiniCard
                    label="Logo Valid"
                    value={checkResult.assets?.logoValid ? 'Yes' : 'No'}
                    ok={checkResult.assets?.logoValid || false}
                  />
                  <MiniCard
                    label="BIMI in DNS"
                    value={checkResult.dns.found ? 'Yes' : 'No'}
                    ok={checkResult.dns.found}
                  />
                  <MiniCard
                    label="Score"
                    value={`${score}%`}
                    ok={score >= 90}
                  />
                </div>

                {/* Publish Button */}
                {checkResult.dns.found && checkResult.readiness.status === 'ready' && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 mb-4">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready to mark as published
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Your BIMI record is live and all checks pass. Mark it as published to enable monitoring.
                    </p>
                    <button
                      onClick={markPublished}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Award className="w-4 h-4" />
                      Mark as Published
                    </button>
                  </div>
                )}

                {status === 'published' && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 mb-4">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      BIMI is Published &amp; Active
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Your brand logo will appear in supported email clients. InMyBox will monitor for any regressions.
                    </p>
                  </div>
                )}

                {status === 'regression' && (
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 border border-red-200 dark:border-red-800 mb-4">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      BIMI Regression Detected
                    </h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Your BIMI record is live in DNS but one or more prerequisites are no longer met.
                      Review readiness checks to identify and fix the issue.
                    </p>
                    <button
                      onClick={() => setWizardStep(1)}
                      className="mt-2 text-xs text-red-700 dark:text-red-400 font-medium hover:underline"
                    >
                      View Readiness Checks &rarr;
                    </button>
                  </div>
                )}

                {/* Not ready guidance */}
                {!checkResult.dns.found && checkResult.readiness.status !== 'ready' && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800 mb-4">
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Not Ready to Publish
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Resolve blockers in the readiness section and publish your BIMI DNS record before marking as published.
                    </p>
                  </div>
                )}

                {/* Check History (if we have results) */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">What happens after publishing?</h3>
                  <div className="space-y-2 text-xs text-slate-500">
                    <p>• InMyBox monitors your SPF, DKIM, and DMARC alignment continuously via your DMARC reports.</p>
                    <p>• If your DMARC policy weakens or authentication rates drop, you&apos;ll see a regression alert.</p>
                    <p>• BIMI DNS record presence is verified during each check to detect accidental removal.</p>
                    <p>• Logo and certificate URLs are validated periodically to ensure they remain accessible.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    not_started: { bg: 'bg-white/\[0.05\]', text: 'text-slate-600 text-slate-300', label: 'Not Started' },
    setup: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Setup' },
    ready: { bg: 'bg-emerald-100 bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: 'Ready' },
    published: { bg: 'bg-emerald-100 bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: 'Published' },
    misconfigured: { bg: 'bg-amber-100 bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', label: 'Misconfigured' },
    regression: { bg: 'bg-red-100 bg-red-500/10', text: 'text-red-700 dark:text-red-300', label: 'Regression' },
  }
  const c = config[status] || config.not_started
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function MiniCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${
      ok ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
         : 'bg-white/\[0.03\] border-white/\[0.06\]'
    }`}>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>{value}</p>
    </div>
  )
}
