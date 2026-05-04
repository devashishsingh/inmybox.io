import { Metadata } from 'next'
import Link from 'next/link'
import { EmberShell } from '@/components/ember-shell'
import { Mail, ArrowRight, Heart, Compass, Flame, Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — Why we built Inmybox',
  description: 'The story, the mission and the people behind Inmybox — and why we believe every business deserves a trusted inbox.',
}

export default function AboutPage() {
  return (
    <EmberShell>
      <main className="min-h-screen">

        {/* ── Hero ── */}
        <section className="relative pt-36 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 mb-6">
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-300">
                Our story
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold ember-heading tracking-tight leading-[1.05] mb-6">
              We started Inmybox because{' '}
              <span className="ember-text-fire">trust was breaking</span>.
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Email is the most important channel a business owns — and the most quietly broken.
              We&apos;re here to fix it, one verified domain at a time.
            </p>
          </div>
        </section>

        {/* ── Founder Story (placeholder) ── */}
        <section className="relative pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ember-glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <Quote className="w-10 h-10 text-amber-400/50 mb-6" />
                <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-300 mb-4">
                  Founder&apos;s note
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold ember-heading tracking-tight leading-tight mb-6">
                  This is where my story will live.
                </h2>
                <div className="space-y-5 text-zinc-300 leading-[1.85] text-[1.0625rem]">
                  <p>
                    {/* TODO(founder-story): replace this paragraph with the founder's narrative
                        — share the moment that made you start Inmybox. */}
                    Every product worth building starts with a moment of frustration. A spoofed
                    invoice. A legitimate email that landed in spam. A customer who never got the
                    welcome message you spent weeks designing. We&apos;ve all been there — and it
                    cost more than we wanted to admit.
                  </p>
                  <p>
                    I built Inmybox because the tools that exist today were either too technical
                    for the people who actually own the consequences, or too expensive for the
                    teams who need them most. Email security shouldn&apos;t require a PhD in DNS.
                    It should feel like turning on a light.
                  </p>
                  <p className="text-zinc-400 italic border-l-2 border-amber-400/60 pl-5">
                    &mdash; Founder, Inmybox.{' '}
                    <span className="text-zinc-600">(Full story coming soon.)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission / Values ── */}
        <section className="relative pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-400 mb-3">
                What we believe
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-bold ember-heading tracking-tight leading-tight">
                Three convictions that shape every decision.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Value
                icon={<Heart className="w-5 h-5 text-red-400" />}
                title="Inboxes are sacred"
                body="The inbox is the last quiet channel between a business and the humans who trust it. We protect that quietness like it&apos;s ours."
              />
              <Value
                icon={<Compass className="w-5 h-5 text-amber-400" />}
                title="Clarity beats configuration"
                body="If you can&apos;t explain a security control to a CFO, it doesn&apos;t belong in production. Every screen we ship answers a question someone actually asked."
              />
              <Value
                icon={<Flame className="w-5 h-5 text-amber-300" />}
                title="Quietly relentless"
                body="No noise, no theatrics. Just continuous, monitored, reported, fixed. Email security should be a background hum, not a fire drill."
              />
            </div>
          </div>
        </section>

        {/* ── Numbers strip ── */}
        <section className="relative pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ember-glass rounded-3xl grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 overflow-hidden">
              <Stat value="100%" label="Domains protected" />
              <Stat value="24/7" label="DMARC monitoring" />
              <Stat value="0" label="Unread alerts ignored" />
              <Stat value="∞" label="Care per email" />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative pb-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold ember-heading mb-5 tracking-tight leading-tight">
              Want to be part of the next chapter?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
              Scan your domain free, or book a demo. We&apos;ll show you what trust looks like
              when someone&apos;s finally watching the door.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/" className="ember-shiny-cta">
                <span>Scan your domain</span>
                <ArrowRight className="w-4 h-4 ember-cta-icon" />
              </Link>
              <Link href="/demo" className="ember-ghost">
                <Mail className="w-4 h-4" />
                <span>Request a demo</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </EmberShell>
  )
}

function Value({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="ember-bento p-7 h-full">
      <div className="w-10 h-10 rounded-xl ember-glass-strong flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="ember-stat">
      <div className="font-display text-3xl md:text-4xl font-bold ember-text-fire tracking-tight mb-1">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-zinc-500">
        {label}
      </div>
    </div>
  )
}
