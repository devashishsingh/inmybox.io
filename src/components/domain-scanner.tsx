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
  Image, DollarSign, TrendingDown, BarChart3, Zap,
  Globe, Upload, Plus, Minus, RefreshCw, Layers,
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

interface RevenueImpact {
  per100: {
    delivered: number
    spam: number
    rejected: number
    deliveryRate: number
  }
  monthly: {
    emailVolume: number
    emailsLost: number
    potentialLeadsLost: number
    revenueAtRisk: number
  }
  assumptions: {
    avgLeadValue: number
    conversionRate: number
    monthlyVolume: number
  }
  riskFactors: {
    factor: string
    impact: 'critical' | 'high' | 'medium' | 'low'
    description: string
  }[]
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
  revenueImpact?: RevenueImpact
}

/* ─── Risk configuration ─── */

/* ─── Subdomain / multi-domain types ─── */
interface DiscoveredSubdomain {
  subdomain: string
  fqdn: string
  hasMx: boolean
  hasSpf: boolean
  hasDmarc: boolean
  mxRecords: string[]
  emailActive: boolean
}

interface MultiScanResult {
  domain: string
  error: string | null
  result: ScanResult | null
}

interface AggregateResult {
  domainsScanned: number
  domainsFailed: number
  averageScore: number
  worstRiskLevel: 'healthy' | 'medium' | 'high' | 'critical'
  riskDistribution: { critical: number; high: number; medium: number; healthy: number }
  totalEmailsLost: number
  totalLeadsLost: number
  totalRevenueAtRisk: number
  totalRevenueAtRiskYearly: number
  riskFactors: { factor: string; impact: string; description: string; domains: string[] }[]
}

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
// INMYBOX HERO ENHANCEMENT — Scanner with calculator tie-in
export function DomainScanner({ onScanResult, calcRevenueLost }: { onScanResult?: (hasResult: boolean) => void; calcRevenueLost?: number } = {}) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  // ── Subdomain / multi-domain expansion state ──
  const [expandMode, setExpandMode] = useState<'closed' | 'discover' | 'import'>('closed')
  const [discovering, setDiscovering] = useState(false)
  const [discoveredSubs, setDiscoveredSubs] = useState<DiscoveredSubdomain[]>([])
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [importedDomains, setImportedDomains] = useState<string[]>([])
  const [batchScanning, setBatchScanning] = useState(false)
  const [batchResults, setBatchResults] = useState<MultiScanResult[] | null>(null)
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aggregateRef = useRef<HTMLDivElement>(null)

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
      onScanResult?.(true)
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

  // ── Subdomain auto-discovery ──
  const discoverSubdomains = async () => {
    if (!result) return
    setDiscovering(true)
    setDiscoveredSubs([])
    setSelectedDomains(new Set())
    try {
      const res = await fetch(`/api/scan/subdomains?domain=${encodeURIComponent(result.domain)}`)
      const data = await res.json()
      if (res.ok && data.discovered) {
        setDiscoveredSubs(data.discovered)
        // Auto-select all discovered
        setSelectedDomains(new Set(data.discovered.map((s: DiscoveredSubdomain) => s.fqdn)))
      }
    } catch {
      // non-critical
    } finally {
      setDiscovering(false)
    }
  }

  // ── File import handler ──
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Only accept .txt files under 50KB
    if (!file.name.endsWith('.txt') && !file.type.includes('text')) {
      setError('Please upload a .txt file with one domain per line')
      return
    }
    if (file.size > 50 * 1024) {
      setError('File too large (max 50KB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text
        .split(/[\r\n]+/)
        .map(l => l.trim().toLowerCase())
        .filter(l => l.length > 0 && /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(l))

      const unique = Array.from(new Set(lines)).slice(0, 20) // Cap at 20
      setImportedDomains(unique)
      setSelectedDomains(new Set(unique))
      setError('')
    }
    reader.readAsText(file)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Batch scan selected domains ──
  const runBatchScan = async () => {
    const domains = Array.from(selectedDomains)
    if (domains.length === 0) return

    setBatchScanning(true)
    setBatchResults(null)
    setAggregate(null)

    try {
      const res = await fetch('/api/scan/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains }),
      })
      const data = await res.json()
      if (res.ok) {
        setBatchResults(data.results)
        setAggregate(data.aggregate)
      }
    } catch {
      setError('Batch scan failed. Please try again.')
    } finally {
      setBatchScanning(false)
    }
  }

  // Toggle domain selection
  const toggleDomain = (fqdn: string) => {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      if (next.has(fqdn)) next.delete(fqdn)
      else next.add(fqdn)
      return next
    })
  }

  // Scroll to results when they load
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  // Scroll to aggregate results when batch scan completes
  useEffect(() => {
    if (aggregate && aggregateRef.current) {
      aggregateRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [aggregate])

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
            placeholder="yourdomain.com"
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
        <div ref={resultRef} className="w-full scroll-mt-24">
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
              {/* INMYBOX HERO ENHANCEMENT — Calculator tie-in banner */}
              {calcRevenueLost != null && calcRevenueLost > 0 && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300 font-medium">
                      Based on your email volume above, you may be losing ~${calcRevenueLost.toLocaleString()}/mo in revenue.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Fix this in 2 minutes with Inmybox monitoring.
                    </p>
                  </div>
                </div>
              )}

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

              {/* ═══ Revenue Impact Section ═══ */}
              {result.revenueImpact && (
                <div>
                  <h4 className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenue Impact Analysis
                  </h4>

                  {/* Per-100 Emails Visual */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-semibold text-white">For Every 100 Emails You Send</span>
                    </div>

                    {/* Email flow bars */}
                    <div className="space-y-3 mb-5">
                      {/* Delivered */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Reach Inbox
                          </span>
                          <span className="text-sm font-bold text-emerald-400">{result.revenueImpact.per100.delivered}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                            style={{ width: `${result.revenueImpact.per100.delivered}%` }}
                          />
                        </div>
                      </div>

                      {/* Spam */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Land in Spam
                          </span>
                          <span className="text-sm font-bold text-amber-400">{result.revenueImpact.per100.spam}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
                            style={{ width: `${result.revenueImpact.per100.spam}%` }}
                          />
                        </div>
                      </div>

                      {/* Rejected */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                            <XCircle className="w-3 h-3" />
                            Rejected / Bounced
                          </span>
                          <span className="text-sm font-bold text-red-400">{result.revenueImpact.per100.rejected}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000"
                            style={{ width: `${result.revenueImpact.per100.rejected}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery rate badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                      result.revenueImpact.per100.deliveryRate >= 90
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : result.revenueImpact.per100.deliveryRate >= 70
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">
                        {result.revenueImpact.per100.deliveryRate}% Delivery Rate
                      </span>
                    </div>
                  </div>

                  {/* Monthly Revenue Impact Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Monthly Volume</div>
                      <div className="text-lg font-bold text-white">
                        {result.revenueImpact.monthly.emailVolume.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">emails</div>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Emails Lost</div>
                      <div className="text-lg font-bold text-amber-400">
                        {result.revenueImpact.monthly.emailsLost.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">spam + rejected</div>
                    </div>
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Leads Lost</div>
                      <div className="text-lg font-bold text-orange-400">
                        {result.revenueImpact.monthly.potentialLeadsLost}
                      </div>
                      <div className="text-xs text-slate-500">@ {result.revenueImpact.assumptions.conversionRate}% conv.</div>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Revenue at Risk</div>
                      <div className="text-lg font-bold text-red-400">
                        ${result.revenueImpact.monthly.revenueAtRisk.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">/month</div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {result.revenueImpact.riskFactors.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-white">Deliverability Risk Factors</span>
                      </div>
                      <div className="space-y-3">
                        {result.revenueImpact.riskFactors.map((rf, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                              rf.impact === 'critical' ? 'bg-red-400' :
                              rf.impact === 'high' ? 'bg-orange-400' :
                              rf.impact === 'medium' ? 'bg-amber-400' :
                              'bg-emerald-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{rf.factor}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  rf.impact === 'critical' ? 'bg-red-500/10 text-red-400' :
                                  rf.impact === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                  rf.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {rf.impact}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{rf.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assumptions footnote */}
                  <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" />
                    Based on {result.revenueImpact.assumptions.monthlyVolume.toLocaleString()} emails/mo,{' '}
                    {result.revenueImpact.assumptions.conversionRate}% conversion, ${result.revenueImpact.assumptions.avgLeadValue} avg. lead value.
                    Actual results depend on content, sender reputation, and recipient engagement.
                  </p>
                </div>
              )}

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

              {/* ═══ Subdomain / Multi-Domain Expansion ═══ */}
              <div className="rounded-xl border border-brand-500/20 bg-gradient-to-b from-brand-500/5 to-transparent overflow-hidden">
                {/* Expansion Header */}
                <button
                  onClick={() => setExpandMode(expandMode === 'closed' ? 'discover' : 'closed')}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-brand-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">Expand Your Scan</div>
                      <div className="text-xs text-slate-400">Discover subdomains or import a domain list for full portfolio visibility</div>
                    </div>
                  </div>
                  {expandMode === 'closed'
                    ? <ChevronDown className="w-5 h-5 text-slate-500" />
                    : <ChevronUp className="w-5 h-5 text-slate-500" />
                  }
                </button>

                {expandMode !== 'closed' && (
                  <div className="px-5 pb-5 border-t border-slate-800 pt-4">
                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-5">
                      <button
                        onClick={() => { setExpandMode('discover'); if (discoveredSubs.length === 0) discoverSubdomains() }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                          expandMode === 'discover'
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                            : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Auto-Discover Subdomains
                      </button>
                      <button
                        onClick={() => setExpandMode('import')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                          expandMode === 'import'
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                            : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Import Domain List
                      </button>
                    </div>

                    {/* ── Auto-Discover Tab ── */}
                    {expandMode === 'discover' && (
                      <div>
                        {discovering ? (
                          <div className="flex items-center gap-3 py-6 justify-center">
                            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                            <span className="text-sm text-slate-400">Checking common subdomains for MX records...</span>
                          </div>
                        ) : discoveredSubs.length === 0 ? (
                          <div className="text-center py-6">
                            <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No email-active subdomains found for <span className="text-white font-medium">{result.domain}</span></p>
                            <p className="text-xs text-slate-500 mt-1">You can still import a custom domain list below</p>
                            <button
                              onClick={discoverSubdomains}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-slate-400">
                                Found <span className="text-brand-400 font-semibold">{discoveredSubs.length}</span> email-active subdomain{discoveredSubs.length !== 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={() => {
                                  if (selectedDomains.size === discoveredSubs.length) setSelectedDomains(new Set())
                                  else setSelectedDomains(new Set(discoveredSubs.map(s => s.fqdn)))
                                }}
                                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                              >
                                {selectedDomains.size === discoveredSubs.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {discoveredSubs.map(sub => (
                                <label
                                  key={sub.fqdn}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedDomains.has(sub.fqdn)
                                      ? 'bg-brand-500/5 border-brand-500/30'
                                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedDomains.has(sub.fqdn)}
                                    onChange={() => toggleDomain(sub.fqdn)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500/30"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white font-medium">{sub.fqdn}</div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      {sub.hasMx && (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> MX
                                        </span>
                                      )}
                                      {sub.hasSpf && (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> SPF
                                        </span>
                                      )}
                                      {sub.hasDmarc && (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> DMARC
                                        </span>
                                      )}
                                      {!sub.hasDmarc && (
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                          <XCircle className="w-3 h-3" /> No DMARC
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Import Tab ── */}
                    {expandMode === 'import' && (
                      <div>
                        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center mb-4">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-300 mb-1">Upload a <span className="text-white font-medium">.txt</span> file</p>
                          <p className="text-xs text-slate-500 mb-3">One domain per line · Max 20 domains · Example:</p>
                          <div className="inline-block bg-slate-800/80 rounded-lg px-4 py-2 font-mono text-xs text-slate-400 text-left mb-4">
                            mail.example.com<br />
                            shop.example.com<br />
                            blog.example.com<br />
                            another-domain.io
                          </div>
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".txt,text/plain"
                              onChange={handleFileImport}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Choose File
                            </button>
                          </div>
                        </div>

                        {importedDomains.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-slate-400">
                                Imported <span className="text-brand-400 font-semibold">{importedDomains.length}</span> domain{importedDomains.length !== 1 ? 's' : ''}
                              </span>
                              <button
                                onClick={() => {
                                  if (selectedDomains.size === importedDomains.length) setSelectedDomains(new Set())
                                  else setSelectedDomains(new Set(importedDomains))
                                }}
                                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                              >
                                {selectedDomains.size === importedDomains.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {importedDomains.map(d => (
                                <label
                                  key={d}
                                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                    selectedDomains.has(d)
                                      ? 'bg-brand-500/5 border-brand-500/30'
                                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedDomains.has(d)}
                                    onChange={() => toggleDomain(d)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500/30"
                                  />
                                  <span className="text-sm text-white font-medium">{d}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Scan Selected Button ── */}
                    {selectedDomains.size > 0 && (
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {selectedDomains.size} domain{selectedDomains.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={runBatchScan}
                          disabled={batchScanning}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {batchScanning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Scanning {selectedDomains.size} domain{selectedDomains.size !== 1 ? 's' : ''}...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              Scan {selectedDomains.size} Domain{selectedDomains.size !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ═══ Aggregate Multi-Domain Results ═══ */}
              {aggregate && batchResults && (
                <div ref={aggregateRef} className="scroll-mt-24 space-y-6">
                  {/* Aggregate Header */}
                  <div className="rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-600/10 to-brand-500/5 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-brand-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Portfolio Health Summary</h4>
                        <p className="text-xs text-slate-400">{aggregate.domainsScanned} domain{aggregate.domainsScanned !== 1 ? 's' : ''} scanned</p>
                      </div>
                    </div>

                    {/* Risk Distribution */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {([
                        { key: 'critical', label: 'Critical', color: '#ef4444', bgCls: 'bg-red-500/10 border-red-500/30' },
                        { key: 'high', label: 'High Risk', color: '#f97316', bgCls: 'bg-orange-500/10 border-orange-500/30' },
                        { key: 'medium', label: 'Medium', color: '#f59e0b', bgCls: 'bg-amber-500/10 border-amber-500/30' },
                        { key: 'healthy', label: 'Healthy', color: '#10b981', bgCls: 'bg-emerald-500/10 border-emerald-500/30' },
                      ] as const).map(r => (
                        <div key={r.key} className={`rounded-lg border p-3 text-center ${r.bgCls}`}>
                          <div className="text-lg font-bold" style={{ color: r.color }}>
                            {aggregate.riskDistribution[r.key]}
                          </div>
                          <div className="text-[11px] text-slate-400">{r.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Aggregate Revenue Impact */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-3 text-center">
                        <div className="text-[11px] text-slate-500 mb-0.5">Avg. Score</div>
                        <div className="text-lg font-bold text-white">{aggregate.averageScore}/100</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 border border-amber-500/20 p-3 text-center">
                        <div className="text-[11px] text-slate-500 mb-0.5">Total Emails Lost</div>
                        <div className="text-lg font-bold text-amber-400">{aggregate.totalEmailsLost.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 border border-red-500/20 p-3 text-center">
                        <div className="text-[11px] text-slate-500 mb-0.5">Revenue at Risk</div>
                        <div className="text-lg font-bold text-red-400">${aggregate.totalRevenueAtRisk.toLocaleString()}/mo</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 border border-red-500/20 p-3 text-center">
                        <div className="text-[11px] text-slate-500 mb-0.5">Annual Risk</div>
                        <div className="text-lg font-bold text-red-400">${aggregate.totalRevenueAtRiskYearly.toLocaleString()}/yr</div>
                      </div>
                    </div>
                  </div>

                  {/* Per-Domain Results Table */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Per-Domain Breakdown</span>
                      <span className="text-xs text-slate-500">{batchResults.filter(r => r.result).length} successful</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {batchResults.map((br, i) => {
                        if (!br.result) {
                          return (
                            <div key={i} className="px-5 py-3 flex items-center justify-between">
                              <span className="text-sm text-slate-400">{br.domain}</span>
                              <span className="text-xs text-red-400">Scan failed</span>
                            </div>
                          )
                        }
                        const r = br.result
                        const cfg = RISK_CONFIG[r.riskLevel]
                        const Icon = cfg.icon
                        return (
                          <div key={i} className="px-5 py-3 flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgClass}`}>
                              <Icon className={`w-4 h-4 ${cfg.textClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium truncate">{r.domain}</div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className={`text-xs font-medium ${cfg.textClass}`}>{r.riskLabel}</span>
                                <span className="text-xs text-slate-500">Score {r.score}/100</span>
                              </div>
                            </div>
                            {/* Pillar mini badges */}
                            <div className="hidden sm:flex items-center gap-1.5">
                              {(Object.entries(r.pillars) as [string, PillarResult][]).map(([name, p]) => (
                                <div
                                  key={name}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    p.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400' :
                                    p.status === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}
                                >
                                  {PILLAR_LABELS[name as keyof typeof PILLAR_LABELS]}
                                </div>
                              ))}
                            </div>
                            {/* Revenue at risk */}
                            {r.revenueImpact && (
                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-red-400">
                                  ${r.revenueImpact.monthly.revenueAtRisk.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-500">/month at risk</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Aggregate Risk Factors */}
                  {aggregate.riskFactors.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-white">Cross-Domain Risk Factors</span>
                      </div>
                      <div className="space-y-3">
                        {aggregate.riskFactors.map((rf, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                              rf.impact === 'critical' ? 'bg-red-400' :
                              rf.impact === 'high' ? 'bg-orange-400' :
                              rf.impact === 'medium' ? 'bg-amber-400' :
                              'bg-emerald-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-white">{rf.factor}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  rf.impact === 'critical' ? 'bg-red-500/10 text-red-400' :
                                  rf.impact === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                  rf.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {rf.impact}
                                </span>
                                <span className="text-xs text-slate-600">
                                  — {rf.domains.length} domain{rf.domains.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{rf.description}</p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Affected: {rf.domains.join(', ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Monitoring CTA for multi-domain */}
                  <div className="rounded-xl border border-brand-500/20 bg-gradient-to-r from-brand-600/10 to-brand-500/5 p-5 text-center">
                    <h4 className="text-base font-bold text-white mb-1">
                      Losing ${aggregate.totalRevenueAtRiskYearly.toLocaleString()}/year across {aggregate.domainsScanned} domains?
                    </h4>
                    <p className="text-sm text-slate-400 mb-4">
                      Monitor all your domains in one dashboard. Get alerts, fix recommendations, and trend reports.
                    </p>
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
                    >
                      Start Monitoring All Domains
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
