'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Mail,
  Shield,
  TrendingUp,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  DollarSign,
  Users,
  Zap,
  Globe,
  Lock,
  Activity,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Ban,
  Search,
  ShieldCheck,
  FileBarChart,
  Settings,
  Star,
  Quote,
  CreditCard,
  Clock,
} from 'lucide-react'
import { Navbar } from '@/components/landing-nav'
import { AnimateOnScroll } from '@/components/animate'
import { CookieBanner } from '@/components/cookie-banner'
import { DomainScanner } from '@/components/domain-scanner'

/* ΓöÇΓöÇΓöÇ animated counter hook ΓöÇΓöÇΓöÇ */
function useCounter(target: number, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let raf: number
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])

  return { ref, display: `${count.toLocaleString()}${suffix}` }
}

/* ΓöÇΓöÇΓöÇ feature tabs data ΓöÇΓöÇΓöÇ */
const featureTabs = [
  {
    id: 'aggregation',
    label: 'DMARC Aggregation',
    icon: FileBarChart,
    title: 'Unified DMARC Report Aggregation',
    description: 'Automatically parse and aggregate XML DMARC reports from every major email provider. See SPF, DKIM, and DMARC alignment across all your sending sources in a single, intuitive view.',
    highlights: ['Auto-parse XML/ZIP reports', 'Multi-domain support', 'Historical trend analysis', 'Source IP enrichment'],
    stats: [
      { label: 'Reports Processed', value: '50K+' },
      { label: 'Parse Accuracy', value: '99.9%' },
    ],
  },
  {
    id: 'sender',
    label: 'Sender Intelligence',
    icon: Eye,
    title: 'Know Every IP Sending As You',
    description: 'Identify every IP address and service sending email under your domain. Automatically classify trusted services, flag unknown senders, and track suspicious activity before it harms your reputation.',
    highlights: ['Auto sender classification', 'Reverse DNS enrichment', 'Provider detection (Google, AWS, SendGridΓÇª)', 'Threat flagging'],
    stats: [
      { label: 'IPs Monitored', value: '12K+' },
      { label: 'Providers Detected', value: '200+' },
    ],
  },
  {
    id: 'impact',
    label: 'Business Impact',
    icon: TrendingUp,
    title: 'Translate Failures Into Revenue Risk',
    description: 'Go beyond technical metrics. See estimated lead loss, revenue at risk, and campaign health scores based on your own conversion data. Make email authentication a business priority.',
    highlights: ['Revenue-at-risk calculator', 'Lead loss estimation', 'Campaign health scoring', 'Custom conversion models'],
    stats: [
      { label: 'Avg. Recovery', value: '$14K/mo' },
      { label: 'Accuracy', value: '96%' },
    ],
  },
  {
    id: 'actions',
    label: 'Action Items',
    icon: Zap,
    title: 'Prioritized, Actionable Recommendations',
    description: 'Stop guessing what to fix first. Inmybox auto-generates prioritized action items based on severity, business impact, and ease of implementation. One-click guidance for every issue.',
    highlights: ['Auto-generated recommendations', 'Priority scoring', 'One-click fix guides', 'Progress tracking'],
    stats: [
      { label: 'Avg. Resolution', value: '< 2 days' },
      { label: 'Issues Resolved', value: '8K+' },
    ],
  },
]

/* ΓöÇΓöÇΓöÇ testimonials data ΓöÇΓöÇΓöÇ */
const testimonials = [
  {
    quote: "Inmybox gave us instant visibility into email delivery issues we didn't even know we had. Within a week, our inbox rate jumped from 87% to 96%.",
    name: 'Sarah Chen',
    role: 'Head of Growth',
    company: 'ScaleUp SaaS',
  },
  {
    quote: "The business impact dashboard is a game-changer. For the first time, we can actually quantify how much revenue we were losing to email failures.",
    name: 'Marcus Rodriguez',
    role: 'VP Marketing',
    company: 'Commerce Cloud',
  },
  {
    quote: "Setting up DMARC was always intimidating. Inmybox made it so simple ΓÇö we went from no authentication to full enforcement in under two weeks.",
    name: 'Priya Patel',
    role: 'IT Security Lead',
    company: 'FinSecure Partners',
  },
]

// INMYBOX HERO ENHANCEMENT ΓÇö Revenue Loss Calculator
const INBOX_FAIL_RATE = 0.28 // 28% industry average fail-to-inbox

function useAnimatedNumber(target: number, duration = 1500, active = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) { setValue(target); return }
    let start = 0
    const startTime = performance.now()
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) start = requestAnimationFrame(tick)
    }
    start = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(start)
  }, [target, duration, active])
  return value
}

function RevenueLossCalculator({ onRevenueChange }: { onRevenueChange?: (val: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [emailsPerMonth, setEmailsPerMonth] = useState(1000)
  const [conversionRate, setConversionRate] = useState(50)
  const [leadValue, setLeadValue] = useState(10)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const emailsLost = Math.round(emailsPerMonth * INBOX_FAIL_RATE)
  const leadsLost = Math.round(emailsLost * (conversionRate / 100))
  const revenueLostMonth = leadsLost * leadValue
  const revenueLostYear = revenueLostMonth * 12

  useEffect(() => {
    onRevenueChange?.(revenueLostMonth)
  }, [revenueLostMonth, onRevenueChange])

  // Animated values for Mode A on page load
  const animEmailsLost = useAnimatedNumber(emailsLost, 1500, mounted)
  const animLeadsLost = useAnimatedNumber(leadsLost, 1500, mounted)
  const animRevMonth = useAnimatedNumber(revenueLostMonth, 1500, mounted)
  const animRevYear = useAnimatedNumber(revenueLostYear, 1500, mounted)

  // Log-scale slider helper for email volume
  const emailLogMin = Math.log(100)
  const emailLogMax = Math.log(500000)
  const emailSliderToValue = (pos: number) => Math.round(Math.exp(emailLogMin + (pos / 100) * (emailLogMax - emailLogMin)))
  const emailValueToSlider = (val: number) => ((Math.log(val) - emailLogMin) / (emailLogMax - emailLogMin)) * 100

  // Log-scale for lead value
  const lvLogMin = Math.log(1)
  const lvLogMax = Math.log(10000)
  const lvSliderToValue = (pos: number) => Math.round(Math.exp(lvLogMin + (pos / 100) * (lvLogMax - lvLogMin)))
  const lvValueToSlider = (val: number) => ((Math.log(val) - lvLogMin) / (lvLogMax - lvLogMin)) * 100

  const displayEmailsLost = expanded ? emailsLost : animEmailsLost
  const displayLeadsLost = expanded ? leadsLost : animLeadsLost
  const displayRevMonth = expanded ? revenueLostMonth : animRevMonth
  const displayRevYear = expanded ? revenueLostYear : animRevYear

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm p-4 mb-3 skeuo-inset">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">≡ƒôº</span>
        <span className="text-xs text-slate-300 font-medium">
          Based on {emailsPerMonth.toLocaleString()} emails/month
        </span>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2">
          <div className="text-[11px] text-slate-500 mb-0.5">Emails not reaching inbox</div>
          <div className="text-base font-bold text-amber-400">~{displayEmailsLost.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2">
          <div className="text-[11px] text-slate-500 mb-0.5">Leads lost to spam</div>
          <div className="text-base font-bold text-amber-400">~{displayLeadsLost.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-red-500/20 px-3 py-2">
          <div className="text-[11px] text-slate-500 mb-0.5">Revenue lost this month</div>
          <div className="text-base font-bold text-red-400">${displayRevMonth.toLocaleString()}/mo</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-red-500/20 px-3 py-2">
          <div className="text-[11px] text-slate-500 mb-0.5">Revenue lost this year</div>
          <div className="text-base font-bold text-red-400">${displayRevYear.toLocaleString()}/yr</div>
        </div>
      </div>

      {/* Assumptions line */}
      <p className="text-[11px] text-slate-500 mb-2">
        Assuming: {conversionRate}% lead rate ┬╖ ${leadValue} per lead ┬╖ 28% inbox failure rate
      </p>

      {/* MODE B ΓÇö Sliders (expanded) */}
      {expanded && (
        <div className="border-t border-slate-700/50 pt-4 mt-2 space-y-4">
          {/* Emails per month */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">≡ƒôº Emails you send per month</span>
              <span className="text-sm font-semibold text-white">{emailsPerMonth.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0} max={100} step={0.5}
              value={emailValueToSlider(emailsPerMonth)}
              onChange={e => setEmailsPerMonth(emailSliderToValue(Number(e.target.value)))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-brand-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>

          {/* Conversion rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">≡ƒÄ» Email-to-lead conversion rate</span>
              <span className="text-sm font-semibold text-white">{conversionRate}%</span>
            </div>
            <input
              type="range"
              min={1} max={80} step={1}
              value={conversionRate}
              onChange={e => setConversionRate(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-brand-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>

          {/* Lead value */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">≡ƒÆ░ Average value per lead</span>
              <span className="text-sm font-semibold text-white">${leadValue.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0} max={100} step={0.5}
              value={lvValueToSlider(leadValue)}
              onChange={e => setLeadValue(lvSliderToValue(Number(e.target.value)))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-brand-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Toggle CTA */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors py-2 border-t border-slate-700/50 mt-1"
        >
          These are YOUR numbers? Customise them ΓåÆ
        </button>
      ) : (
        <div className="text-center mt-4">
          <p className="text-xs text-slate-400">
            Fix this in 2 minutes ΓÇö scan your domain below Γåô
          </p>
        </div>
      )}
    </div>
  )
}

export function LandingPage() {
  const [activeTab, setActiveTab] = useState('aggregation')
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [hasScanResults, setHasScanResults] = useState(false)

  /* auto-rotate testimonials */
  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 6000)
    return () => clearInterval(timer)
  }, [])

  const activeFeature = featureTabs.find(t => t.id === activeTab)!

  /* counters */
  const c1 = useCounter(380, 2000, 'K+')
  const c2 = useCounter(9, 1800, 'B+')
  const c3 = useCounter(27, 1600, 'M+')
  const c4 = useCounter(175, 2200, 'K+')

  return (
    <main className="overflow-x-hidden">
      <Navbar />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          HERO  ΓÇö Domain Scanner + Dashboard Mock
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="relative min-h-screen flex items-center bg-slate-950 overflow-hidden z-0">
        {/* ΓöÇΓöÇ Background layers ΓöÇΓöÇ */}
        <div className="absolute inset-0 hero-grid-fine" />
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute inset-0 noise-overlay" />

        {/* Animated gradient orbs ΓÇö INMYBOX HERO ENHANCEMENT */}
        <div className="orb w-[700px] h-[700px] bg-blue-700/[0.07] top-[-10%] left-[-5%] animate-orb-drift-1" />
        <div className="orb w-[600px] h-[600px] bg-indigo-600/[0.05] bottom-[-5%] right-[-5%] animate-orb-drift-2" />
        <div className="orb w-[400px] h-[400px] bg-cyan-600/[0.06] top-[30%] right-[10%] animate-orb-pulse" />

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-8">
          <div className={`grid ${hasScanResults ? 'lg:grid-cols-1' : 'lg:grid-cols-[52%_48%]'} gap-6 lg:gap-8 items-center transition-all duration-500`}>
            {/* Left ΓÇö Copy + Calculator + Scanner */}
            <div className="text-center lg:text-left">
              {/* INMYBOX HERO ENHANCEMENT ΓÇö Urgency badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold tracking-wide skeuo-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Google &amp; Microsoft now enforcing DMARC ΓÇö Is your domain ready?
              </div>

              {/* ΓÜá∩╕Å LOCKED ΓÇö DO NOT CHANGE THIS HEADLINE OR SUBHEADLINE */}
              <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-3">
                Sent Doesn&apos;t Mean Delivered.{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Delivered Doesn&apos;t Mean Seen.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 mb-4 leading-relaxed">
                Inmybox closes the gap ΓÇö and shows you the revenue you&apos;ve been missing.
              </p>
              {/* ΓÜá∩╕Å END LOCKED COPY */}

              {/* ΓöÇΓöÇ Domain Scanner ΓÇö primary hero CTA ΓöÇΓöÇ */}
              <DomainScanner onScanResult={setHasScanResults} />

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 skeuo-badge">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-medium">SOC 2 Ready</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 skeuo-badge">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px] text-amber-300 font-medium">4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 skeuo-badge">
                  <Globe className="w-3 h-3 text-brand-400" />
                  <span className="text-[11px] text-brand-300 font-medium">130+ Countries</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-600/30 skeuo-badge">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-300 font-medium">No credit card</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-600/30 skeuo-badge">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-300 font-medium">Results in seconds</span>
                </div>
              </div>
            </div>

            {/* Right ΓÇö Dashboard Mock with 3D depth */}
            {!hasScanResults && (
            <div className="relative hidden lg:block overflow-hidden pr-2">
              {/* Floating metric cards ΓÇö INMYBOX HERO ENHANCEMENT */}
              <div className="absolute -top-4 right-0 z-20 animate-float-card-1">
                <div className="glass-float-green rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">≡ƒô¼</span>
                    <div>
                      <div className="text-xs text-slate-400">Inbox Rate</div>
                      <div className="text-sm font-bold text-emerald-400">94.1% <span className="text-emerald-300 text-xs">Γåæ 2.1%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 left-0 z-20 animate-float-card-2">
                <div className="glass-float-red rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">≡ƒÆ╕</span>
                    <div>
                      <div className="text-xs text-slate-400">Revenue at Risk</div>
                      <div className="text-sm font-bold text-red-400">$1,240</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 right-0 z-20 animate-float-card-3">
                <div className="glass-float-blue rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">≡ƒöÆ</span>
                    <div>
                      <div className="text-xs text-slate-400">SPF Pass</div>
                      <div className="text-sm font-bold text-blue-400">98.2%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative animate-float-sm dashboard-3d depth-shadow rounded-2xl skeuo-card">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    <span className="ml-3 text-xs text-slate-500">dashboard.inmybox.io</span>
                  </div>

                  <div className="flex">
                    {/* Mini sidebar */}
                    <div className="w-12 border-r border-slate-800 bg-slate-900/40 py-4 flex flex-col items-center gap-4">
                      <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
                        <Mail className="w-3 h-3 text-white" />
                      </div>
                      <div className="w-5 h-5 rounded bg-slate-700" />
                      <div className="w-5 h-5 rounded bg-slate-700" />
                      <div className="w-5 h-5 rounded bg-slate-700" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 space-y-4">
                      <div className="text-xs text-slate-400">Email Delivery Health</div>

                      {/* Stat cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-1">SPF Pass</div>
                          <div className="text-lg font-bold text-emerald-400">98.2%</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-1">DKIM Health</div>
                          <div className="text-lg font-bold text-emerald-400">96.7%</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-1">Inbox Rate</div>
                          <div className="text-lg font-bold text-brand-400">94.1%</div>
                        </div>
                      </div>

                      {/* Mini chart */}
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-3">Delivery Trend (7d)</div>
                        <div className="flex items-end gap-1 h-16">
                          {[75, 82, 78, 90, 88, 92, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                              <div
                                className="rounded-sm bg-brand-400/70"
                                style={{ height: `${h}%` }}
                              />
                              <div
                                className="rounded-sm bg-emerald-400/40"
                                style={{ height: `${100 - h}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mini table */}
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-2">Top Senders</div>
                        <div className="space-y-2">
                          {[
                            { ip: '203.0.113.1', status: 'Trusted', color: 'text-emerald-400' },
                            { ip: '198.51.100.5', status: 'Unknown', color: 'text-amber-400' },
                            { ip: '192.0.2.12', status: 'Review', color: 'text-red-400' },
                          ].map((s) => (
                            <div key={s.ip} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-mono">{s.ip}</span>
                              <span className={`font-medium ${s.color}`}>{s.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow behind */}
                <div className="absolute -inset-4 bg-brand-500/10 rounded-3xl blur-3xl -z-10" />
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          // INMYBOX TICKER ENHANCEMENT
          TWO-ROW TRUTH STATEMENTS TICKER
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-8 bg-slate-900/50 border-b border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-6 font-medium">
            Why email is the most powerful ΓÇö and most attacked ΓÇö channel in business
          </p>
        </div>

        <div className="ticker-wrapper space-y-4">
          {/* Row 1 ΓÇö Stats & Facts ΓÇö scrolls LEFT */}
          <div className="relative ticker-edge-fade">
            <div className="flex ticker-row-1">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center shrink-0">
                  {[
                    '4.6 billion email users worldwide',
                    '$36 back for every $1 spent on email',
                    '347 billion emails sent every single day',
                    'Email beats social ROI by 4x every year',
                    'Nobody sends a job offer over WhatsApp',
                    'You sign contracts over email ΓÇö not Slack',
                    'Email is legally admissible in court',
                    'Your email list is yours forever ΓÇö Instagram can ban you tomorrow',
                    'No algorithm between you and your recipient',
                    'Everything said over email is documented and provable',
                    'One email scales to millions ΓÇö one call reaches one person',
                    'Every platform on earth asks for your email to sign up',
                  ].map((text, i) => (
                    <div key={`${setIdx}-${i}`} className="flex items-center shrink-0">
                      <span className="text-cyan-500/60 text-xs mx-4">Γùå</span>
                      <span className="text-sm text-slate-300/90 whitespace-nowrap">{text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 ΓÇö Urgency & Threat ΓÇö scrolls RIGHT */}
          <div className="relative ticker-edge-fade">
            <div className="flex ticker-row-2">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center shrink-0">
                  {[
                    '3.4 billion phishing emails sent every single day',
                    '94% of malware arrives via email',
                    'Business Email Compromise costs $6.7 billion annually',
                    'Most attacks succeed because domains have zero DMARC',
                    'Google now rejects unauthenticated bulk email',
                    'Microsoft enforcing DMARC from May 2025',
                    'Yahoo blocking non-compliant senders right now',
                    'Your bank talks to you over email ΓÇö so do attackers',
                    'Email is the internet\u0027s only universal identity layer',
                    'Sent does not mean delivered',
                    'Delivered does not mean seen',
                    'Is your domain one of the unprotected ones?',
                  ].map((text, i) => (
                    <div key={`${setIdx}-${i}`} className="flex items-center shrink-0">
                      <span className="text-red-500/50 text-xs mx-4">Γùå</span>
                      <span className="text-sm text-slate-400/80 whitespace-nowrap">{text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          VALUE PROPOSITIONS (4 pillars)
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Why Inmybox
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Protect Your Reputation, Ensure Compliance, Boost Deliverability
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Our platform simplifies your entire DMARC journey ΓÇö from first scan to full enforcement.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Reliable',
                description: 'Trusted by thousands of domains worldwide. Robust, scalable solutions that grow with your organization.',
                color: 'text-brand-400',
                bg: 'bg-brand-500/10',
              },
              {
                icon: Settings,
                title: 'Easy to Manage',
                description: 'Smart dashboards and simplified reporting keep email authentication on track, reducing troubleshooting time.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: ShieldCheck,
                title: 'Risk-Free',
                description: 'We provide peace of mind with world-class support so you can focus on your business while we handle email security.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/10',
              },
              {
                icon: Zap,
                title: 'Fast',
                description: 'Streamlined implementation ensures rapid transition from monitoring to full enforcement with minimal disruption.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
              },
            ].map((item, i) => (
              <AnimateOnScroll key={item.title} delay={i * 100}>
                <div className="card-hover skeuo-card bg-slate-900/50 rounded-2xl border border-slate-800 p-7 h-full text-center">
                  <div className={`w-14 h-14 rounded-2xl skeuo-well ${item.bg} flex items-center justify-center mb-5 mx-auto`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll delay={500}>
            <div className="text-center mt-10">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ INDUSTRY ENFORCEMENT ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Industry Crackdown
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Google, Yahoo &amp; Microsoft Are Rejecting
                Unauthenticated Email
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                The world&apos;s largest email providers have rolled out strict DMARC
                enforcement. If your domain isn&apos;t compliant, your emails are
                going straight to spam &mdash; or being rejected entirely.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Google */}
            <AnimateOnScroll delay={0}>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 h-full flex flex-col card-hover skeuo-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 skeuo-well flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Google</h3>
                    <p className="text-xs text-slate-500">Gmail &amp; Google Workspace</p>
                  </div>
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-blue-500/50 pl-4 mb-5 flex-1">
                  &ldquo;Starting February 2024, Gmail requires bulk senders (5,000+ messages/day)
                  to authenticate emails with SPF, DKIM, and DMARC. Unauthenticated messages
                  will be rejected or sent to spam.&rdquo;
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Rejecting unauthenticated mail</span>
                  </div>
                  <a
                    href="https://blog.google/products/gmail/gmail-security-authentication-spam-protection/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    Read more <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Yahoo */}
            <AnimateOnScroll delay={120}>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 h-full flex flex-col card-hover skeuo-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 skeuo-well flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#7B1FA2">
                      <path d="M13.131 7.894l3.478-7.142h-3.478L10.96 5.27 8.791.752H5.097l3.675 7.142v5.054h1.29V7.894h3.069zM16.744 6.068h2.652v6.88h-2.652zM18.07 2.084c-.894 0-1.46.563-1.46 1.345 0 .775.548 1.337 1.44 1.337h.02c.913 0 1.463-.562 1.463-1.337-.02-.782-.55-1.345-1.463-1.345z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Yahoo</h3>
                    <p className="text-xs text-slate-500">Yahoo Mail &amp; AOL</p>
                  </div>
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-purple-500/50 pl-4 mb-5 flex-1">
                  &ldquo;Beginning Q1 2024, Yahoo will require bulk senders to implement
                  SPF, DKIM, and DMARC authentication. Messages that fail these checks
                  will not be delivered to Yahoo inboxes.&rdquo;
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Blocking non-compliant senders</span>
                  </div>
                  <a
                    href="https://blog.postmaster.yahooinc.com/post/730172167494483968/more-secure-less-spam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    Read more <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Microsoft */}
            <AnimateOnScroll delay={240}>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 h-full flex flex-col card-hover skeuo-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 skeuo-well flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Microsoft</h3>
                    <p className="text-xs text-slate-500">Outlook &amp; Microsoft 365</p>
                  </div>
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-500/50 pl-4 mb-5 flex-1">
                  &ldquo;Starting May 2025, Outlook.com will require DMARC alignment for
                  high&#8209;volume senders. Non&#8209;compliant messages will first be
                  routed to Junk, and eventually rejected outright.&rdquo;
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Enforcing DMARC alignment</span>
                  </div>
                  <a
                    href="https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem--outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-luftsen/4399730"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    Read more <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Urgency CTA */}
          <AnimateOnScroll delay={360}>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">
                  <strong className="text-red-200">Non-compliance = lost revenue.</strong>{' '}
                  Every unauthenticated email is a lead that never arrives.
                </span>
              </div>
              <div className="mt-6">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 skeuo-btn"
                >
                  Check Your DMARC Compliance
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          FEATURE SHOWCASE (Tabbed)
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="features" className="py-24 md:py-32 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Key Features
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Enhanced Security and Deliverability
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Reduce cyberattack risks, solve deliverability issues, and manage your domain quickly and reliably.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Tab buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {featureTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 skeuo-btn'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50 skeuo-badge'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div key={activeTab} className="tab-reveal">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left ΓÇö Info */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {activeFeature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  {activeFeature.description}
                </p>
                <div className="space-y-3 mb-8">
                  {activeFeature.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-slate-300">{h}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-6">
                  {activeFeature.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-2xl font-bold text-brand-400">{s.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right ΓÇö Visual preview */}
              <div className="relative">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl skeuo-card">
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    <span className="ml-3 text-xs text-slate-500">app.inmybox.io/{activeFeature.id}</span>
                  </div>
                  <div className="p-6 space-y-4 min-h-[320px]">
                    {activeTab === 'aggregation' && (
                      <>
                        <div className="text-sm text-slate-400 font-medium">DMARC Report Summary</div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { l: 'SPF Pass', v: '98.2%', c: 'text-emerald-400' },
                            { l: 'DKIM Aligned', v: '96.7%', c: 'text-emerald-400' },
                            { l: 'DMARC Pass', v: '94.1%', c: 'text-brand-400' },
                          ].map(s => (
                            <div key={s.l} className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                              <div className="text-xs text-slate-500 mb-1">{s.l}</div>
                              <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-3">7-Day Trend</div>
                          <div className="flex items-end gap-1 h-20">
                            {[75, 82, 78, 90, 88, 92, 95].map((h, i) => (
                              <div key={i} className="flex-1 rounded-t bg-brand-400/70" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {activeTab === 'sender' && (
                      <>
                        <div className="text-sm text-slate-400 font-medium">Active Senders</div>
                        <div className="space-y-2">
                          {[
                            { ip: '203.0.113.1', provider: 'Google Workspace', status: 'Trusted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { ip: '198.51.100.5', provider: 'SendGrid', status: 'Trusted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { ip: '172.16.0.44', provider: 'Unknown VPS', status: 'Suspicious', color: 'text-red-400', bg: 'bg-red-500/10' },
                            { ip: '192.0.2.12', provider: 'AWS SES', status: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { ip: '10.0.0.88', provider: 'Mailchimp', status: 'Trusted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                          ].map(s => (
                            <div key={s.ip} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3 border border-slate-700/50">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400">{s.ip}</span>
                                <span className="text-xs text-slate-500">{s.provider}</span>
                              </div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.status}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {activeTab === 'impact' && (
                      <>
                        <div className="text-sm text-slate-400 font-medium">Business Impact Dashboard</div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { l: 'Revenue at Risk', v: '$17,240', c: 'text-red-400' },
                            { l: 'Leads at Risk', v: '~340/mo', c: 'text-amber-400' },
                            { l: 'Inbox Rate', v: '94.1%', c: 'text-emerald-400' },
                            { l: 'Campaign Health', v: 'Good', c: 'text-brand-400' },
                          ].map(s => (
                            <div key={s.l} className="bg-slate-800 rounded-lg p-4 border border-slate-700/50">
                              <div className="text-xs text-slate-500 mb-1">{s.l}</div>
                              <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700/50">
                          <div className="text-xs text-slate-500 mb-2">Impact Flow</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">Auth Failure</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">Spam Risk</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400">Lost Leads</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">$ Impact</span>
                          </div>
                        </div>
                      </>
                    )}
                    {activeTab === 'actions' && (
                      <>
                        <div className="text-sm text-slate-400 font-medium">Action Items</div>
                        <div className="space-y-2">
                          {[
                            { title: 'Enable DKIM for marketing.acme.com', severity: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' },
                            { title: 'Review 3 unknown senders on 198.51.x.x', severity: 'High', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { title: 'Update SPF record ΓÇö near 10 lookup limit', severity: 'Medium', color: 'text-brand-400', bg: 'bg-brand-500/10' },
                            { title: 'Move DMARC policy from none ΓåÆ quarantine', severity: 'Recommended', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3 border border-slate-700/50">
                              <span className="text-xs text-slate-300">{item.title}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.bg} ${item.color}`}>{item.severity}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute -inset-4 bg-brand-500/5 rounded-3xl blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          COMPLIANCE TABLE
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Compliance
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                DMARC Compliance Made Easy
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                DMARC is mandatory in many industries globally. Your business needs to become compliant quickly, accurately, and without risk.
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 skeuo-table">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Regulation</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Requirement</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Scope</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Industry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[
                    { name: 'Google & Yahoo Sender Requirements', req: 'SPF, DKIM, and DMARC for bulk senders', scope: 'Global (Feb 2024)', industry: 'All (5,000+ emails/day)' },
                    { name: 'Microsoft Sender Requirements', req: 'SPF, DKIM, and DMARC for sending domains', scope: 'Global (May 2025)', industry: 'All (5,000+ emails/day)' },
                    { name: 'GDPR', req: 'Data privacy and security law', scope: 'EU Countries', industry: 'All Industries' },
                    { name: 'PCI DSS 4.0', req: 'Protect payment card data', scope: 'Global (Mar 2025)', industry: 'Payment Processing' },
                    { name: 'HIPAA', req: 'Protect personal health information', scope: 'United States', industry: 'Healthcare' },
                    { name: 'NIS 2 Directive', req: 'ICT cybersecurity risk management', scope: 'EU (Oct 2024)', industry: 'Telecoms, Health, Energy' },
                    { name: 'DORA', req: 'ICT cybersecurity risk framework', scope: 'EU (Jan 2025)', industry: 'Financial Institutions' },
                  ].map((reg, i) => (
                    <tr key={i} className="table-row-hover transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{reg.name}</td>
                      <td className="px-6 py-4 text-slate-400">{reg.req}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {reg.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{reg.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          ANIMATED STATS COUNTERS
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-20 bg-slate-900/30 relative overflow-hidden border-y border-slate-800/50">
        <div className="absolute inset-0 hero-glow-bottom opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Guard Against Financial, Data, and Customer Loss
              </h2>
              <p className="text-slate-400 mt-2">
                Use Inmybox to prevent cybercriminals from sending fraudulent emails from your domain.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { ref: c1.ref, display: c1.display, label: 'Domain Spoofing Attempts', sub: 'BLOCKED PER DAY' },
              { ref: c2.ref, display: c2.display, label: 'Emails Authenticated', sub: 'PER DAY' },
              { ref: c3.ref, display: c3.display, label: 'Data Points Analyzed', sub: 'PER DAY' },
              { ref: c4.ref, display: c4.display, label: 'Domains Protected', sub: 'WORLDWIDE' },
            ].map((stat, i) => (
              <div key={i} ref={stat.ref} className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 card-hover skeuo-card">
                <div className="text-3xl md:text-4xl font-bold text-brand-400 mb-2">{stat.display}</div>
                <div className="text-sm text-white font-medium">{stat.label}</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          HOW IT WORKS
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="how-it-works" className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                How It Works
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Three Steps to Email Clarity
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Get started in minutes. No complex integrations required.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-brand-500/30 via-brand-400/50 to-brand-500/30" />

            {[
              {
                step: '01',
                icon: Globe,
                title: 'Connect Your Domain',
                description: 'Add your domain and configure your DMARC record to start receiving reports. We guide you through every step.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'We Analyze Everything',
                description: 'Our engine parses DMARC reports, enriches IP data, classifies senders, and calculates delivery probability automatically.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Get Actionable Insights',
                description: 'See delivery health, sender trust, business impact metrics, and prioritized action items. Know exactly what to fix.',
              },
            ].map((item, i) => (
              <AnimateOnScroll key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border-2 border-brand-500/20 mb-6 relative skeuo-well">
                    <item.icon className="w-7 h-7 text-brand-400" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          TESTIMONIALS
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Customer Stories
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Great Companies Trust Inmybox
              </h2>
              <p className="text-lg text-slate-400">
                Discover how businesses are protecting their email reputation and growing safely.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <div className="relative min-h-[280px]">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${
                    i === activeTestimonial
                      ? 'opacity-100 translate-y-0 testimonial-active'
                      : 'opacity-0 absolute inset-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 md:p-10 text-center skeuo-card">
                    <Quote className="w-10 h-10 text-brand-500/30 mx-auto mb-6" />
                    <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-brand-300 font-bold text-sm">
                          {t.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="text-white font-semibold">{t.name}</div>
                      <div className="text-sm text-slate-400">{t.role}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === activeTestimonial ? 'bg-brand-500 w-6' : 'bg-slate-700 hover:bg-slate-600 w-2.5'
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          FEATURED IN / PRESS LOGOS
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-8 font-medium">
            As Featured In
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14">
            {['TechCrunch', 'Forbes', 'Dark Reading', 'Computer Weekly', 'InfoSecurity', 'SecurityBoulevard'].map((name) => (
              <div key={name} className="text-slate-600 text-sm font-bold tracking-wider opacity-50 hover:opacity-80 transition-opacity">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          GLOBAL REACH
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                175,000+ Domains from 130+ Countries
              </h2>
              <p className="text-lg text-slate-400">
                A global presence protecting email infrastructure worldwide.
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 md:p-12 skeuo-card">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  {[
                    { region: 'North America', domains: '62K+', offices: 'US HQ' },
                    { region: 'Europe', domains: '58K+', offices: 'UK & NL' },
                    { region: 'Asia Pacific', domains: '35K+', offices: 'Expanding' },
                    { region: 'Rest of World', domains: '20K+', offices: 'Remote' },
                  ].map((r) => (
                    <div key={r.region} className="p-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-3 skeuo-well">
                        <Globe className="w-5 h-5 text-brand-400" />
                      </div>
                      <div className="text-xl font-bold text-white">{r.domains}</div>
                      <div className="text-sm text-slate-400 mt-1">{r.region}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.offices}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          PRICING
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="pricing" className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Pricing
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Start free. Scale as you grow. No hidden fees.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                description: 'Perfect for getting started with DMARC monitoring.',
                features: ['1 domain', 'Basic DMARC reports', 'SPF/DKIM monitoring', '7-day data retention', 'Community support'],
                cta: 'Get Started Free',
                href: '/auth/signup',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$49',
                period: '/month',
                description: 'For growing teams that need deeper visibility and automation.',
                features: ['Up to 10 domains', 'Advanced analytics', 'Sender intelligence', 'Business impact metrics', '90-day retention', 'Action items engine', 'Priority support'],
                cta: 'Start Free Trial',
                href: '/demo',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For organizations with complex email infrastructure.',
                features: ['Unlimited domains', 'Custom integrations', 'Dedicated DMARC engineer', 'SLA guarantee', 'Unlimited retention', 'SSO & SAML', 'Onboarding & training'],
                cta: 'Contact Sales',
                href: '/demo',
                popular: false,
              },
            ].map((plan, i) => (
              <AnimateOnScroll key={plan.name} delay={i * 120}>
                <div className={`relative rounded-2xl border p-8 h-full flex flex-col card-hover ${
                  plan.popular
                    ? 'border-brand-500/50 bg-slate-900/80 skeuo-pricing-popular'
                    : 'border-slate-800 bg-slate-900/50 skeuo-card'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold bg-brand-600 text-white rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                      plan.popular
                        ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25'
                        : 'border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          FINAL CTA
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Make Your DMARC Journey Simple With Inmybox
            </h2>
            <p className="text-lg text-brand-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of domains that trust Inmybox to monitor email delivery health, identify sender risks, and protect their revenue pipeline.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-white text-brand-700 hover:bg-brand-50 transition-all shadow-xl hover:-translate-y-0.5 skeuo-btn">
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all">
                Start Free Trial
              </Link>
            </div>
            <p className="text-sm text-brand-200 mt-6">
              Free domain scan ┬╖ No commitment required ┬╖ SOC&nbsp;2 ready
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          FOOTER
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Inmybox</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Email reputation intelligence for growth teams. Know your delivery health. Protect your pipeline.
              </p>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Free Tools</h4>
              <ul className="space-y-2.5">
                {['DMARC Checker', 'SPF Checker', 'DKIM Checker', 'Domain Scanner', 'IP Reputation'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {['DMARC Analytics', 'Sender Intelligence', 'Business Impact', 'Action Items', 'Export & Reports'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'About', href: '#' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Careers', href: '#' },
                  { label: 'Contact', href: 'mailto:hello@inmybox.io' },
                  { label: 'Partners', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/privacy' },
                  { label: 'GDPR', href: '/privacy' },
                  { label: 'Security', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Inmybox. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </main>
  )
}
