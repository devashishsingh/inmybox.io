'use client'

// INMYBOX REDESIGN — Spiritual Industrial Landing Page (2026-05-03)
// Visual shell only — copy preserved from original landing-page.tsx

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Mail,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  DollarSign,
  Zap,
  Activity,
  ShieldCheck,
  FileBarChart,
  Star,
  Edit3,
  Sparkles,
  Pencil,
  ChevronRight,
  Inbox,
  Clock,
  Target,
} from 'lucide-react'
import { NavbarV2 } from '@/components/landing-nav-v2'
import { CookieBanner } from '@/components/cookie-banner'
import { DomainScanner } from '@/components/domain-scanner'

/* ─── Animated counter ───────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, suffix = '') {
  const [v, setV] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!started) return
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setV(Math.floor(p * target))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])
  return { ref, display: `${v.toLocaleString()}${suffix}` }
}

/* ─── Bento mouse-follow glow ────────────────────────────────────── */
function useGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])
  return ref
}

export function LandingPageV2() {
  return (
    <div className="ember-root relative min-h-screen ember-bg overflow-x-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ember-stars-1" />
        <div className="ember-stars-2" />
        <div className="absolute inset-0 ember-grid" />
      </div>

      <NavbarV2 />

      <Hero />
      <StatsStrip />
      <FeaturesBento />
      <DashboardSection />
      <TestimonialBanner />
      <FooterV2 />
      <CookieBanner />
    </div>
  )
}

/* ═══ HERO ════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-16 z-10">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid gap-10 items-center lg:grid-cols-[55%_45%] transition-all duration-500">
          {/* Copy */}
          <div className="text-center lg:text-left">
            {/* Pulsing badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full ember-glass">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-50" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-indigo-400" />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-300/80">
                Email Delivery Intelligence
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] mb-6 tracking-[-0.04em]">
              <span className="ember-heading">Know exactly where </span>
              <span className="ember-heading">every email lands &mdash; </span>
              <span className="text-indigo-400">own the inbox.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Most businesses pay hundreds every month for DMARC dashboards they check twice a year.
              Inmybox fixes your email deliverability once, shows you exactly what it was costing you,
              and gives you two free health checks a year. No subscriptions. No lock-in. Just results.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30">
                <span>Request a Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Value proposition strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>One-time fix — no monthly fees</span>
              </div>
              <div className="hidden sm:block w-px h-3.5 bg-zinc-700" />
              <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Results in under 48 hours</span>
              </div>
              <div className="hidden sm:block w-px h-3.5 bg-zinc-700" />
              <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>2 free assessments per year</span>
              </div>
            </div>

            <div className="max-w-2xl">
              <DomainScanner />
            </div>
          </div>

          {/* Dashboard mock with floating cards */}
          <HeroDashboardMock />
        </div>
      </div>
    </section>
  )
}

/* ═══ HERO DASHBOARD MOCK ═════════════════════════════════════════ */
function HeroDashboardMock() {
  return (
    <div className="relative hidden lg:block">
      {/* Floating card: Inbox Rate (top-right) */}
      <div className="absolute -top-2 -right-4 z-30 ember-float" style={{ animationDelay: '0s' }}>
        <div className="ember-float-card ember-float-card-emerald flex items-center gap-2.5">
          <div className="icon-3d icon-3d-emerald">
            <Inbox className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Inbox Rate</div>
            <div className="text-sm font-bold text-emerald-400">
              94.1% <span className="text-emerald-300/80 text-[10px] font-medium">&uarr; 2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card: SPF Pass (mid-right) */}
      <div className="absolute top-1/2 -right-6 z-30 ember-float" style={{ animationDelay: '1.5s' }}>
        <div className="ember-float-card ember-float-card-gold flex items-center gap-2.5">
          <div className="icon-3d icon-3d-indigo">
            <ShieldCheck className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">SPF Pass</div>
            <div className="text-sm font-bold text-indigo-400">98.2%</div>
          </div>
        </div>
      </div>

      {/* Floating card: Revenue at Risk (bottom-left) */}
      <div className="absolute -bottom-4 -left-4 z-30 ember-float" style={{ animationDelay: '3s' }}>
        <div className="ember-float-card ember-float-card-red flex items-center gap-2.5">
          <div className="icon-3d icon-3d-red">
            <DollarSign className="w-4 h-4 text-red-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Revenue at Risk</div>
            <div className="text-sm font-bold text-red-400">$1,240</div>
          </div>
        </div>
      </div>

      {/* Main mock window */}
      <div className="relative ember-glass-strong rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-black/40">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-[11px] text-zinc-500 font-mono">dashboard.inmybox.io</span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-12 border-r border-white/5 bg-black/30 py-4 flex flex-col items-center gap-3">
            <div className="icon-3d icon-3d-indigo w-7 h-7 rounded-md">
              <Mail className="w-3.5 h-3.5 text-indigo-200" />
            </div>
            <div className="w-6 h-6 rounded bg-white/5" />
            <div className="w-6 h-6 rounded bg-white/5" />
            <div className="w-6 h-6 rounded bg-white/5" />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">
              Email Delivery Health
            </div>

            {/* 3 stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'SPF Pass', val: '98.2%', tone: 'text-emerald-400' },
                { label: 'DKIM Health', val: '96.7%', tone: 'text-emerald-400' },
                { label: 'Inbox Rate', val: '94.1%', tone: 'text-amber-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                    {s.label}
                  </div>
                  <div className={`text-xl font-display font-bold ${s.tone}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Trend chart placeholder */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-zinc-400">Delivery Trend (7d)</div>
                <span className="ember-pill ember-pill-emerald">↑ Healthy</span>
              </div>
              <svg viewBox="0 0 200 50" className="w-full h-14">
                <defs>
                  <linearGradient id="grad-trend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,38 L20,32 L40,34 L60,26 L80,28 L100,20 L120,22 L140,14 L160,16 L180,10 L200,12 L200,50 L0,50 Z"
                  fill="url(#grad-trend)"
                />
                <path
                  d="M0,38 L20,32 L40,34 L60,26 L80,28 L100,20 L120,22 L140,14 L160,16 L180,10 L200,12"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* Top senders */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <div className="text-[11px] text-zinc-400 mb-3">Top Senders</div>
              <div className="space-y-2 text-[12px] font-mono">
                {[
                  { ip: '203.0.113.1', label: 'Trusted', tone: 'ember-pill-emerald' },
                  { ip: '198.51.100.5', label: 'Unknown', tone: 'ember-pill-saffron' },
                  { ip: '192.0.2.146', label: 'Review', tone: 'ember-pill-red' },
                ].map((r) => (
                  <div key={r.ip} className="flex items-center justify-between">
                    <span className="text-zinc-400">{r.ip}</span>
                    <span className={`ember-pill ${r.tone}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ STATS STRIP ═════════════════════════════════════════════════ */
function StatsStrip() {
  const items = [
    { value: 'Continuous', label: 'Monitoring' },
    { value: 'Real-time', label: 'Parsing' },
    { value: '200+', label: 'Providers Detected' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '< 2min', label: 'Setup' },
  ]
  return (
    <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5">
        {items.map((s) => (
          <div key={s.label} className="ember-stat border-r border-white/[0.04] last:border-r-0">
            <div className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-1.5 font-semibold">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ═══ FEATURES BENTO ══════════════════════════════════════════════ */
function FeaturesBento() {
  const big = useGlow()
  const wide = useGlow()
  const a = useGlow()
  const b = useGlow()

  return (
    <section id="features" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header pill */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-indigo-300/80">
              Core Capabilities
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold ember-heading max-w-3xl mx-auto leading-tight">
            Everything you need to <span className="text-indigo-400">own</span> your sender reputation
          </h2>
          <p className="text-zinc-400 mt-5 max-w-2xl mx-auto">
            Aggregate DMARC reports, identify every sender, and translate failures into the only
            metric that matters — revenue.
          </p>
        </div>

        {/* Grid: 1 large 2x2, 1 wide 2x1, 2 small 1x1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-[auto_auto] gap-5">
          {/* LARGE 2x2 — Issued Asset Preview re-themed as Active Reports */}
          <div ref={big} className="ember-bento md:col-span-2 md:row-span-2 p-7">
          <div className="flex items-center gap-2 mb-4">
              <FileBarChart className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-indigo-300/90">
                Unified DMARC Aggregation
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
              Every report. Every domain. One view.
            </h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Auto-parse XML, ZIP, GZ and 7z aggregate reports from every major mailbox provider.
              See SPF, DKIM and DMARC alignment across all your sending sources.
            </p>

            {/* Mini "Active Reports" preview */}
            <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Active Reports</span>
                <span className="text-[10px] text-emerald-400">● Live</span>
              </div>
              {[
                { org: 'Google', domain: 'acme.io', status: 'Processed', tone: 'ember-pill-emerald' },
                { org: 'Yahoo', domain: 'acme.io', status: 'Processing', tone: 'ember-pill-saffron' },
                { org: 'Microsoft', domain: 'mail.acme.io', status: 'Processed', tone: 'ember-pill-emerald' },
                { org: 'Mail.ru', domain: 'acme.io', status: 'Failed', tone: 'ember-pill-red' },
              ].map((r) => (
                <div
                  key={r.org}
                  className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center">
                      <Mail className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{r.org}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{r.domain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`ember-pill ${r.tone}`}>{r.status}</span>
                    <button className="p-1 rounded hover:bg-white/5">
                      <Pencil className="w-3 h-3 text-zinc-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WIDE 2x1 — Sender Intelligence */}
          <div ref={wide} className="ember-bento ember-bento-emerald md:col-span-2 p-7">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-300/80">
              Sender Intelligence
            </span>
          </div>
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
              Know every IP sending as you.
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Identify every IP and service sending email under your domain. Auto-classify trusted
              services, flag unknown senders, track suspicious activity before it harms your
              reputation. 200+ providers detected.
            </p>
          </div>

          {/* SMALL 1x1 — Business Impact */}
          <div ref={a} className="ember-bento ember-bento-red p-6">
            <div className="icon-3d icon-3d-red w-10 h-10 rounded-xl mb-4">
              <TrendingUp className="w-5 h-5 text-red-300" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1.5">Revenue Impact</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Translate failures into revenue at risk, lead loss, and campaign health scores.
            </p>
          </div>

          {/* SMALL 1x1 — Action Items */}
          <div ref={b} className="ember-bento p-6">
            <div className="icon-3d icon-3d-indigo w-10 h-10 rounded-xl mb-4">
              <Zap className="w-5 h-5 text-indigo-300" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1.5">Action Items</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Prioritized, one-click guidance for every issue. Stop guessing what to fix first.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ DASHBOARD SECTION ═══════════════════════════════════════════ */
function DashboardSection() {
  const features = [
    {
      title: 'Real-time DMARC ingestion',
      desc: 'Reports land in your inbox and parse automatically — no uploads, no manual work.',
    },
    {
      title: 'Sender classification',
      desc: 'Every IP is auto-tagged: legitimate, marketing, transactional, or suspicious.',
    },
    {
      title: 'Trust scoring',
      desc: 'Weighted SPF, DKIM, DMARC and disposition produce a clear 0–100 trust score.',
    },
    {
      title: 'Revenue-at-risk',
      desc: 'See estimated lead loss and revenue impact in your own currency, your own conversion rate.',
    },
  ]

  return (
    <section id="how-it-works" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
        {/* Left — feature lines */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 mb-5">
            <Activity className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-300/80">
              DMARC Report Intelligence
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold ember-heading mb-5 tracking-tight leading-tight">
            From raw XML to <span className="text-indigo-400">board-ready</span> insight.
          </h2>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            Inmybox ingests, parses, attributes and enriches every DMARC report — then turns it
            into the language your business actually speaks.
          </p>

          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="ember-feature-line">
                <h4 className="font-display text-lg font-semibold text-white mb-1">{f.title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Issue Dashboard mockup */}
        <DashboardMock />
      </div>
    </section>
  )
}

function DashboardMock() {
  const rows = [
    { asset: 'mail.acme.io', person: 'Google SMTP', date: 'Apr 28', ret: 'Apr 29', status: 'Returned', tone: 'ember-pill-emerald' },
    { asset: 'newsletter.acme', person: 'SendGrid', date: 'Apr 27', ret: 'Apr 30', status: 'Issued', tone: 'ember-pill-saffron' },
    { asset: 'tx.acme.io', person: 'AWS SES', date: 'Apr 25', ret: '—', tone: 'ember-pill-emerald', status: 'Returned' },
    { asset: 'support.acme', person: 'Unknown 198.51.100.5', date: 'Apr 22', ret: 'Overdue', status: 'Overdue', tone: 'ember-pill-red' },
    { asset: 'promo.acme', person: 'Mailchimp', date: 'Apr 20', ret: 'Apr 24', status: 'Returned', tone: 'ember-pill-emerald' },
  ]

  return (
    <div className="ember-glass-strong rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-400 font-semibold">
          DMARC Report Activity
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">● live</span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-5">
        <StatTile label="Issued" value="14" tone="text-amber-400" />
        <StatTile label="Returned" value="42" tone="text-emerald-400" />
        <StatTile label="Overdue" value="3" tone="text-red-400" />
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr_0.9fr_0.4fr] gap-3 px-4 py-2.5 bg-white/[0.02] text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            <div>Asset</div>
            <div>Person</div>
            <div>Issue Date</div>
            <div>Return</div>
            <div>Status</div>
            <div></div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.asset}
              className={`grid grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr_0.9fr_0.4fr] gap-3 px-4 py-3 text-[12px] items-center border-t border-white/[0.04] ${
                i % 2 ? 'bg-white/[0.015]' : ''
              }`}
            >
              <div className="font-mono text-white truncate">{r.asset}</div>
              <div className="text-zinc-400 truncate">{r.person}</div>
              <div className="text-zinc-500">{r.date}</div>
              <div className="text-zinc-500">{r.ret}</div>
              <div>
                <span className={`ember-pill ${r.tone}`}>{r.status}</span>
              </div>
              <button className="justify-self-end p-1 rounded hover:bg-white/5">
                <Pencil className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-semibold">
        {label}
      </div>
      <div className={`font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  )
}

/* ═══ TESTIMONIAL BANNER ══════════════════════════════════════════ */
function TestimonialBanner() {
  return (
    <section className="relative z-10 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #0d1120 0%, #141c35 50%, #0d1120 100%)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
          <div className="flex justify-center gap-1 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-indigo-300/80">
                Industry Insight
              </span>
            </div>
          </div>
          <blockquote className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            &ldquo;Companies achieving full DMARC enforcement typically see inbox rates improve from
            ~70% to 95%+ within 30 days.&rdquo;
          </blockquote>
          <div className="mt-8 text-slate-400 font-medium">
            <div className="text-xs uppercase tracking-[0.18em]">&mdash; Inmybox Analysis</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ FOOTER ══════════════════════════════════════════════════════ */
function FooterV2() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <footer className="relative z-10 border-t border-white/[0.06] pt-16 pb-0 overflow-hidden">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1.4fr] gap-x-8 gap-y-12 pb-14 border-b border-white/[0.06]">

          {/* Column 1 — Product */}
          <div>
            <p className="text-sm font-semibold text-white mb-5">Product</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/blue-tick" className="hover:text-white transition-colors">BIMI &amp; Blue Tick</Link></li>
            </ul>

            <p className="text-sm font-semibold text-white mt-8 mb-5">Resources</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Request Demo</Link></li>
              <li><Link href="/docs/setup" className="hover:text-white transition-colors">Setup Guide</Link></li>
              <li>
                <a href="mailto:hello@inmybox.io?subject=Onboarding%20Guide%20Request" className="hover:text-white transition-colors">
                  Onboarding Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 — Why InMyBox? */}
          <div>
            <p className="text-sm font-semibold text-white mb-5">Why InMyBox?</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/#features" className="hover:text-white transition-colors">DMARC Aggregation</Link></li>
              <li><Link href="/#features" className="hover:text-white transition-colors">Sender Intelligence</Link></li>
              <li><Link href="/#features" className="hover:text-white transition-colors">Revenue Impact</Link></li>
              <li>
                <a href="mailto:hello@inmybox.io?subject=ROI%20Whitepaper%20Request" className="hover:text-white transition-colors">
                  ROI Whitepaper
                </a>
              </li>
            </ul>

            <p className="text-sm font-semibold text-white mt-8 mb-5">Help &amp; Support</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="mailto:hello@inmybox.io" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><Link href="/docs/setup" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <p className="text-sm font-semibold text-white mb-5">Company</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><a href="mailto:hello@inmybox.io" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="mailto:hello@inmybox.io" className="hover:text-white transition-colors">Partners</a></li>
              <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Column 4 — Newsletter + Socials */}
          <div>
            <p className="text-sm font-semibold text-white mb-2">Stay in the loop</p>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              Get a curated digest of email deliverability insights, DMARC best practices, and
              inbox placement tips — straight to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>You&apos;re subscribed. Talk soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 mb-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}

            <p className="text-[11px] text-zinc-600 leading-relaxed mb-7">
              No spam. Unsubscribe any time. By subscribing you agree to our{' '}
              <Link href="/privacy" className="text-zinc-500 hover:text-white underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              <SocialIcon href="https://linkedin.com/company/inmybox" label="LinkedIn">
                <LinkedInLogo />
              </SocialIcon>
              <SocialIcon href="https://twitter.com/inmybox" label="X (Twitter)">
                <XLogo />
              </SocialIcon>
              <SocialIcon href="mailto:hello@inmybox.io" label="Email" external={false}>
                <Mail className="w-3.5 h-3.5" />
              </SocialIcon>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <span className="font-display font-bold text-white text-sm">Inmybox</span>
          </Link>
          <div className="text-[12px] text-zinc-600">
            © {new Date().getFullYear()} Inmybox. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Social icon pill ───────────────────────────────────────────── */
function SocialIcon({
  href,
  label,
  external = true,
  children,
}: {
  href: string
  label: string
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="w-9 h-9 rounded-full border border-white/[0.12] bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/25 hover:bg-white/[0.07] transition-all"
    >
      {children}
    </a>
  )
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}


