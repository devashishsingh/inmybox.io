import { Metadata } from 'next'
import Link from 'next/link'
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  BarChart3,
  Headphones,
  Globe,
  Lock,
  FileText,
  Users,
  Clock,
  HelpCircle,
} from 'lucide-react'
import { Navbar } from '@/components/landing-nav'
import { AnimateOnScroll } from '@/components/animate'
import { CookieBanner } from '@/components/cookie-banner'

export const metadata: Metadata = {
  title: 'Pricing — Plans for Every Domain',
  description:
    'Start free. Get DMARC monitoring, sender intelligence, and business impact analytics. Transparent pricing, no hidden fees.',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'One free domain scan per day. See your score, risk level, and finding titles.',
    cta: 'Scan Your Domain',
    href: '/',
    popular: false,
    features: [
      '1 domain scan per day',
      'Overall health score (0–100)',
      'Pillar scores (DMARC, SPF, DKIM, Config)',
      'Finding titles & risk level',
      'Scoring methodology docs',
    ],
    limitations: [
      'Details & recommendations locked',
      'Raw DNS records locked',
      'No continuous monitoring',
      'No email alerts',
    ],
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Daily monitoring for growing teams that need full visibility & fix guidance.',
    cta: 'Start 14-Day Free Trial',
    href: '/auth/signup?plan=starter',
    popular: false,
    features: [
      'Up to 5 domains',
      'Full finding details & recommendations',
      'Raw DNS record viewer',
      'Daily automated scans',
      'Email alerts on score changes',
      'DMARC report aggregation',
      '30-day data retention',
      'Email support',
    ],
    limitations: [],
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'Advanced analytics, sender intelligence, and business impact metrics for serious teams.',
    cta: 'Start 14-Day Free Trial',
    href: '/auth/signup?plan=pro',
    popular: true,
    features: [
      'Unlimited domains',
      'Everything in Starter',
      'Sender intelligence & IP enrichment',
      'Business impact dashboard',
      'Revenue-at-risk calculator',
      'Action items engine',
      'CSV & PDF compliance exports',
      '90-day data retention',
      'Priority support',
      'API access',
    ],
    limitations: [],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations with complex email infrastructure and compliance needs.',
    cta: 'Talk to Sales',
    href: 'mailto:hello@inmybox.io?subject=Enterprise%20Inquiry',
    popular: false,
    features: [
      'Everything in Pro',
      'Dedicated DMARC engineer',
      'Custom integrations & webhooks',
      'SSO / SAML authentication',
      'SLA guarantee (99.9% uptime)',
      'Unlimited data retention',
      'White-label reports',
      'Onboarding & training',
      'Phone & Slack support',
    ],
    limitations: [],
  },
]

const faqs = [
  {
    q: 'What does the free scan include?',
    a: 'The free scan gives you a complete health score across DMARC, SPF, DKIM, and configuration. You see pillar scores, risk level, and finding titles. Full details, recommendations, and raw records are available on paid plans.',
  },
  {
    q: 'Can I try paid plans before committing?',
    a: 'Yes — both Starter and Pro come with a 14-day free trial. No credit card required to start.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'You\'ll be downgraded to the Free tier. No data is deleted during the trial period, so you can upgrade anytime to resume where you left off.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual plans get 2 months free (save ~17%). Contact us for annual pricing.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time. When upgrading, you\'re only charged the prorated difference.',
  },
  {
    q: 'What counts as a "domain"?',
    a: 'A domain is a root domain like example.com. Subdomains (mail.example.com, marketing.example.com) are monitored under the same domain and don\'t count separately.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use encrypted connections, never store email content, and our infrastructure is SOC 2 ready. See our security page for details.',
  },
  {
    q: 'Do you offer discounts for nonprofits or startups?',
    a: 'Yes — we offer 50% off for registered nonprofits and early-stage startups. Contact us with verification details.',
  },
]

const comparisonFeatures = [
  { name: 'Domain scans', free: '1/day', starter: 'Daily auto', pro: 'Daily auto', enterprise: 'Custom' },
  { name: 'Domains monitored', free: '—', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Health score & risk level', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Finding titles', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Full details & recommendations', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Raw DNS records', free: false, starter: true, pro: true, enterprise: true },
  { name: 'DMARC report aggregation', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Email alerts', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Sender intelligence', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Business impact metrics', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Action items engine', free: false, starter: false, pro: true, enterprise: true },
  { name: 'CSV & PDF exports', free: false, starter: false, pro: true, enterprise: true },
  { name: 'API access', free: false, starter: false, pro: true, enterprise: true },
  { name: 'SSO / SAML', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Dedicated engineer', free: false, starter: false, pro: false, enterprise: true },
  { name: 'SLA guarantee', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Data retention', free: '—', starter: '30 days', pro: '90 days', enterprise: 'Unlimited' },
  { name: 'Support', free: 'Docs', starter: 'Email', pro: 'Priority', enterprise: 'Phone & Slack' },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16">
        <div className="absolute inset-0 hero-glow opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll>
            <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
              Pricing
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5">
              Start Free.{' '}
              <span className="gradient-text">Scale as You Grow.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Scan your domain for free. Upgrade when you need continuous monitoring,
              full recommendations, and advanced analytics.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Plan Cards ── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <AnimateOnScroll key={plan.name} delay={i * 80}>
                <div
                  className={`relative rounded-2xl border p-7 h-full flex flex-col card-hover ${
                    plan.popular
                      ? 'border-brand-500/50 bg-slate-900/80 shadow-xl shadow-brand-500/10'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold bg-brand-600 text-white rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-slate-500">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{plan.description}</p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.limitations.map((l) => (
                      <li key={l} className="flex items-start gap-2 text-sm text-slate-500">
                        <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        {l}
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

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              All paid plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section className="py-20 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Compare Plans
            </h2>
          </AnimateOnScroll>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-slate-400 font-medium">Feature</th>
                  <th className="text-center px-4 py-4 text-white font-semibold">Free</th>
                  <th className="text-center px-4 py-4 text-white font-semibold">Starter</th>
                  <th className="text-center px-4 py-4 text-brand-400 font-semibold">Pro</th>
                  <th className="text-center px-4 py-4 text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 text-slate-300">{row.name}</td>
                    {(['free', 'starter', 'pro', 'enterprise'] as const).map((tier) => {
                      const val = row[tier]
                      return (
                        <td key={tier} className="text-center px-4 py-3">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-xs">{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Why Inmybox ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Why Teams Choose Inmybox
            </h2>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Setup in Minutes', desc: 'Scan your domain instantly. No complex integrations or DNS changes required to start.' },
              { icon: Shield, title: '100-Point Scoring', desc: 'Transparent, documented scoring across 4 pillars. Know exactly where you stand.' },
              { icon: BarChart3, title: 'Business Metrics', desc: 'Revenue-at-risk, lead loss estimation, and campaign health — not just technical stats.' },
              { icon: Headphones, title: 'Expert Support', desc: 'Our team has fixed deliverability for thousands of domains. We\'re here to help.' },
            ].map((item, i) => (
              <AnimateOnScroll key={item.title} delay={i * 80}>
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 text-center card-hover">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
          </AnimateOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 50}>
                <details className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 group-open:text-brand-400 transition-colors" />
                  </summary>
                  <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Not sure which plan fits?
          </h2>
          <p className="text-lg text-brand-100 max-w-xl mx-auto mb-8">
            Talk to our team. We&apos;ll review your domain, explain what you need, and recommend the right plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@inmybox.io?subject=Pricing%20Question"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-white text-brand-700 hover:bg-brand-50 transition-all shadow-xl"
            >
              <Mail className="w-5 h-5" />
              Talk to an Expert
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all"
            >
              Try Free Scan First
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <Mail className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Inmybox</span>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Inmybox. All rights reserved.</p>
        </div>
      </footer>

      <CookieBanner />
    </main>
  )
}
