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
import { DomainScanner } from '@/components/domain-scanner'
import { CookieBanner } from '@/components/cookie-banner'

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
  const [hasScan, setHasScan] = useState(false)
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-16 z-10">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className={`grid gap-10 items-center ${hasScan ? 'lg:grid-cols-1' : 'lg:grid-cols-[55%_45%]'} transition-all duration-500`}>
          {/* Copy */}
          <div className="text-center lg:text-left">
            {/* Pulsing badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full ember-glass">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-400" />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-300/90">
                Email Reputation Intelligence
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] mb-6 tracking-[-0.04em]">
              <span className="ember-heading">You are losing revenue every time your email lands in </span>
              <span className="text-[#ef233c] ember-squiggle">spam.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Most companies don&apos;t know their emails aren&apos;t reaching the inbox. By the time
              they notice, leads have gone cold and revenue has quietly disappeared. Inmybox closes
              the gap between sent and seen.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
              <Link href="/auth/signup" className="ember-shiny-cta">
                <span>Start Free Audit</span>
                <ArrowRight className="w-4 h-4 ember-cta-icon" />
              </Link>
              <Link href="/demo" className="ember-ghost">
                <span>Request a Demo</span>
              </Link>
            </div>

            <div className="max-w-2xl">
              <DomainScanner onScanResult={setHasScan} />
            </div>
          </div>

          {/* Dashboard mock with floating cards */}
          {!hasScan && <HeroDashboardMock />}
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
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Inbox Rate</div>
            <div className="text-sm font-bold text-emerald-400">
              94.1% <span className="text-emerald-300/80 text-[10px] font-medium">↑ 2.1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card: SPF Pass (mid-right) */}
      <div className="absolute top-1/2 -right-6 z-30 ember-float" style={{ animationDelay: '1.5s' }}>
        <div className="ember-float-card ember-float-card-gold flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">SPF Pass</div>
            <div className="text-sm font-bold text-amber-400">98.2%</div>
          </div>
        </div>
      </div>

      {/* Floating card: Revenue at Risk (bottom-left) */}
      <div className="absolute -bottom-4 -left-4 z-30 ember-float" style={{ animationDelay: '3s' }}>
        <div className="ember-float-card ember-float-card-red flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-red-400" />
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
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-red-500/80 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-black" />
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
    { value: '50K+', label: 'Reports Processed' },
    { value: '12K+', label: 'Senders Monitored' },
    { value: '99.9%', label: 'Parse Accuracy' },
    { value: '$14K', label: 'Avg. Recovery / mo' },
    { value: '< 2d', label: 'Issue Resolution' },
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 mb-5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-300">
              Core Capabilities
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold ember-heading max-w-3xl mx-auto leading-tight">
            Everything you need to <span className="text-[#ef233c]">protect</span> your sender reputation
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
              <FileBarChart className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-amber-300/90">
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
              <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-300/90">
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
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1.5">Revenue Impact</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Translate failures into revenue at risk, lead loss, and campaign health scores.
            </p>
          </div>

          {/* SMALL 1x1 — Action Items */}
          <div ref={b} className="ember-bento p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 mb-5">
            <Activity className="w-3 h-3 text-red-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-red-300">
              Asset Tracking — DMARC Reports
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold ember-heading mb-5 tracking-tight leading-tight">
            From raw XML to <span className="text-[#ef233c]">CFO-ready</span> insight.
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
              'linear-gradient(135deg, #ef233c 0%, #f59e0b 55%, #d4a843 100%)',
          }}
        >
          <div className="flex justify-center gap-1 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 fill-black text-black" />
            ))}
          </div>
          <blockquote className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-black tracking-tight leading-tight max-w-4xl mx-auto">
            “Inmybox gave us instant visibility into email delivery issues we didn&apos;t even know
            we had. Within a week, our inbox rate jumped from 87% to 96%.”
          </blockquote>
          <div className="mt-8 text-black/70 font-medium">
            <div className="text-sm">Sarah Chen</div>
            <div className="text-xs uppercase tracking-[0.18em]">Head of Growth, ScaleUp SaaS</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ FOOTER ══════════════════════════════════════════════════════ */
function FooterV2() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] pt-20 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12 mb-16">
        {/* Branding */}
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <span className="ember-avatar">
              <Mail className="w-4 h-4 text-amber-400" />
            </span>
            <span className="font-display font-bold text-white text-lg">Inmybox</span>
          </Link>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
            Email reputation intelligence for growth teams. Closing the gap between sent and seen.
          </p>
        </div>

        {/* Platform */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-300/80 mb-4">
            Platform
          </div>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li><Link href="/#features" className="hover:text-white">Features</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link href="/blue-tick" className="hover:text-white">Blue Tick / BIMI</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/demo" className="hover:text-white">Request Demo</Link></li>
          </ul>
        </div>

        {/* Legal & resources */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-300/80 mb-4">
            Resources
          </div>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link href="/auth/signin" className="hover:text-white">Sign In</Link></li>
            <li><Link href="/auth/signup" className="hover:text-white">Get Started</Link></li>
          </ul>
        </div>
      </div>

      {/* Watermark */}
      <div className="ember-watermark mb-10 overflow-hidden">INMYBOX</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-white/[0.06] flex flex-wrap justify-between items-center gap-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          © {new Date().getFullYear()} Inmybox · All rights reserved
        </div>
        <div className="flex items-center gap-2">
          <SocialLink href="https://twitter.com/inmybox" label="X (Twitter)" tone="x">
            <XLogo />
          </SocialLink>
          <SocialLink href="https://linkedin.com/company/inmybox" label="LinkedIn" tone="linkedin">
            <LinkedInLogo />
          </SocialLink>
          <SocialLink href="mailto:hello@inmybox.io" label="Email" tone="mail">
            <Mail className="w-4 h-4" />
          </SocialLink>
        </div>
      </div>
    </footer>
  )
}

/* ─── Social link wrapper + brand SVGs ───────────────────────────── */
function SocialLink({
  href,
  label,
  tone,
  children,
}: {
  href: string
  label: string
  tone: 'x' | 'linkedin' | 'mail'
  children: React.ReactNode
}) {
  const external = href.startsWith('http')
  const toneClass =
    tone === 'x'
      ? 'text-white hover:bg-white/10 border-white/20'
      : tone === 'linkedin'
        ? 'text-[#0A66C2] hover:bg-[#0A66C2]/15 border-[#0A66C2]/40'
        : 'text-amber-400 hover:bg-amber-400/15 border-amber-400/40'
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`w-9 h-9 rounded-full border bg-white/[0.02] flex items-center justify-center transition-colors ${toneClass}`}
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


