'use client'

// INMYBOX SCANNER — 2026-05-12
// Working domain scanner UI for landing page hero.
// Calls GET /api/scan?domain=... and renders results inline.

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react'

type Status = 'pass' | 'warning' | 'critical'

type ScanResult = {
  domain: string
  score: number
  risk: 'critical' | 'medium' | 'good' | 'excellent'
  dmarc: { found: boolean; policy?: 'none' | 'quarantine' | 'reject'; rua?: string; record?: string; status: Status }
  spf: { found: boolean; lookupCount?: number; record?: string; status: Status }
  dkim: { found: boolean; selectors: string[]; status: Status }
  mx: { found: boolean; servers: string[]; status: Status }
  subdomains: Array<{
    name: string
    exists: true
    dmarc: { found: boolean; policy?: string; status: Status }
    spf: { found: boolean; status: Status }
  }>
  recommendations: string[]
  scannedAt: string
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="pass" />
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-label="warning" />
  return <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-label="critical" />
}

const RISK_COPY: Record<ScanResult['risk'], { label: string; tone: string; ring: string; text: string }> = {
  critical:  { label: 'Critical',     tone: 'bg-rose-500',     ring: 'ring-rose-500/30',     text: 'text-rose-400' },
  medium:    { label: 'Medium Risk',  tone: 'bg-amber-500',    ring: 'ring-amber-500/30',    text: 'text-amber-400' },
  good:      { label: 'Good',         tone: 'bg-emerald-500',  ring: 'ring-emerald-500/30',  text: 'text-emerald-400' },
  excellent: { label: 'Excellent',    tone: 'bg-emerald-400',  ring: 'ring-emerald-400/30',  text: 'text-emerald-300' },
}

function ScoreGauge({ score, risk }: { score: number; risk: ScanResult['risk'] }) {
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c
  const stroke =
    risk === 'critical' ? '#f43f5e' :
    risk === 'medium' ? '#f59e0b' :
    risk === 'good' ? '#10b981' :
    '#34d399'
  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="48" cy="48" r={r}
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

function validateInputClient(raw: string): { ok: true; domain: string } | { ok: false; error: string } {
  let d = raw.trim().toLowerCase()
  d = d.replace(/^https?:\/\//, '')
  d = d.split('/')[0] ?? ''
  d = d.split('?')[0] ?? ''
  if (!d) return { ok: false, error: 'Please enter a valid domain (e.g. yourcompany.com)' }
  if (/\s/.test(d)) return { ok: false, error: 'Please enter a valid domain (e.g. yourcompany.com)' }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return { ok: false, error: 'Please enter a valid domain (e.g. yourcompany.com)' }
  return { ok: true, domain: d }
}

export function DomainScanner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function runScan() {
    setError(null)
    const v = validateInputClient(input)
    if (!v.ok) {
      setError(v.error)
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(v.domain)}`, { method: 'GET' })
      if (res.status === 429) {
        setError('Too many scans — please wait a moment and try again.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError((data && data.error) || 'Scan failed — please try again.')
        return
      }
      const data = (await res.json()) as ScanResult
      setResult(data)
    } catch {
      setError('Scan failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void runScan()
  }

  function reset() {
    setResult(null)
    setError(null)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="w-full">
      <div className="text-[13px] font-semibold tracking-wide text-zinc-300 mb-2">
        Enter your domain to check your email health
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl ember-glass border border-white/10"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter any domain — e.g. yourcompany.com"
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
          autoComplete="off"
          spellCheck={false}
          aria-label="Domain to scan"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span>Scan Free →</span>
            </>
          )}
        </button>
      </form>

      {/* Inline error */}
      {error && !loading && (
        <div className="mt-2 text-[12px] text-rose-400">{error}</div>
      )}

      {/* Loading pulse */}
      {loading && <LoadingPulse />}

      {/* Helper text when idle */}
      {!loading && !result && !error && (
        <div className="text-[11px] text-zinc-500 mt-2">
          Free assessment · no signup required
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-4 animate-[slideDown_400ms_ease-out]">
          <ResultsCard result={result} onReset={reset} />
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function LoadingPulse() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % 4), 600)
    return () => clearInterval(id)
  }, [])
  const labels = ['Checking DMARC...', 'SPF...', 'DKIM...', 'Subdomains...']
  return (
    <div className="mt-3 flex items-center gap-2 text-[12px] text-zinc-400">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            style={{
              opacity: 0.3 + ((phase + i) % 4) * 0.2,
              transition: 'opacity 300ms',
            }}
          />
        ))}
      </span>
      <span>{labels.join(' ')}</span>
    </div>
  )
}

function ResultsCard({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  const riskCfg = RISK_COPY[result.risk]
  const unprotected = result.subdomains.filter((s) => !s.dmarc.found).length
  const showSubdomains = result.subdomains.length > 0

  const dmarcLabel = !result.dmarc.found
    ? 'Missing — domain not protected'
    : result.dmarc.policy === 'reject'
      ? 'p=reject — fully enforcing'
      : result.dmarc.policy === 'quarantine'
        ? 'p=quarantine — sending to spam'
        : 'p=none — Not enforcing'

  const spfLabel = !result.spf.found
    ? 'Missing — no SPF record'
    : (result.spf.lookupCount ?? 0) > 10
      ? `Over 10 lookups (${result.spf.lookupCount}/10)`
      : `Valid (${result.spf.lookupCount ?? 0}/10 lookups used)`

  const dkimLabel = !result.dkim.found
    ? 'Missing on common selectors'
    : `Found (${result.dkim.selectors.join(', ')} selector${result.dkim.selectors.length > 1 ? 's' : ''})`

  const mxLabel = !result.mx.found
    ? 'No mail servers configured'
    : `${result.mx.servers.length} mail server${result.mx.servers.length === 1 ? '' : 's'} configured`

  return (
    <div className="rounded-2xl ember-glass border border-white/10 p-5 sm:p-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">Scan Results</div>
          <div className="text-lg sm:text-xl font-semibold text-white truncate">{result.domain}</div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreGauge score={result.score} risk={result.risk} />
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Score</span>
            <span className="text-sm font-semibold text-white">{result.score}/100</span>
            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${riskCfg.text} mt-1`}>
              <span className={`w-2 h-2 rounded-full ${riskCfg.tone}`} />
              {riskCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Domain authentication */}
      <Divider label="Domain Authentication" />
      <div className="space-y-2">
        <RowStatus label="DMARC" status={result.dmarc.status} detail={dmarcLabel} />
        <RowStatus label="SPF"   status={result.spf.status}   detail={spfLabel} />
        <RowStatus label="DKIM"  status={result.dkim.status}  detail={dkimLabel} />
        <RowStatus label="MX"    status={result.mx.status}    detail={mxLabel} />
      </div>

      {/* Subdomain exposure */}
      {showSubdomains && (
        <>
          <Divider label="Subdomain Exposure" />
          <div className="space-y-1.5">
            {result.subdomains.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 text-[13px] text-zinc-300">
                <span className="truncate">{s.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-zinc-500 text-[11px]">DMARC</span>
                    <StatusIcon status={s.dmarc.status} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-zinc-500 text-[11px]">SPF</span>
                    <StatusIcon status={s.spf.status} />
                  </span>
                </span>
              </div>
            ))}
          </div>
          {unprotected > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 text-[12px] text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {unprotected} subdomain{unprotected === 1 ? ' is' : 's are'} unprotected
            </div>
          )}
        </>
      )}

      {/* What this means */}
      {result.recommendations.length > 0 && (
        <>
          <Divider label="What This Means" />
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-zinc-300 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* CTA */}
      <div className="mt-5">
        <Link
          href={`/demo?domain=${encodeURIComponent(result.domain)}`}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
        >
          <span>Get Your Free Full Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="mt-2 text-center text-[11px] text-zinc-500">
          We&apos;ll fix everything — one time. No monthly fees. No lock-in.
        </div>
      </div>

      {/* Scan another */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] text-zinc-400 hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
        >
          Scan another domain
        </button>
      </div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}

function RowStatus({ label, status, detail }: { label: string; status: Status; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-semibold text-zinc-200 w-16 shrink-0">{label}</span>
      <span className="flex items-center gap-2 text-[13px] text-zinc-300 min-w-0">
        <StatusIcon status={status} />
        <span className="truncate">{detail}</span>
      </span>
    </div>
  )
}
