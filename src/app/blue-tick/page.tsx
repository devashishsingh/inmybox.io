import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Mail,
  Clock,
  BadgeCheck,
  Image,
  FileText,
  Globe,
  RefreshCw,
  Zap,
  HelpCircle,
  Star,
  ChevronDown,
} from 'lucide-react'
import { Navbar } from '@/components/landing-nav'
import { AnimateOnScroll } from '@/components/animate'
import { CookieBanner } from '@/components/cookie-banner'

export const metadata: Metadata = {
  title: 'Get Your Gmail Blue Tick in 72 Hours — Inmybox',
  description:
    'Turn your brand emails into verified, blue-tick emails in Gmail, Apple Mail, and Yahoo. Full BIMI setup, VMC procurement, and ongoing management.',
  openGraph: {
    title: 'Get Your Gmail Blue Tick in 72 Hours',
    description: 'Full BIMI + VMC setup service. Show your brand logo in every inbox.',
  },
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-950 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <AnimateOnScroll>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">Premium Verification Service</span>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Get Your Gmail{' '}
            <span className="bg-gradient-to-r from-blue-400 to-brand-400 bg-clip-text text-transparent">
              Blue Tick
            </span>{' '}
            in 72 Hours
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Show your verified brand logo next to every email you send.
            We handle DMARC enforcement, BIMI setup, VMC procurement, and inbox verification — end to end.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={300}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@inmybox.io?subject=Blue%20Tick%20Verification%20—%20Get%20Started"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-brand-500/40 transition-all"
            >
              See Pricing
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>
        </AnimateOnScroll>

        {/* Trust indicators */}
        <AnimateOnScroll delay={400}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              72-hour turnaround
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-400" />
              100% deliverability safe
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-brand-400" />
              Works with Gmail, Apple Mail, Yahoo
            </span>
          </div>
        </AnimateOnScroll>

        {/* Visual mockup — email with blue tick */}
        <AnimateOnScroll delay={500}>
          <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-slate-500">Gmail — Inbox</span>
            </div>
            <div className="p-5 space-y-4">
              {/* Email row without blue tick */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">C</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 font-medium">Competitor Corp</span>
                    <span className="text-xs text-slate-600">2:15 PM</span>
                  </div>
                  <span className="text-xs text-slate-500">Your monthly invoice is ready...</span>
                </div>
              </div>
              {/* Email row WITH blue tick */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center relative">
                  <span className="text-xs font-bold text-brand-300">Y</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-semibold">Your Brand</span>
                    <BadgeCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-600">2:18 PM</span>
                  </div>
                  <span className="text-xs text-slate-400">Your order has shipped! Track it here...</span>
                </div>
              </div>
              {/* Another row without */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">N</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 font-medium">Newsletter Co</span>
                    <span className="text-xs text-slate-600">1:45 PM</span>
                  </div>
                  <span className="text-xs text-slate-500">Weekly digest: top stories this week...</span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* ─── What is BIMI / Blue Tick ─── */
function WhatIsBimi() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What is the Gmail Blue Tick?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Google, Apple, and Yahoo now display a verified blue checkmark next to emails from brands that
              implement <strong className="text-white">BIMI</strong> (Brand Indicators for Message Identification)
              with a <strong className="text-white">Verified Mark Certificate (VMC)</strong>. It&apos;s the gold standard of email trust.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'Proves You\'re Real',
              description: 'Recipients instantly see your email is from a verified sender — not a phisher or spoofer.',
            },
            {
              icon: Image,
              title: 'Your Logo in the Inbox',
              description: 'Your brand logo appears as the sender avatar in Gmail, Apple Mail, and Yahoo — replacing generic initials.',
            },
            {
              icon: Zap,
              title: 'Boosts Open Rates',
              description: 'Studies show BIMI-verified emails see 10–39% higher open rates due to increased trust and brand recognition.',
            },
          ].map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 100}>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── What's Included ─── */
function WhatsIncluded() {
  const items = [
    { icon: Shield, title: 'DMARC Readiness Audit', desc: 'Full review of your DMARC, SPF, and DKIM records to ensure enforcement-level compliance.' },
    { icon: FileText, title: 'SPF / DKIM Alignment Fixes', desc: 'We fix misaligned records and ensure all your sending sources pass authentication.' },
    { icon: BadgeCheck, title: 'Trademark Logo Eligibility Check', desc: 'We verify your logo meets trademark requirements for VMC issuance.' },
    { icon: Image, title: 'SVG BIMI Conversion', desc: 'Your logo converted to SVG Tiny P/S format — the exact spec required by BIMI.' },
    { icon: FileText, title: 'VMC / CMC Coordination', desc: 'We handle the entire certificate process with DigiCert or Entrust on your behalf.' },
    { icon: Globe, title: 'DNS Record Publishing', desc: 'BIMI TXT record and all supporting records published correctly in your DNS.' },
    { icon: CheckCircle2, title: 'Validation Testing', desc: 'End-to-end BIMI validation across Gmail, Apple Mail, and Yahoo before handoff.' },
    { icon: Mail, title: 'Inbox Verification', desc: 'Real-world test emails confirming your blue tick and logo appear correctly.' },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-brand-950/20">
      <div className="max-w-5xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything We Handle For You
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              From audit to inbox verification — our team manages the entire process so you don&apos;t have to.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 60}>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 h-full hover:border-brand-500/30 transition-colors">
                <item.icon className="w-5 h-5 text-brand-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Audit & Assessment', desc: 'We scan your domain, review DMARC/SPF/DKIM status, and check your logo against trademark and format requirements.', time: 'Day 1' },
    { num: '02', title: 'Fix & Align', desc: 'Our engineers fix authentication records, enforce DMARC policy (p=quarantine or reject), and convert your logo to BIMI-compliant SVG.', time: 'Day 1–2' },
    { num: '03', title: 'Certificate Procurement', desc: 'We coordinate VMC issuance with a trusted Certificate Authority (DigiCert / Entrust) — no paperwork for you.', time: 'Day 2–3' },
    { num: '04', title: 'Publish & Verify', desc: 'BIMI DNS records go live. We run real-world inbox tests across Gmail, Apple Mail, and Yahoo to confirm your blue tick is active.', time: 'Day 3' },
  ]

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-4xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400">Four steps. Three days. One verified brand.</p>
          </div>
        </AnimateOnScroll>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/60 via-brand-500/30 to-transparent hidden sm:block" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 relative z-10">
                    <span className="text-sm font-bold text-brand-300">{step.num}</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">{step.time}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const tiers = [
    {
      name: 'One-Time Setup',
      price: '$499',
      period: 'one-time',
      description: 'Perfect for businesses that want blue tick verification and can manage DNS updates themselves going forward.',
      popular: false,
      features: [
        'Full DMARC readiness audit',
        'SPF / DKIM alignment fixes',
        'Trademark logo eligibility check',
        'SVG BIMI conversion',
        'VMC coordination with CA',
        'DNS record publishing',
        'Inbox verification testing',
        'Handoff documentation',
      ],
      cta: 'Get Started',
      href: 'mailto:hello@inmybox.io?subject=Blue%20Tick%20—%20One-Time%20Setup',
    },
    {
      name: 'Managed Service',
      price: '$49',
      period: '/month',
      description: 'We handle everything — setup, monitoring, certificate renewals, and ongoing DMARC compliance. Set it and forget it.',
      popular: true,
      features: [
        'Everything in One-Time Setup',
        'Ongoing DMARC monitoring',
        'Annual VMC certificate renewal',
        'Logo updates & re-certification',
        'New sending source alignment',
        'Priority support (24h response)',
        'Quarterly compliance reports',
        'Dedicated account manager',
      ],
      cta: 'Start Managed Service',
      href: 'mailto:hello@inmybox.io?subject=Blue%20Tick%20—%20Managed%20Service',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with multiple domains, complex sending infrastructure, or volume needs.',
      popular: false,
      features: [
        'Unlimited domains',
        'Bulk VMC procurement',
        'Custom SLA & response times',
        'Dedicated implementation team',
        'White-glove onboarding',
        'API access & integrations',
        'Compliance & audit trails',
        'Executive reporting',
      ],
      cta: 'Talk to Sales',
      href: 'mailto:hello@inmybox.io?subject=Blue%20Tick%20—%20Enterprise',
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-slate-950 to-brand-950/20">
      <div className="max-w-5xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Choose one-time setup or let us manage your email verification end-to-end.
              VMC certificate cost is billed separately at issuer rates.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <AnimateOnScroll key={i} delay={i * 100}>
              <div className={`relative rounded-2xl border p-6 h-full flex flex-col ${
                tier.popular
                  ? 'border-brand-500/40 bg-brand-500/5 shadow-lg shadow-brand-500/10'
                  : 'border-slate-800 bg-slate-900/50'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg shadow-brand-600/30">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                    {tier.period && <span className="text-sm text-slate-400">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{tier.description}</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
                    tier.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25'
                      : 'border border-slate-700 text-slate-300 hover:text-white hover:border-brand-500/40'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* VMC note */}
        <AnimateOnScroll delay={400}>
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-center">
            <p className="text-sm text-slate-400">
              <strong className="text-white">VMC Certificate:</strong> ~$1,000–$1,500/year billed by the Certificate Authority (DigiCert / Entrust).
              We handle procurement and renewal for managed service clients. One-time clients get setup guidance.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* ─── Why Inmybox ─── */
function WhyUs() {
  const reasons = [
    { icon: Clock, title: '72-Hour Turnaround', desc: 'Most vendors take weeks. We deliver verified blue ticks in 3 business days or less.' },
    { icon: Shield, title: 'DMARC Experts First', desc: 'We\'re an email authentication platform — not just a logo uploader. Your deliverability is safe.' },
    { icon: RefreshCw, title: 'Managed Renewals', desc: 'VMC certificates expire annually. We handle renewals so your blue tick never lapses.' },
    { icon: Star, title: 'End-to-End Service', desc: 'From DNS audit to inbox verification — you don\'t touch a single technical config.' },
  ]

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose Inmybox?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We&apos;re not just a DMARC tool — we&apos;re your email trust partner.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid sm:grid-cols-2 gap-6">
          {reasons.map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 80}>
              <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-brand-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FAQs ─── */
function FAQs() {
  const faqs = [
    {
      q: 'What exactly is the blue checkmark in Gmail?',
      a: 'It\'s a verified brand indicator powered by BIMI (Brand Indicators for Message Identification). When properly configured with a Verified Mark Certificate (VMC), Gmail, Apple Mail, and Yahoo display your trademarked logo and a blue checkmark next to your emails — proving to recipients that the email is legitimately from your brand.',
    },
    {
      q: 'Do I need a trademark to get the blue tick?',
      a: 'Yes. To obtain a VMC certificate, your logo must be a registered trademark with an approved trademark office (e.g., USPTO, EUIPO, UKIPO, WIPO). If your trademark is pending, we can start the technical setup so you\'re ready to go the moment it\'s approved.',
    },
    {
      q: 'What if my DMARC policy is currently set to "none"?',
      a: 'That\'s perfectly fine — most domains start there. As part of our setup, we\'ll audit your sending sources, fix alignment issues, and gradually move you to p=quarantine or p=reject (required for BIMI). We ensure zero deliverability impact during the transition.',
    },
    {
      q: 'How long does the VMC certificate take?',
      a: 'Typically 1–5 business days once your trademark is verified by the Certificate Authority. We handle all coordination with DigiCert or Entrust. The DMARC + BIMI technical setup runs in parallel, so total time is usually 3 days.',
    },
    {
      q: 'Will this affect my email deliverability?',
      a: 'No — it improves it. DMARC enforcement (required for BIMI) actually protects your domain from spoofing, which improves your sender reputation. We make changes carefully and monitor throughout the process.',
    },
    {
      q: 'What happens when the VMC certificate expires?',
      a: 'VMC certificates are valid for 1 year. On the Managed Service plan, we handle renewal automatically — you never lose your blue tick. One-time setup clients get a renewal reminder and can engage us for renewal at a discounted rate.',
    },
    {
      q: 'Can I use this for multiple domains?',
      a: 'Absolutely. Our Enterprise plan supports unlimited domains with bulk VMC procurement. Each domain needs its own BIMI record and VMC, but we manage the entire portfolio for you.',
    },
    {
      q: 'What email providers support the blue tick?',
      a: 'As of 2024, Gmail, Apple Mail, Yahoo, and Fastmail support BIMI with VMC. Google Workspace shows the blue checkmark prominently. More providers are adopting BIMI standards, so getting set up now positions you well.',
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-brand-950/10">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <AnimateOnScroll key={i} delay={i * 50}>
              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors list-none">
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 group-open:text-brand-400 transition-colors" />
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  {faq.a}
                </div>
              </details>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Bottom CTA ─── */
function BottomCTA() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <AnimateOnScroll>
          <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-brand-600/5 p-10">
            <BadgeCheck className="w-12 h-12 text-brand-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Get Your Blue Tick?
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Join the brands that stand out in every inbox. Our team will assess your domain,
              handle the entire setup, and have your verified checkmark live in 72 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:hello@inmybox.io?subject=Blue%20Tick%20Verification%20—%20Get%20Started"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
              >
                <Mail className="w-5 h-5" />
                Get Started — hello@inmybox.io
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-4 text-sm font-semibold rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-brand-500/40 transition-all"
              >
                Free Domain Scan First
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* ─── Footer (minimal) ─── */
function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand-400" />
          <span className="text-sm font-semibold text-white">Inmybox</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Inmybox. All rights reserved.</p>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function BlueTickPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <WhatIsBimi />
      <WhatsIncluded />
      <HowItWorks />
      <Pricing />
      <WhyUs />
      <FAQs />
      <BottomCTA />
      <Footer />
      <CookieBanner />
    </main>
  )
}
