'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Mail,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Activity,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import type { AnalyticsSummary, TrendPoint } from '@/types'
import { formatNumber, formatPercent, formatCurrency, getRiskColor, getRiskBgColor } from '@/lib/utils'
import { OnboardingChecklist } from '@/components/onboarding-checklist'

type RangeKey = 'all' | '24h' | '7d' | '30d' | '90d' | 'custom'

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: 'all', label: 'All Time' },
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'custom', label: 'Custom' },
]

const RANGE_DAYS: Partial<Record<RangeKey, number>> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const RANGE_STORAGE_KEY = 'inmybox.dashboard.range'

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10)
}

function computeRange(
  selection: RangeKey,
  customStart: string,
  customEnd: string
): { start: Date; end: Date } | null {
  if (selection === 'all') return null
  const now = new Date()
  if (selection === 'custom') {
    if (!customStart || !customEnd) return null
    const s = new Date(customStart + 'T00:00:00')
    const e = new Date(customEnd + 'T23:59:59')
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null
    return { start: s, end: e }
  }
  const days = RANGE_DAYS[selection]
  if (!days) return null
  return { start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), end: now }
}

function rangeLabel(
  selection: RangeKey,
  customStart: string,
  customEnd: string
): string {
  if (selection === 'all') return 'All Time'
  if (selection === 'custom') {
    if (!customStart || !customEnd) return 'Custom range — pick dates'
    return `${customStart} → ${customEnd}`
  }
  const map: Record<string, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  }
  return map[selection] || selection
}

// The range endpoint returns ISO YYYY-MM-DD trend dates; the all-time endpoint
// already returns "Apr 5"-style labels. Normalise ISO entries to the same
// display format so the chart looks identical regardless of source.
function normalizeTrendDates(trend: TrendPoint[]): TrendPoint[] {
  const isoRe = /^\d{4}-\d{2}-\d{2}$/
  return trend.map((p) => {
    if (!isoRe.test(p.date)) return p
    const d = new Date(p.date + 'T00:00:00Z')
    if (isNaN(d.getTime())) return p
    return {
      ...p,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [selection, setSelection] = useState<RangeKey>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  // Restore persisted selection on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RANGE_STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { selection?: RangeKey; start?: string; end?: string }
        if (saved.selection) setSelection(saved.selection)
        if (saved.start) setCustomStart(saved.start)
        if (saved.end) setCustomEnd(saved.end)
        if (saved.selection === 'custom') setShowCustom(true)
      }
    } catch {
      /* ignore storage errors */
    }
  }, [])

  // Always-safe fetch path: /api/analytics is the existing, untouched endpoint.
  const fetchAllTime = () =>
    fetch('/api/analytics').then((r) => {
      if (!r.ok) throw new Error(`analytics ${r.status}`)
      return r.json() as Promise<AnalyticsSummary>
    })

  const fetchRange = (start: Date, end: Date) =>
    fetch(
      `/api/analytics/range?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
    ).then((r) => {
      if (!r.ok) throw new Error(`range ${r.status}`)
      return r.json() as Promise<AnalyticsSummary>
    })

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const range = computeRange(selection, customStart, customEnd)
    let usedFallback = false
    try {
      const result = range
        ? await fetchRange(range.start, range.end).catch(async () => {
            usedFallback = true
            return fetchAllTime()
          })
        : await fetchAllTime()
      setData({ ...result, trendData: normalizeTrendDates(result.trendData || []) })
      if (isRefresh) setToast(usedFallback ? 'Showing all-time data' : 'Data updated')
      else if (usedFallback) setToast('Showing all-time data')
    } catch (err) {
      console.error(err)
    } finally {
      if (isRefresh) setRefreshing(false)
      else setLoading(false)
      if (isRefresh || usedFallback) setTimeout(() => setToast(null), 2000)
    }
  }

  // Re-fetch when selection or custom dates change. Skip if Custom is selected
  // but the user hasn't completed both date inputs yet.
  useEffect(() => {
    if (selection === 'custom' && (!customStart || !customEnd)) return
    try {
      localStorage.setItem(
        RANGE_STORAGE_KEY,
        JSON.stringify({ selection, start: customStart, end: customEnd })
      )
    } catch {
      /* ignore */
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, customStart, customEnd])

  // Initial-mount full-page skeleton: only when we genuinely have no data yet.
  // Subsequent loads (range switches) keep the header/pills visible and show
  // an inline skeleton further down.
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    )
  }

  const hasData = !loading && !!data && data.totalRecords > 0

  // Truly empty system (no data ever uploaded) keeps the original onboarding
  // screen. Only show it once a load has completed AND we're viewing All Time.
  if (!loading && (!data || data.totalRecords === 0) && selection === 'all') {
    return <EmptyState />
  }

  const pieData = hasData
    ? [
        { name: 'Pass', value: data!.dmarcPassRate, color: '#10b981' },
        { name: 'Fail', value: 1 - data!.dmarcPassRate, color: '#ef4444' },
      ]
    : []

  const senderPieData = hasData
    ? [
        { name: 'Known', value: data!.senderBreakdown.known, color: '#10b981' },
        { name: 'Trusted', value: data!.senderBreakdown.trusted, color: '#6366f1' },
        { name: 'Unknown', value: data!.senderBreakdown.unknown, color: '#f59e0b' },
        { name: 'Suspicious', value: data!.senderBreakdown.suspicious, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Overview</h1>

            {/* Range pills */}
            <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSelection(opt.key)
                    setShowCustom(opt.key === 'custom')
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    selection === opt.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {showCustom && (
              <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || isoDay(new Date())}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-200 bg-white focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  max={isoDay(new Date())}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-200 bg-white focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              aria-label="Refresh dashboard data"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {hasData && data && (
            <p className="text-sm text-slate-500 mt-0.5">
              {data.totalReports} reports analyzed &middot;{' '}
              {formatNumber(data.totalVolume)} emails{' '}
              {data.dataStartDate && (
                <>&middot; Data since {new Date(data.dataStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
              )}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Showing: {rangeLabel(selection, customStart, customEnd)}
          </p>
        </div>
        {hasData && data && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold shrink-0 self-start whitespace-nowrap max-w-full ${getRiskBgColor(data.delivery.riskLevel)} ${getRiskColor(data.delivery.riskLevel)}`}>
            {data.delivery.riskLevel === 'healthy' ? (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{data.delivery.label}</span>
          </div>
        )}
      </div>

      {/* Subtle toast (auto-dismisses) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg animate-fade-in"
        >
          {toast}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="text-center text-xs text-slate-400">Loading reports…</div>
        </div>
      )}

      {!loading && !hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">No reports found for this time range</h2>
          <p className="text-sm text-slate-500 mt-1">
            Try selecting a wider range or choose{' '}
            <button
              type="button"
              onClick={() => {
                setSelection('all')
                setShowCustom(false)
              }}
              className="text-brand-600 hover:text-brand-700 font-medium hover:underline"
            >
              All Time
            </button>
            .
          </p>
        </div>
      )}

      {!loading && hasData && data && (<>
      {/* Technical Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/drilldown/spf">
          <StatCard
            title="SPF Pass Rate"
            value={formatPercent(data.spfPassRate)}
            icon={Shield}
            trend={data.spfPassRate > 0.9 ? 'up' : 'down'}
            accent={data.spfPassRate > 0.9 ? 'emerald' : 'amber'}
            clickable
          />
        </Link>
        <Link href="/dashboard/drilldown/dkim">
          <StatCard
            title="DKIM Health"
            value={formatPercent(data.dkimPassRate)}
            icon={ShieldCheck}
            trend={data.dkimPassRate > 0.9 ? 'up' : 'down'}
            accent={data.dkimPassRate > 0.9 ? 'emerald' : 'amber'}
            clickable
          />
        </Link>
        <Link href="/dashboard/drilldown/dmarc">
          <StatCard
            title="DMARC Pass Rate"
            value={formatPercent(data.dmarcPassRate)}
            icon={Activity}
            trend={data.dmarcPassRate > 0.9 ? 'up' : 'down'}
            accent={data.dmarcPassRate > 0.9 ? 'emerald' : 'amber'}
            clickable
          />
        </Link>
        <Link href="/dashboard/drilldown/disposition">
          <StatCard
            title="Rejection Rate"
            value={formatPercent(data.rejectionRate)}
            icon={AlertTriangle}
            trend={data.rejectionRate < 0.05 ? 'up' : 'down'}
            accent={data.rejectionRate < 0.05 ? 'emerald' : 'red'}
            invertTrend
            clickable
          />
        </Link>
      </div>

      {/* Business Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estimated Reach"
          value={formatNumber(data.impact.estimatedReachable)}
          subtitle={`of ${formatNumber(data.impact.totalEmails)} total`}
          icon={Mail}
          accent="brand"
        />
        <StatCard
          title="Inbox Probability"
          value={formatPercent(data.delivery.inboxProbability)}
          icon={TrendingUp}
          accent="brand"
        />
        <StatCard
          title="Potential Lead Loss"
          value={formatNumber(data.impact.potentialLeadLoss)}
          subtitle="leads at risk"
          icon={Users}
          accent="amber"
        />
        <StatCard
          title="Revenue at Risk"
          value={formatCurrency(data.impact.estimatedRevenueAtRisk)}
          subtitle="potential loss"
          icon={DollarSign}
          accent="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Delivery Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Delivery Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pass vs Fail volume over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <defs>
                  <linearGradient id="gradPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pass"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradPass)"
                  name="Pass"
                />
                <Area
                  type="monotone"
                  dataKey="fail"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gradFail)"
                  name="Fail"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Auth Results Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Authentication Results</h3>
          <p className="text-xs text-slate-500 mb-4">DMARC pass/fail distribution</p>
          <div className="flex justify-center">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {formatPercent(data.dmarcPassRate)}
                </span>
                <span className="text-xs text-slate-500">Pass Rate</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-medium text-slate-900">{formatPercent(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Failing IPs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Top Failing IPs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Senders with highest failure rates</p>
            </div>
            <Link
              href="/dashboard/drilldown/ip"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.topFailingIps.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No failing IPs detected</p>
            ) : (
              data.topFailingIps.slice(0, 5).map((ip) => (
                <div key={ip.ip} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-sm font-mono text-slate-700">{ip.ip}</span>
                    <span className="text-xs text-slate-400 ml-2">{formatNumber(ip.count)} msgs</span>
                    {ip.domain && (
                      <span className="text-xs text-slate-400 ml-1">· {ip.domain}</span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${ip.failRate > 0.5 ? 'text-red-600' : 'text-amber-500'}`}>
                    {formatPercent(ip.failRate)} fail
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sender Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Sender Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Classification of sending IPs</p>
            </div>
            <Link
              href="/dashboard/senders"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={senderPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {senderPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {senderPieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>)}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'brand',
  invertTrend = false,
  clickable = false,
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  trend?: 'up' | 'down'
  accent?: string
  invertTrend?: boolean
  clickable?: boolean
}) {
  const accentColors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  const isGood = invertTrend ? trend === 'down' : trend === 'up'

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 card-hover ${clickable ? 'cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${accentColors[accent] || accentColors.brand} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
              {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          )}
          {clickable && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 transition-colors" />
          )}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle || title}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mb-6">
        <BarChart3 className="w-10 h-10 text-brand-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Waiting for your first report</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        Once your DMARC record is updated to point to your assigned reporting alias,
        aggregate reports will start flowing in automatically. You&apos;ll see delivery health,
        sender intelligence, and business impact analytics right here.
      </p>
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/20"
      >
        <Shield className="w-4 h-4" />
        Check Setup Status
      </Link>
    </div>
  )
}
