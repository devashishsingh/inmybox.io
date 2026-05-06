'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Copy, Globe, Mail, Wifi, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type Method = 'dns_rua' | 'forwarding' | 'imap_oauth'

interface WizardState {
  wizardStep: number
  ingestionMethod: Method | null
  domainAdded: boolean
  aliasAssigned: boolean
  dmarcRuaUpdated: boolean
  firstReportReceived: boolean
  domain: { id: string; domain: string; dmarcRecord: string | null } | null
  alias?: string
}

const STEPS = [
  { label: 'Add Domain' },
  { label: 'Choose Method' },
  { label: 'Setup Instructions' },
  { label: 'Awaiting Report' },
  { label: 'Ready' },
]

export function OnboardingWizard() {
  const router = useRouter()
  const [state, setState] = useState<WizardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step-specific state
  const [domainInput, setDomainInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; hasRua?: boolean; record?: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding')
      if (!res.ok) throw new Error('Failed to load state')
      const data = await res.json()
      setState(data)
    } catch (err) {
      setError('Could not load onboarding state. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  // Poll for first report on step 3
  useEffect(() => {
    if (!state || state.wizardStep !== 3 || state.firstReportReceived) return
    const id = setInterval(async () => {
      const res = await fetch('/api/onboarding')
      if (res.ok) {
        const data = await res.json()
        setState(data)
        setPollCount((n) => n + 1)
        if (data.firstReportReceived) clearInterval(id)
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [state?.wizardStep, state?.firstReportReceived])

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  async function post(body: object) {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  async function handleAddDomain() {
    if (!domainInput.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await post({ action: 'add_domain', domain: domainInput.trim() })
      setState((s) => s ? { ...s, domain: data.domain, alias: data.alias, domainAdded: true, wizardStep: 1 } : s)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleChooseMethod(method: Method) {
    setSubmitting(true)
    try {
      await post({ action: 'set_method', method })
      setState((s) => s ? { ...s, ingestionMethod: method, wizardStep: 2 } : s)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyDns() {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const data = await post({ action: 'verify_dns' })
      setVerifyResult(data)
      if (data.hasRua) {
        setState((s) => s ? { ...s, dmarcRuaUpdated: true } : s)
      }
    } finally {
      setVerifying(false)
    }
  }

  async function advanceToPolling() {
    await post({ action: 'mark_step', step: 3 })
    setState((s) => s ? { ...s, wizardStep: 3 } : s)
  }

  async function goToDashboard() {
    await post({ action: 'mark_step', step: 4 })
    router.push('/dashboard')
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const step = state?.wizardStep ?? 0

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-12 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border border-white/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-400 font-black text-lg">◎</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to Inmybox</h1>
        <p className="text-zinc-400 text-sm mt-1">Let&apos;s get your domain protected in 5 minutes.</p>
      </div>

      {/* Step progress bar */}
      <div className="w-full mb-10">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'bg-blue-600/20 border-blue-500 text-blue-400' :
                  'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${i === step ? 'text-blue-400' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 mb-4 ${i < step ? 'bg-blue-600' : 'bg-zinc-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="w-full mb-6 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card */}
      <div className="w-full bg-[#111318] border border-white/[0.07] rounded-2xl p-8">
        {step === 0 && <StepAddDomain domainInput={domainInput} setDomainInput={setDomainInput} submitting={submitting} onSubmit={handleAddDomain} />}
        {step === 1 && <StepChooseMethod submitting={submitting} onChoose={handleChooseMethod} />}
        {step === 2 && state && (
          <StepSetupInstructions
            state={state}
            copied={copied}
            verifying={verifying}
            verifyResult={verifyResult}
            onCopy={copyText}
            onVerify={handleVerifyDns}
            onContinue={advanceToPolling}
          />
        )}
        {step === 3 && (
          <StepAwaiting
            firstReportReceived={state?.firstReportReceived ?? false}
            pollCount={pollCount}
            onContinue={goToDashboard}
          />
        )}
        {step === 4 && <StepReady onGoToDashboard={goToDashboard} />}
      </div>
    </div>
  )
}

// ─── STEP 0: ADD DOMAIN ───────────────────────────────────────────────────────

function StepAddDomain({ domainInput, setDomainInput, submitting, onSubmit }: {
  domainInput: string
  setDomainInput: (v: string) => void
  submitting: boolean
  onSubmit: () => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">Add your domain</h2>
      <p className="text-zinc-400 text-sm mb-6">Enter the domain you send email from. This is the domain in your <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-xs">From:</code> header.</p>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="yourdomain.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting || !domainInput.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 1: CHOOSE METHOD ────────────────────────────────────────────────────

function StepChooseMethod({ submitting, onChoose }: { submitting: boolean; onChoose: (m: Method) => void }) {
  const methods: { key: Method; icon: React.ReactNode; title: string; desc: string; badge?: string }[] = [
    {
      key: 'dns_rua',
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      title: 'DNS RUA alias',
      desc: 'Add our address directly to your DMARC DNS record. Zero friction — works with any email provider.',
      badge: 'Recommended',
    },
    {
      key: 'forwarding',
      icon: <Mail className="w-5 h-5 text-purple-400" />,
      title: 'Auto-forward from inbox',
      desc: 'Already receiving reports to a shared inbox? Just set up an auto-forward rule. No DNS changes needed.',
    },
    {
      key: 'imap_oauth',
      icon: <Wifi className="w-5 h-5 text-green-400" />,
      title: 'Connect mailbox (OAuth / IMAP)',
      desc: 'Connect your Google or Microsoft mailbox with OAuth. Inmybox polls it directly. No forwarding rules needed.',
    },
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-1">How would you like to receive DMARC reports?</h2>
      <p className="text-zinc-400 text-sm mb-6">Choose the method that suits your setup. You can change this later.</p>
      <div className="flex flex-col gap-3">
        {methods.map((m) => (
          <button
            key={m.key}
            onClick={() => onChoose(m.key)}
            disabled={submitting}
            className="group text-left p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-blue-500/40 rounded-xl transition-all flex items-start gap-4"
          >
            <div className="mt-0.5 p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg transition-colors">{m.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">{m.title}</span>
                {m.badge && <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">{m.badge}</span>}
              </div>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{m.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 mt-1 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── STEP 2: SETUP INSTRUCTIONS ──────────────────────────────────────────────

function StepSetupInstructions({ state, copied, verifying, verifyResult, onCopy, onVerify, onContinue }: {
  state: WizardState
  copied: string | null
  verifying: boolean
  verifyResult: { verified: boolean; hasRua?: boolean; record?: string } | null
  onCopy: (text: string, key: string) => void
  onVerify: () => void
  onContinue: () => void
}) {
  const alias = state.alias || `${state.domain?.domain || 'yourdomain'}@rua.inmybox.io`
  const domain = state.domain?.domain || 'yourdomain.com'
  const dmarcRecord = `v=DMARC1; p=none; rua=mailto:${alias}; pct=100;`

  if (state.ingestionMethod === 'dns_rua') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Update your DMARC DNS record</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Add or update a <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-xs">TXT</code> record at{' '}
          <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-xs">_dmarc.{domain}</code> with this value:
        </p>
        <div className="relative mb-4">
          <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-300 break-all whitespace-pre-wrap">{dmarcRecord}</pre>
          <button onClick={() => onCopy(dmarcRecord, 'record')} className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            {copied === 'record' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-zinc-500 text-xs mb-6">DNS changes can take up to 24 hours to propagate, though usually much faster.</p>
        <div className="flex gap-3">
          <button
            onClick={onVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify DNS'}
          </button>
          <button onClick={onContinue} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
            I&apos;ve done this <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {verifyResult && (
          <div className={`mt-4 flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${verifyResult.verified ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
            {verifyResult.verified
              ? <><CheckCircle2 className="w-4 h-4" /> DMARC record found! {verifyResult.hasRua ? 'Inmybox RUA address detected ✓' : 'Update the rua= field to include our address.'}</>
              : <><AlertCircle className="w-4 h-4" /> No DMARC record found yet. DNS may still be propagating.</>
            }
          </div>
        )}
      </div>
    )
  }

  if (state.ingestionMethod === 'forwarding') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Set up email forwarding</h2>
        <p className="text-zinc-400 text-sm mb-6">Configure your existing DMARC report inbox to auto-forward messages to your Inmybox alias.</p>
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-zinc-500 text-xs mb-1">Forward DMARC reports to:</p>
            <p className="text-white font-mono text-sm">{alias}</p>
          </div>
          <button onClick={() => onCopy(alias, 'alias')} className="shrink-0 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            {copied === 'alias' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <ol className="text-zinc-400 text-sm leading-relaxed list-decimal pl-5 space-y-1.5 mb-6">
          <li>Open your current DMARC report inbox (e.g. dmarc-reports@yourdomain.com)</li>
          <li>Go to Settings → Filters / Auto-forward</li>
          <li>Create a rule: <em>forward all messages from *@* with subject containing &quot;DMARC&quot;</em></li>
          <li>Set the forward destination to the alias above</li>
        </ol>
        <button onClick={onContinue} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
          Done, start monitoring <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (state.ingestionMethod === 'imap_oauth') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Connect your mailbox</h2>
        <p className="text-zinc-400 text-sm mb-6">Connect the inbox where DMARC reports are delivered. Inmybox will poll it periodically and process new reports automatically.</p>
        <div className="flex flex-col gap-3 mb-6">
          <a href="/api/mailbox/connect/google" className="flex items-center gap-3 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500/40 rounded-xl transition-all group">
            <span className="text-lg">🔵</span>
            <div>
              <p className="text-white text-sm font-medium">Connect with Google</p>
              <p className="text-zinc-500 text-xs">Gmail or Google Workspace inbox</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 ml-auto transition-colors" />
          </a>
          <a href="/api/mailbox/connect/microsoft" className="flex items-center gap-3 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500/40 rounded-xl transition-all group">
            <span className="text-lg">🟦</span>
            <div>
              <p className="text-white text-sm font-medium">Connect with Microsoft</p>
              <p className="text-zinc-500 text-xs">Outlook or Microsoft 365 inbox</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 ml-auto transition-colors" />
          </a>
        </div>
        <p className="text-zinc-600 text-xs text-center mb-4">— or —</p>
        <button onClick={onContinue} className="w-full text-center text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
          I&apos;ll connect via IMAP manually →
        </button>
      </div>
    )
  }

  return null
}

// ─── STEP 3: AWAITING REPORT ──────────────────────────────────────────────────

function StepAwaiting({ firstReportReceived, pollCount, onContinue }: {
  firstReportReceived: boolean
  pollCount: number
  onContinue: () => void
}) {
  if (firstReportReceived) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Your first report arrived!</h2>
        <p className="text-zinc-400 text-sm mb-6">Inmybox has processed your first DMARC aggregate report. Your dashboard is ready with real data.</p>
        <button onClick={onContinue} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
          View Dashboard →
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">Waiting for your first report</h2>
      <p className="text-zinc-400 text-sm mb-4">
        DMARC aggregate reports are sent by email providers once daily at UTC midnight.
        Once we receive one, your dashboard goes live automatically.
      </p>
      <p className="text-zinc-600 text-xs mb-6">Checking every 30 seconds… {pollCount > 0 && `(${pollCount} check${pollCount > 1 ? 's' : ''} so far)`}</p>
      <p className="text-zinc-500 text-sm">
        While waiting, you can{' '}
        <a href="/dashboard" className="text-blue-400 hover:text-blue-300 underline">explore the dashboard</a>
        {' '}with sample data.
      </p>
    </div>
  )
}

// ─── STEP 4: READY ────────────────────────────────────────────────────────────

function StepReady({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-white mb-2">You&apos;re all set!</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Inmybox is protecting your domain and monitoring your DMARC reports.
        Head to your dashboard to review your senders and action items.
      </p>
      <button onClick={onGoToDashboard} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
        Go to Dashboard →
      </button>
    </div>
  )
}
