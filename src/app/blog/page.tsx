import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft, Sparkles } from 'lucide-react'
import { EmberShell } from '@/components/ember-shell'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Email deliverability and DMARC insights from the Inmybox team.',
}

export default function BlogPage() {
  return (
    <EmberShell withNav={false}>
      <div className="min-h-screen">
        <header className="border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Inmybox</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-indigo-300/80">
              Coming Soon
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Blog
          </h1>
          <p className="text-zinc-400 leading-relaxed max-w-xl mx-auto mb-8">
            This page is being prepared. We&apos;re putting together deep dives on DMARC,
            deliverability, sender reputation, and inbox placement. In the meantime, reach out for
            insights tailored to your stack.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:hello@inmybox.io"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/30"
            >
              Contact hello@inmybox.io
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm font-semibold hover:bg-white/[0.08] transition-colors"
            >
              Request a Demo
            </Link>
          </div>
        </main>
      </div>
    </EmberShell>
  )
}
