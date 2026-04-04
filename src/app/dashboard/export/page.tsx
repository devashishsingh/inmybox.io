'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  FileText,
  FileSpreadsheet,
  BarChart3,
  Loader2,
  CheckCircle2,
  Shield,
} from 'lucide-react'

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error)
  }, [])

  const exportCSV = async () => {
    setExporting('csv')
    try {
      const res = await fetch('/api/export?format=csv')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inmybox-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('CSV export failed', e)
    } finally {
      setExporting(null)
    }
  }

  const exportPDF = async () => {
    setExporting('pdf')
    try {
      const res = await fetch('/api/export?format=pdf')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inmybox-report-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF export failed', e)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export &amp; Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Download reports and share insights with your team
        </p>
      </div>

      {/* Export Options */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExportCard
          icon={FileSpreadsheet}
          title="CSV Export"
          description="Download raw DMARC records as a CSV spreadsheet. Includes all authentication results, sender IPs, and dispositions."
          buttonLabel="Download CSV"
          loading={exporting === 'csv'}
          onClick={exportCSV}
          accent="emerald"
        />
        <ExportCard
          icon={FileText}
          title="PDF Summary"
          description="Generate a formatted PDF report with executive summary, key metrics, delivery health, and business impact analysis."
          buttonLabel="Generate PDF"
          loading={exporting === 'pdf'}
          onClick={exportPDF}
          accent="brand"
        />
        <ExportCard
          icon={BarChart3}
          title="Executive Report"
          description="A presentation-ready report designed for leadership. Includes visual charts, risk summaries, and recommendations."
          buttonLabel="Coming Soon"
          disabled
          accent="violet"
        />
      </div>

      {/* Executive Summary Preview */}
      {analytics && analytics.totalRecords > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Executive Summary</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick overview of your email delivery health
              </p>
            </div>
            <div className="text-xs text-slate-400">
              {analytics.totalReports} reports analyzed
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Overall Health',
                value: analytics.delivery?.label || 'N/A',
                sub: `Trust Score: ${analytics.delivery?.trustScore || 0}%`,
                color: analytics.delivery?.riskLevel === 'healthy' ? 'emerald' : 'amber',
              },
              {
                label: 'Total Volume',
                value: analytics.totalVolume?.toLocaleString() || '0',
                sub: 'emails analyzed',
                color: 'brand',
              },
              {
                label: 'Inbox Rate',
                value: `${((analytics.delivery?.inboxProbability || 0) * 100).toFixed(1)}%`,
                sub: 'estimated delivery',
                color: 'brand',
              },
              {
                label: 'Revenue at Risk',
                value: `$${(analytics.impact?.estimatedRevenueAtRisk || 0).toLocaleString()}`,
                sub: 'potential impact',
                color: analytics.impact?.estimatedRevenueAtRisk > 1000 ? 'red' : 'emerald',
              },
            ].map((item) => {
              const colors: Record<string, string> = {
                emerald: 'border-emerald-200 bg-emerald-50',
                brand: 'border-brand-200 bg-brand-50',
                amber: 'border-amber-200 bg-amber-50',
                red: 'border-red-200 bg-red-50',
              }
              return (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${colors[item.color] || colors.brand}`}
                >
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className="text-xl font-bold text-slate-900">{item.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-slate-900 mb-1">Recommendation</div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {analytics.delivery?.riskLevel === 'healthy'
                    ? 'Your email authentication is in good shape. Continue monitoring for any changes in sender behavior or new unauthorized senders.'
                    : 'Review failing senders and ensure SPF, DKIM, and DMARC are properly configured for all legitimate email services. Prioritize fixing high-volume failures first.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExportCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  loading,
  onClick,
  disabled,
  accent = 'brand',
}: {
  icon: any
  title: string
  description: string
  buttonLabel: string
  loading?: boolean
  onClick?: () => void
  disabled?: boolean
  accent?: string
}) {
  const accentColors: Record<string, { bg: string; text: string; button: string }> = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600', button: 'bg-brand-600 hover:bg-brand-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', button: 'bg-emerald-600 hover:bg-emerald-700' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', button: 'bg-violet-600 hover:bg-violet-700' },
  }

  const colors = accentColors[accent] || accentColors.brand

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col card-hover">
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colors.text}`} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${colors.button}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {buttonLabel}
          </>
        )}
      </button>
    </div>
  )
}
