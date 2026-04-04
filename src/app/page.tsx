'use client'

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
} from 'lucide-react'
import { Navbar } from '@/components/landing-nav'
import { AnimateOnScroll } from '@/components/animate'
import { CookieBanner } from '@/components/cookie-banner'

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-center bg-slate-950 hero-grid overflow-hidden">
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Now in Beta &mdash; Request Early Access
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-6">
                Your Emails{' '}
                <span className="gradient-text">Deserve</span>
                <br />
                to Be Seen
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Stop losing leads to spam folders. Inmybox gives you real&#8209;time
                visibility into email delivery health, sender reputation, and the
                business impact of every authentication failure.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-8">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
                >
                  Request a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white transition-all"
                >
                  See How It Works
                </Link>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-4 justify-center lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free personalized demo
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2&#8209;minute setup
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SOC&nbsp;2 ready
                </span>
              </p>
            </div>

            {/* Right — Dashboard Mock */}
            <div className="relative hidden lg:block">
              <div className="relative animate-float">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-brand-500/10 overflow-hidden">
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
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF BAR ═══════════ */}
      <section className="py-10 bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '2M+', label: 'Emails Analyzed' },
              { value: '<2min', label: 'Setup Time' },
              { value: 'SOC 2', label: 'Compliance Ready' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM ═══════════ */}
      <section className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                The Problem
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Email Failures Are Silently Killing Your Pipeline
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Your marketing and sales emails are failing authentication checks. Without
                visibility, you can&apos;t fix what you can&apos;t see.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: AlertTriangle,
                title: 'Invisible Delivery Failures',
                description:
                  'Your carefully crafted campaigns are silently hitting spam folders. Without real-time monitoring, you have zero visibility into failures.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Users,
                title: 'Unknown Domain Senders',
                description:
                  'Unauthorized services or bad actors may be sending emails under your domain, silently destroying your sender reputation.',
                color: 'text-red-400',
                bg: 'bg-red-500/10',
              },
              {
                icon: DollarSign,
                title: 'Revenue Impact Blindspot',
                description:
                  'Every email that lands in spam is a lost lead. Without connecting delivery data to business metrics, you can\'t quantify the damage.',
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
              },
            ].map((card, i) => (
              <AnimateOnScroll key={card.title} delay={i * 120}>
                <div className="card-hover bg-slate-900/50 rounded-2xl border border-slate-800 p-8 h-full">
                  <div
                    className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-5`}
                  >
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{card.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="py-24 md:py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                The Solution
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Complete Email Reputation Intelligence
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Inmybox transforms raw DMARC data into actionable business intelligence.
                See what&apos;s failing, why it matters, and how to fix it.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'DMARC Aggregation',
                description:
                  'Upload or connect DMARC reports. Visualize SPF, DKIM, and DMARC results across every sender and IP.',
                color: 'text-brand-400',
                bg: 'bg-brand-500/10',
              },
              {
                icon: Activity,
                title: 'Delivery Prediction',
                description:
                  'Our weighted engine calculates inbox probability, spam risk, and rejection likelihood for every message flow.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: TrendingUp,
                title: 'Business Impact',
                description:
                  'See estimated lead loss, revenue at risk, and campaign health scores based on your conversion assumptions.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/10',
              },
              {
                icon: Eye,
                title: 'Sender Intelligence',
                description:
                  'Identify every IP sending under your domain. Label trusted services, flag unknowns, and track suspicious senders.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
              },
            ].map((feature, i) => (
              <AnimateOnScroll key={feature.title} delay={i * 100}>
                <div className="card-hover bg-slate-900/50 rounded-2xl border border-slate-800 p-7 h-full">
                  <div
                    className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
      <section className="py-24 md:py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Product Preview
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Everything You Need. One Dashboard.
              </h2>
              <p className="text-lg text-slate-400">
                A unified view of your email authentication health, sender trust, and business impact metrics.
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="relative max-w-5xl mx-auto">
              <div className="preview-glow rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {/* Window bar */}
                <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="ml-4 flex-1 max-w-sm mx-auto bg-slate-800 rounded-md px-4 py-1.5 text-xs text-slate-500 text-center border border-slate-700/50">
                    app.inmybox.io/dashboard
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden sm:block w-52 border-r border-slate-800 p-4 bg-slate-900/40">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white">Inmybox</span>
                    </div>
                    <nav className="space-y-1">
                      {[
                        { label: 'Overview', active: true },
                        { label: 'Reports' },
                        { label: 'Senders' },
                        { label: 'Export' },
                        { label: 'Settings' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                            item.active
                              ? 'bg-brand-500/10 text-brand-400'
                              : 'text-slate-500'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded ${
                              item.active ? 'bg-brand-500/30' : 'bg-slate-700'
                            }`}
                          />
                          {item.label}
                        </div>
                      ))}
                    </nav>
                  </div>

                  {/* Main dashboard area */}
                  <div className="flex-1 p-5 sm:p-6 space-y-5 min-h-[400px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-base font-semibold text-white">
                          Email Delivery Overview
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Last 30 days · acme.com
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full">
                        Healthy
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'SPF Pass Rate', value: '98.2%', trend: '+1.3%', color: 'text-emerald-400' },
                        { label: 'DKIM Health', value: '96.7%', trend: '+0.8%', color: 'text-emerald-400' },
                        { label: 'Inbox Rate', value: '94.1%', trend: '+2.1%', color: 'text-brand-400' },
                        { label: 'Revenue at Risk', value: '$1,240', trend: '-15%', color: 'text-amber-400' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-slate-800 rounded-xl p-4 border border-slate-700/50"
                        >
                          <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                          <div className={`text-xl font-bold ${stat.color}`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-emerald-400 mt-1">{stat.trend}</div>
                        </div>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="grid lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs font-medium text-slate-400 mb-4">
                          Delivery Trend
                        </div>
                        <div className="flex items-end gap-[3px] h-28">
                          {[65, 72, 68, 80, 75, 85, 82, 88, 84, 90, 88, 92, 89, 94, 91, 95, 93, 96, 94, 95].map(
                            (h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-t bg-brand-400/70 transition-all hover:bg-brand-400"
                                style={{ height: `${h}%` }}
                              />
                            )
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs font-medium text-slate-400 mb-4">Auth Results</div>
                        <div className="flex justify-center">
                          <div className="relative w-28 h-28">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="12" />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="12"
                                strokeDasharray={`${94 * 2.51} ${100 * 2.51}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">94%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-2 text-xs text-slate-500">DMARC Pass Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background glow */}
              <div className="absolute -inset-8 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent rounded-3xl blur-3xl -z-10" />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════ BUSINESS VALUE ═══════════ */}
      <section className="py-24 md:py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 hero-glow-bottom opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
                Business Value
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Turn Technical Failures Into Revenue Intelligence
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Inmybox doesn&apos;t just show you authentication results. It connects
                delivery health to your pipeline, leads, and revenue.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {[
              {
                icon: BarChart3,
                title: 'Know Your True Reach',
                description:
                  'See exactly how many of your emails actually reach the inbox vs. spam or rejection.',
                metric: '94.1%',
                metricLabel: 'Avg. Inbox Rate',
              },
              {
                icon: TrendingUp,
                title: 'Estimate Lead Impact',
                description:
                  'Calculate how many leads you&apos;re losing to delivery failures based on your conversion rate.',
                metric: '~340',
                metricLabel: 'Leads at Risk / mo',
              },
              {
                icon: DollarSign,
                title: 'Protect Your Pipeline',
                description:
                  'Quantify the revenue impact of email failures and prioritize fixes that move the needle.',
                metric: '$17K',
                metricLabel: 'Revenue at Risk / mo',
              },
            ].map((card, i) => (
              <AnimateOnScroll key={card.title} delay={i * 120}>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 card-hover">
                  <card.icon className="w-8 h-8 text-brand-400 mb-5" />
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{card.description}</p>
                  <div className="pt-4 border-t border-slate-800">
                    <div className="text-2xl font-bold text-brand-400">{card.metric}</div>
                    <div className="text-xs text-slate-500 mt-1">{card.metricLabel}</div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Impact flow */}
          <AnimateOnScroll>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {[
                { label: 'Auth Failure', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                { label: 'Spam Risk', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                { label: 'Lost Leads', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                { label: 'Revenue Impact', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full border font-medium ${step.color}`}>
                    {step.label}
                  </span>
                  {i < 3 && <ChevronRight className="w-4 h-4 text-slate-600" />}
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 md:py-32 bg-slate-900/30">
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
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200" />

            {[
              {
                step: '01',
                icon: Globe,
                title: 'Connect Your Domain',
                description:
                  'Add your domain and configure your DMARC record to start receiving reports. We guide you through every step.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Upload DMARC Reports',
                description:
                  'Drag and drop your XML or ZIP reports. Our engine parses, validates, and normalizes every record automatically.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Get Actionable Insights',
                description:
                  'See delivery health, sender trust scores, and business impact metrics. Know exactly what to fix and why.',
              },
            ].map((item, i) => (
              <AnimateOnScroll key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 border-2 border-brand-100 mb-6 relative">
                    <item.icon className="w-7 h-7 text-brand-600" />
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

      {/* ═══════════ WAITLIST / EMAIL SIGNUP ═══════════ */}
      <section className="py-16 bg-slate-950 border-y border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll>
            <Lock className="w-8 h-8 text-brand-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to See Inmybox in Action?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Book a personalized walkthrough. Our team will show you real insights using your own domain data.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/20"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
              Start Protecting Your Email Reputation Today
            </h2>
            <p className="text-lg text-brand-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join growth teams who trust Inmybox to monitor email delivery health,
              identify sender risks, and protect their revenue pipeline.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-white text-brand-700 hover:bg-brand-50 transition-all shadow-xl hover:-translate-y-0.5"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
            <p className="text-sm text-brand-200 mt-6">
              Personalized walkthrough &middot; No commitment required
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Inmybox</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Email reputation intelligence for growth teams. Know your delivery health.
                Protect your pipeline.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Dashboard', 'DMARC Analytics', 'Sender Intelligence', 'Pricing'].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Contact', 'Partners'].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item}
                    </a>
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
