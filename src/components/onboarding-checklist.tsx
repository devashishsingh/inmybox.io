'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, ChevronRight, ExternalLink, Sparkles } from 'lucide-react'

const STEP_META: Record<string, { label: string; description: string; link?: string }> = {
  domainAdded: { label: 'Add your domain', description: 'Register your primary email domain to monitor', link: '/dashboard/domains' },
  aliasAssigned: { label: 'Alias assigned', description: 'A DMARC reporting alias has been mapped to your account' },
  dmarcRuaUpdated: { label: 'Update DMARC RUA', description: 'Point your DMARC rua= tag to the assigned alias address' },
  sampleReportUploaded: { label: 'Sample report received', description: 'A test DMARC report has been received via your alias' },
  firstReportReceived: { label: 'First report received', description: 'We\'ve received your first automated DMARC aggregate report' },
  parsingComplete: { label: 'Parsing complete', description: 'Your report has been parsed and data is ready' },
  sendersReviewed: { label: 'Review senders', description: 'Review and classify your email senders', link: '/dashboard/senders' },
  assumptionsConfigured: { label: 'Configure assumptions', description: 'Set your business metrics for impact calculations', link: '/dashboard/settings' },
  dashboardReady: { label: 'Dashboard ready', description: 'Everything is set up — your dashboard is live!' },
}

export function OnboardingChecklist() {
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/onboarding')
      .then((r) => r.json())
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !progress || dismissed || progress.isComplete) return null

  return (
    <div className="dash-card-glow overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl dash-icon-well flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Setup Checklist</h3>
              <p className="text-xs text-slate-500">{progress.completedCount} of {progress.steps.length} steps complete</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/[0.04]">
        {progress.steps.map((step: any) => {
          const meta = STEP_META[step.key] || { label: step.key, description: '' }
          return (
            <div key={step.key} className={`flex items-center gap-3 px-6 py-3 ${step.completed ? 'opacity-60' : ''}`}>
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${step.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {meta.label}
                </div>
                <div className="text-xs text-slate-400 truncate">{meta.description}</div>
              </div>
              {!step.completed && meta.link && (
                <a href={meta.link} className="text-brand-400 hover:text-brand-300 shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
