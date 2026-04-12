'use client'

import { useState, useRef, useEffect } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  RadialBarChart, RadialBar,
  Tooltip,
} from 'recharts'
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  CheckCircle2, AlertTriangle, XCircle, Info,
  ChevronDown, ChevronUp, ArrowRight, Loader2,
  FileText, Search, Lock, Settings, Mail,
  Image,
} from 'lucide-react'
import Link from 'next/link'

/* ─── Types matching the API response ─── */
interface PillarResult {
  score: number
  maxScore: number
  percentage: number
  status: 'pass' | 'partial' | 'fail'
}

interface Finding {
  type: 'success' | 'warning' | 'error' | 'info'
  category: 'DMARC' | 'SPF' | 'DKIM' | 'Config' | 'BIMI'
  title: string
  detail: string
  recommendation?: string
}

interface ScanResult {
  domain: string
  score: number
  riskLevel: 'healthy' | 'medium' | 'high' | 'critical'
  riskLabel: string
  scanId?: string | null
  pillars: {
    dmarc: PillarResult
    spf: PillarResult
    dkim: PillarResult
    config: PillarResult
  }
  findings: Finding[]
  rawRecords: {
    dmarc: string | null
    spf: string | null
    dkim: string | null
    bimi: string | null
  }
  bimi: {
    status: 'pass' | 'partial' | 'fail'
    hasRecord: boolean
    logoUrl: string | null
    vmcUrl: string | null
    dmarcReady: boolean
  }
}

/* ─── Risk configuration ─── */
const RISK_CONFIG = {
  healthy: { color: '#10b981', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30', icon: ShieldCheck },
  medium: { color: '#f59e0b', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400', borderClass: 'border-amber-500/30', icon: ShieldAlert },
  high: { color: '#f97316', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', borderClass: 'border-orange-500/30', icon: ShieldAlert },
  critical: { color: '#ef4444', bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/30', icon: ShieldX },
}

const PILLAR_COLORS = {
  dmarc: '#6366f1',
  spf: '#10b981',
  dkim: '#f59e0b',
  config: '#8b5cf6',
}

const PILLAR_ICONS = {
  dmarc: Shield,
  spf: Lock,
  dkim: FileText,
  config: Settings,
}

const PILLAR_LABELS = {
  dmarc: 'DMARC',
  spf: 'SPF',
  dkim: 'DKIM',
  config: 'Config',
}

const FINDING_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const FINDING_COLORS = {
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  info: 'text-sky-400',
}

/* ─── Score Gauge Component ─── */
function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: ScanResult['riskLevel'] }) {
  const config = RISK_CONFIG[riskLevel]
  const data = [{ name: 'score', value: score, fill: config.color }]

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: '#1e293b' }}
            max={100}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400 mt-0.5">out of 100</span>
      </div>
    </div>
  )
}

/* ─── Donut Chart for pillar breakdown ─── */
function PillarDonut({ pillars }: { pillars: ScanResult['pillars'] }) {
  const data = [
    { name: 'DMARC', value: pillars.dmarc.score, max: pillars.dmarc.maxScore, color: PILLAR_COLORS.dmarc },
    { name: 'SPF', value: pillars.spf.score, max: pillars.spf.maxScore, color: PILLAR_COLORS.spf },
    { name: 'DKIM', value: pillars.dkim.score, max: pillars.dkim.maxScore, color: PILLAR_COLORS.dkim },
    { name: 'Config', value: pillars.config.score, max: pillars.config.maxScore, color: PILLAR_COLORS.config },
  ]

  // For the pie chart, show earned scores
  const pieData = data.map(d => ({ ...d, displayValue: d.value }))
  // Fill remaining as "gap"
  const totalEarned = data.reduce((a, d) => a + d.value, 0)
  const totalPossible = 100
  const gap = totalPossible - totalEarned

  const chartData = [
    ...pieData,
    ...(gap > 0 ? [{ name: 'Unscored', displayValue: gap, color: '#1e293b', value: gap, max: gap }] : []),
  ]

  return (
    <div className="relative w-56 h-56 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={2}
            dataKey="displayValue"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length && payload[0].name !== 'Unscored') {
                const d = payload[0].payload
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                    <span className="text-white font-medium">{d.name}</span>
                    <span className="text-slate-400 ml-2">{d.value}/{d.max} pts</span>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm text-slate-400">Breakdown</span>
        <span className="text-2xl font-bold text-white">{totalEarned}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  )
}

/* ─── Pillar Bar ─── */
function PillarBar({ name, pillar, color }: { name: string; pillar: PillarResult; color: string }) {
  const Icon = PILLAR_ICONS[name as keyof typeof PILLAR_ICONS]
  const label = PILLAR_LABELS[name as keyof typeof PILLAR_LABELS]
  const statusBadge = {
    pass: { text: 'Pass', cls: 'bg-emerald-500/10 text-emerald-400' },
    partial: { text: 'Partial', cls: 'bg-amber-500/10 text-amber-400' },
    fail: { text: 'Fail', cls: 'bg-red-500/10 text-red-400' },
  }[pillar.status]

  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{pillar.score}/{pillar.maxScore}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.text}</span>
          </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pillar.percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Findings Accordion (gated details) ─── */
function FindingsSection({ findings }: { findings: Finding[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = ['DMARC', 'SPF', 'DKIM', 'Config', 'BIMI'] as const
  const grouped = categories.map(cat => ({
    category: cat,
    items: findings.filter(f => f.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-3">
      {grouped.map(group => (
        <div key={group.category} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === group.category ? null : group.category)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{group.category}</span>
              <span className="text-xs text-slate-500">{group.items.length} finding{group.items.length > 1 ? 's' : ''}</span>
            </div>
            {expanded === group.category
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />
            }
          </button>
          {expanded === group.category && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
              {group.items.map((finding, i) => {
                const Icon = FINDING_ICONS[finding.type]
                const colorCls = FINDING_COLORS[finding.type]
                return (
                  <div key={i} className="flex gap-3 pt-3">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorCls}`} />
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium">{finding.title}</div>
                      {/* Detail blurred — gated */}
                      <div className="relative mt-1">
                        <div className="text-xs text-slate-400 leading-relaxed select-none blur-[6px] pointer-events-none" aria-hidden>
                          {finding.detail}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-medium text-brand-300 hover:text-brand-200 hover:border-brand-500/40 transition-all"
                          >
                            <Lock className="w-3 h-3" />
                            Unlock details
                          </Link>
                        </div>
                      </div>
                      {finding.recommendation && (
                        <div className="relative mt-2">
                          <div className="flex gap-2 items-start select-none blur-[6px] pointer-events-none" aria-hidden>
                            <ArrowRight className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-brand-300">{finding.recommendation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Raw Records Panel (locked) ─── */
function RawRecords() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">Raw DNS Records</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3 h-3" />
          Pro feature
        </span>
      </div>
      <div className="px-4 pb-4 border-t border-slate-800 pt-3">
        <div className="relative">
          {/* Blurred preview */}
          <div className="space-y-3 select-none blur-[6px] pointer-events-none" aria-hidden>
            <div>
              <div className="text-xs text-slate-500 mb-1">DMARC (_dmarc.)</div>
              <div className="bg-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-slate-300">v=DMARC1; p=reject; rua=mailto:...</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">SPF (TXT)</div>
              <div className="bg-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-slate-300">v=spf1 include:_spf.google.com ~all</div>
            </div>
          </div>
          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-xl">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
            >
              <Lock className="w-3.5 h-3.5" />
              Upgrade to View Records
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Scoring Methodology Panel ─── */
function ScoringMethodology() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-white">How We Score Your Domain</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-5 border-t border-slate-800 pt-4 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Our Domain Health Score is calculated from 4 weighted pillars, totaling 100 points.
            Each pillar evaluates a specific layer of your email authentication setup via live DNS lookups.
          </p>

          {/* DMARC */}
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PILLAR_COLORS.dmarc }} />
              DMARC (35 points)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-500 font-medium">Check</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Points</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-slate-800/50">
                  <tr><td className="py-1.5">Record exists</td><td className="py-1.5 text-white font-medium">10</td><td className="py-1.5">_dmarc.domain has v=DMARC1</td></tr>
                  <tr><td className="py-1.5">Policy strength</td><td className="py-1.5 text-white font-medium">5–15</td><td className="py-1.5">p=reject (15) · p=quarantine (10) · p=none (5)</td></tr>
                  <tr><td className="py-1.5">Subdomain policy</td><td className="py-1.5 text-white font-medium">5</td><td className="py-1.5">sp= tag is explicitly set</td></tr>
                  <tr><td className="py-1.5">Aggregate reporting</td><td className="py-1.5 text-white font-medium">5</td><td className="py-1.5">rua= tag is configured</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SPF */}
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PILLAR_COLORS.spf }} />
              SPF (30 points)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-500 font-medium">Check</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Points</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-slate-800/50">
                  <tr><td className="py-1.5">Record exists</td><td className="py-1.5 text-white font-medium">15</td><td className="py-1.5">TXT record starts with v=spf1</td></tr>
                  <tr><td className="py-1.5">Fail mechanism</td><td className="py-1.5 text-white font-medium">3–10</td><td className="py-1.5">-all (10) · ~all (7) · ?all (3) · +all (0)</td></tr>
                  <tr><td className="py-1.5">Lookup complexity</td><td className="py-1.5 text-white font-medium">0–5</td><td className="py-1.5">≤8 lookups (5) · 9-10 (3) · &gt;10 (0)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DKIM */}
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PILLAR_COLORS.dkim }} />
              DKIM (25 points)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-500 font-medium">Check</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Points</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-slate-800/50">
                  <tr><td className="py-1.5">Public key found</td><td className="py-1.5 text-white font-medium">25</td><td className="py-1.5">v=DKIM1 record at selector._domainkey.domain</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Checks 12 common selectors: default, google, selector1, selector2, k1, s1, s2, mail, dkim, mandrill, sm1, sm2
            </p>
          </div>

          {/* Config */}
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PILLAR_COLORS.config }} />
              Configuration Bonus (10 points)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-500 font-medium">Check</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Points</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-slate-800/50">
                  <tr><td className="py-1.5">Strict alignment</td><td className="py-1.5 text-white font-medium">2–5</td><td className="py-1.5">adkim=s or aspf=s (5) · relaxed (2)</td></tr>
                  <tr><td className="py-1.5">Policy coverage</td><td className="py-1.5 text-white font-medium">1–5</td><td className="py-1.5">pct=100 or absent (5) · ≥50 (3) · &gt;0 (1)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk classification */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">BIMI (Bonus Indicator)</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              BIMI (Brand Indicators for Message Identification) is not part of the 100-point score but is checked as a brand readiness indicator.
              It allows your brand logo to appear next to emails in supporting clients like Gmail and Apple Mail.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-500 font-medium">Check</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Requirement</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400 divide-y divide-slate-800/50">
                  <tr><td className="py-1.5">BIMI record</td><td className="py-1.5 text-white font-medium">Required</td><td className="py-1.5">v=BIMI1 at default._bimi.domain</td></tr>
                  <tr><td className="py-1.5">Logo URL (l=)</td><td className="py-1.5 text-white font-medium">Required</td><td className="py-1.5">URL to SVG Tiny P/S logo file</td></tr>
                  <tr><td className="py-1.5">VMC Certificate (a=)</td><td className="py-1.5 text-white font-medium">Optional*</td><td className="py-1.5">Required for Gmail / Apple Mail display</td></tr>
                  <tr><td className="py-1.5">DMARC enforcement</td><td className="py-1.5 text-white font-medium">Required</td><td className="py-1.5">p=quarantine or p=reject</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk classification */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Risk Classification</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Healthy', range: '85 – 100', color: RISK_CONFIG.healthy.color },
                { label: 'Medium', range: '60 – 84', color: RISK_CONFIG.medium.color },
                { label: 'High Risk', range: '30 – 59', color: RISK_CONFIG.high.color },
                { label: 'Critical', range: '0 – 29', color: RISK_CONFIG.critical.color },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <div>
                    <div className="text-xs text-white font-medium">{r.label}</div>
                    <div className="text-xs text-slate-500">{r.range}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — DomainScanner
   ═══════════════════════════════════════════════════════════════ */
export function DomainScanner() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleScan = async () => {
    const d = domain.trim().toLowerCase()
    if (!d) return

    // Basic client-side validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(d)) {
      setError('Please enter a valid domain (e.g. example.com)')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)
    setLeadSubmitted(false)
    setLeadEmail('')

    try {
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(d)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Scan failed')
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitLead = async () => {
    if (!result?.scanId || !leadEmail.includes('@')) return
    setLeadLoading(true)
    try {
      await fetch('/api/scan/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: result.scanId, email: leadEmail }),
      })
      setLeadSubmitted(true)
    } catch {
      // silently fail — non-critical
    } finally {
      setLeadLoading(false)
    }
  }

  // Scroll to results when they load
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan()
  }

  const risk = result ? RISK_CONFIG[result.riskLevel] : null
  const RiskIcon = risk?.icon || Shield

  return (
    <div>
      {/* ── Scanner Input ── */}
      <div className="max-w-lg mx-auto lg:mx-0 mb-8">
        <div className="glow-input flex items-center bg-slate-900/80 border border-slate-700 rounded-xl p-1.5 focus-within:border-brand-500/50 transition-all">
          <div className="flex items-center gap-2 px-3 text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your domain (e.g. acme.com)"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none py-2.5"
            disabled={loading}
          />
          <button
            onClick={handleScan}
            disabled={loading || !domain.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                Scan Domain
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center lg:text-left">
          Free scan · No signup required · Results in seconds
        </p>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── Results Panel ── */}
      {result && (
        <div ref={resultRef} className="max-w-5xl mx-auto lg:mx-0 scroll-mt-24">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-brand-500/5">
            {/* Header */}
            <div className={`px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${risk!.bgClass} border ${risk!.borderClass} flex items-center justify-center`}>
                  <RiskIcon className={`w-6 h-6 ${risk!.textClass}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{result.domain}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-sm font-semibold ${risk!.textClass}`}>{result.riskLabel}</span>
                    <span className="text-xs text-slate-500">· Score {result.score}/100</span>
                  </div>
                </div>
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 shrink-0"
              >
                Get Full Monitoring
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-6 space-y-8">
              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Score Gauge */}
                <div className="text-center">
                  <h4 className="text-sm text-slate-400 font-medium mb-4">Domain Health Score</h4>
                  <ScoreGauge score={result.score} riskLevel={result.riskLevel} />
                  <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${risk!.bgClass} border ${risk!.borderClass}`}>
                    <RiskIcon className={`w-4 h-4 ${risk!.textClass}`} />
                    <span className={`text-sm font-semibold ${risk!.textClass}`}>{result.riskLabel}</span>
                  </div>
                </div>

                {/* Pillar Breakdown Donut */}
                <div className="text-center">
                  <h4 className="text-sm text-slate-400 font-medium mb-4">Score Breakdown</h4>
                  <PillarDonut pillars={result.pillars} />
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {Object.entries(PILLAR_COLORS).map(([key, color]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="text-xs text-slate-400">{PILLAR_LABELS[key as keyof typeof PILLAR_LABELS]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pillar Bars */}
              <div>
                <h4 className="text-sm text-slate-400 font-medium mb-4">Pillar Scores</h4>
                <div className="space-y-4">
                  {(Object.entries(result.pillars) as [string, PillarResult][]).map(([name, pillar]) => (
                    <PillarBar
                      key={name}
                      name={name}
                      pillar={pillar}
                      color={PILLAR_COLORS[name as keyof typeof PILLAR_COLORS]}
                    />
                  ))}
                </div>
              </div>

              {/* BIMI Status */}
              {result.bimi && (
                <div>
                  <h4 className="text-sm text-slate-400 font-medium mb-4">BIMI (Brand Logo in Email)</h4>
                  <div className={`rounded-xl border p-5 ${
                    result.bimi.status === 'pass'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : result.bimi.status === 'partial'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-slate-700 bg-slate-900/50'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        result.bimi.status === 'pass'
                          ? 'bg-emerald-500/10'
                          : result.bimi.status === 'partial'
                          ? 'bg-amber-500/10'
                          : 'bg-slate-800'
                      }`}>
                        <Image className={`w-5 h-5 ${
                          result.bimi.status === 'pass'
                            ? 'text-emerald-400'
                            : result.bimi.status === 'partial'
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-white">BIMI Status</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            result.bimi.status === 'pass'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : result.bimi.status === 'partial'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {result.bimi.status === 'pass' ? 'Configured' : result.bimi.status === 'partial' ? 'Incomplete' : 'Not Set Up'}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            {result.bimi.hasRecord
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            }
                            <span className="text-xs text-slate-300">BIMI Record</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.bimi.logoUrl
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            }
                            <span className="text-xs text-slate-300">Logo (SVG)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.bimi.vmcUrl
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            }
                            <span className="text-xs text-slate-300">VMC Certificate</span>
                          </div>
                        </div>
                        {!result.bimi.dmarcReady && (
                          <p className="text-xs text-amber-400/80 mt-2">
                            ⚠ DMARC policy must be quarantine or reject for BIMI to work
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Findings */}
              <div>
                <h4 className="text-sm text-slate-400 font-medium mb-4">Detailed Findings</h4>
                <FindingsSection findings={result.findings} />
              </div>

              {/* Raw Records (locked) */}
              <RawRecords />

              {/* Scoring Methodology */}
              <ScoringMethodology />

              {/* Email Capture */}
              {result.scanId && !leadSubmitted && (
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-brand-400" />
                        Get your full report emailed
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        We&apos;ll send a detailed PDF report with recommendations to your inbox.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={e => setLeadEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="flex-1 sm:w-56 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && leadEmail.includes('@')) {
                            e.preventDefault()
                            submitLead()
                          }
                        }}
                      />
                      <button
                        onClick={submitLead}
                        disabled={leadLoading || !leadEmail.includes('@')}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {leadLoading ? 'Sending...' : 'Send Report'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {leadSubmitted && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-300 font-medium">Report sent!</p>
                    <p className="text-xs text-slate-400">Check your inbox for the full domain health report.</p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-brand-600/10 to-brand-500/5 rounded-xl border border-brand-500/20 p-6 text-center">
                <h4 className="text-lg font-bold text-white mb-2">
                  Your domain has issues. Let&apos;s fix them together.
                </h4>
                <p className="text-sm text-slate-400 mb-5 max-w-lg mx-auto">
                  Our email deliverability experts will review your scan, explain every finding,
                  and create a step-by-step remediation plan — no obligation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
                  >
                    See Plans & Pricing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="mailto:hello@inmybox.io?subject=Domain%20Scan%20Follow-up"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-brand-500/30 text-brand-300 hover:text-white hover:border-brand-400/50 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Talk to an Expert
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
