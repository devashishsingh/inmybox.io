'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Inbox,
  RefreshCw,
} from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = () => {
    setLoading(true)
    fetch('/api/reports')
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReports() }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            DMARC aggregate reports received via your reporting alias
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No reports received yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Reports will appear here automatically once your DMARC record is configured
              to send aggregate reports to your assigned alias.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">Report ID</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Domain</th>
                  <th className="px-6 py-3">Date Range</th>
                  <th className="px-6 py-3">Records</th>
                  <th className="px-6 py-3">Policy</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {report.reportId?.length > 24
                        ? `${report.reportId.slice(0, 24)}...`
                        : report.reportId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {report.orgName?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-slate-700">{report.orgName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{report.domain?.domain}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(report.dateBegin).toLocaleDateString()} — {new Date(report.dateEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">{report._count?.records || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      {report.policyP && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.policyP === 'reject' ? 'bg-emerald-50 text-emerald-700' :
                          report.policyP === 'quarantine' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {report.policyP === 'reject' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          p={report.policyP}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
