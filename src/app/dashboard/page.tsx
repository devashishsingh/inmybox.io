'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Calendar,
  Zap,
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
import type { AnalyticsSummary } from '@/types'
import { formatNumber, formatPercent, formatCurrency, getRiskColor, getRiskBgColor } from '@/lib/utils'
import { OnboardingChecklist } from '@/components/onboarding-checklist'

// ─── DATE RANGE PRESETS ─────────────────────────────────────────────

const DATE_PRESETS: { label: string; days: number | null }[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: null },
]

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<number | null>(null) // null = all time
  const [error, setError] = useState('')

  const fetchAnalytics = useCallback(async (days: number | null) => {
    setLoading(true)
    try {
      let url = '/api/analytics'
      if (days !== null) {
        const from = new Date()
        from.setDate(from.getDate() - days)
        url += `?from=${from.toISOString()}`
      }
      const r = await fetch(url)
      const d = await r.json()
      setData(d)
    } catch (err) {
      console.error(err)
      setError('Failed to load analytics data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics(dateRange)
  }, [dateRange, fetchAnalytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 dash-skeleton rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 dash-skeleton animate-pulse" />
          ))}
        </div>
        <div className="h-80 dash-skeleton animate-pulse" />
      </div>
    )
  }

  if (!data || data.totalRecords === 0) {
    return error ? (
      <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    ) : <EmptyState />
  }

  const pieData = [
    { name: 'Pass', value: data.dmarcPassRate, color: '#10b981' },
    { name: 'Fail', value: 1 - data.dmarcPassRate, color: '#ef4444' },
  ]

  const senderPieData = [
    { name: 'Known', value: data.senderBreakdown.known, color: '#10b981' },
    { name: 'Trusted', value: data.senderBreakdown.trusted, color: '#6366f1' },
    { name: 'Unknown', value: data.senderBreakdown.unknown, color: '#f59e0b' },
    { name: 'Suspicious', value: data.senderBreakdown.suspicious, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="dash-heading">Overview</h1>
          <p className="dash-subheading mt-0.5">
            {data.totalReports} reports analyzed &middot;{' '}
            {formatNumber(data.totalVolume)} emails{' '}
            {data.dataStartDate && (
              <>&middot; Data since {new Date(data.dataStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 dash-date-picker">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            {DATE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDateRange(p.days)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === p.days
                    ? 'dash-date-active'
                    : 'text-slate-400 hover:text-slate-200 rounded-lg'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${getRiskBgColor(data.delivery.riskLevel)} ${getRiskColor(data.delivery.riskLevel)}`}>
          {data.delivery.riskLevel === 'healthy' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <ShieldAlert className="w-4 h-4" />
          )}
          {data.delivery.label}
        </div>
        </div>
      </div>

      {/* Action Items Summary */}
      {data.actionItems && (data.actionItems.critical > 0 || data.actionItems.high > 0 || data.actionItems.open > 0) && (
        <Link href="/dashboard/actions" className="block">
          <div className="dash-card-glow p-4 cursor-pointer transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl dash-icon-well-amber flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Action Items</h3>
                  <p className="text-xs text-slate-500">{data.actionItems.open} open items need attention</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {data.actionItems.critical > 0 && (
                  <span className="dash-badge dash-badge-critical text-xs">
                    {data.actionItems.critical} Critical
                  </span>
                )}
                {data.actionItems.high > 0 && (
                  <span className="dash-badge dash-badge-warning text-xs">
                    {data.actionItems.high} High
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
              </div>
            </div>
          </div>
        </Link>
      )}

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
        <div className="lg:col-span-2 dash-chart p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Delivery Trend</h3>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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
                    background: 'rgba(15,15,25,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px -4px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    backdropFilter: 'blur(12px)',
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
        <div className="dash-chart p-6">
          <h3 className="text-base font-semibold text-slate-200 mb-1">Authentication Results</h3>
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
                <span className="text-2xl font-bold text-slate-100">
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
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-medium text-slate-200">{formatPercent(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Failing IPs */}
        <div className="dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Top Failing IPs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Senders with highest failure rates</p>
            </div>
            <Link
              href="/dashboard/drilldown/ip"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.topFailingIps.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No failing IPs detected</p>
            ) : (
              data.topFailingIps.slice(0, 5).map((ip) => (
                <div key={ip.ip} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <span className="text-sm font-mono text-slate-300">{ip.ip}</span>
                    <span className="text-xs text-slate-500 ml-2">{formatNumber(ip.count)} msgs</span>
                    {ip.domain && (
                      <span className="text-xs text-slate-500 ml-1">· {ip.domain}</span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${ip.failRate > 0.5 ? 'text-red-400' : 'text-amber-400'}`}>
                    {formatPercent(ip.failRate)} fail
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sender Breakdown */}
        <div className="dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Sender Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Classification of sending IPs</p>
            </div>
            <Link
              href="/dashboard/senders"
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
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
                    <span className="text-slate-400">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-200">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
    brand: 'dash-icon-well text-brand-400',
    emerald: 'dash-icon-well-emerald text-emerald-400',
    amber: 'dash-icon-well-amber text-amber-400',
    red: 'dash-icon-well-red text-red-400',
  }

  const isGood = invertTrend ? trend === 'down' : trend === 'up'

  return (
    <div className={`dash-card p-5 ${clickable ? 'cursor-pointer group' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${accentColors[accent] || accentColors.brand} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
              {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          )}
          {clickable && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
          )}
        </div>
      </div>
      <div className="dash-metric text-2xl">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle || title}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-3xl dash-icon-well flex items-center justify-center mb-6">
        <BarChart3 className="w-10 h-10 text-brand-400" />
      </div>
      <h2 className="dash-heading mb-2">Waiting for your first report</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        Once your DMARC record is updated to point to your assigned reporting alias,
        aggregate reports will start flowing in automatically. You&apos;ll see delivery health,
        sender intelligence, and business impact analytics right here.
      </p>
      <Link
        href="/dashboard/settings"
        className="dash-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
      >
        <Shield className="w-4 h-4" />
        Check Setup Status
      </Link>
    </div>
  )
}
