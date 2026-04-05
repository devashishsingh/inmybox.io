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

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
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

  if (!data || data.totalRecords === 0) {
    return <EmptyState />
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
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data.totalReports} reports analyzed &middot;{' '}
            {formatNumber(data.totalVolume)} emails{' '}
            {data.dataStartDate && (
              <>&middot; Data since {new Date(data.dataStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
            )}
          </p>
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
