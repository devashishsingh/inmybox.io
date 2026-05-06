import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getCategories } from '@/lib/blog'
import { EmberShell } from '@/components/ember-shell'
import { BlogList } from '@/components/blog/blog-list'
import { Mail, ArrowRight, Clock, Sparkles, BookOpen, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — Email Security, DMARC & Deliverability Insights',
  description: 'Long-form, expert insights on email authentication, DMARC, SPF, DKIM, deliverability, BIMI and domain protection — written by the team behind Inmybox.',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getCategories()
  const featured = posts[0]
  const items = posts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    author: p.author,
    date: p.date,
    tags: p.tags,
    readingTime: p.readingTime,
  }))

  return (
    <EmberShell>
      <main className="min-h-screen">
        {/* ── Hero ── */}
        <section className="relative pt-36 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 mb-6">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-indigo-300">
                The Inmybox Field Notes
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold ember-heading tracking-tight leading-[1.05] mb-6">
              Stories from the{' '}
              <span className="text-indigo-400">edge of the inbox</span>.
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Field notes, deep dives and battle-tested playbooks on DMARC, SPF, DKIM, BIMI
              and the strange politics of getting an email delivered in 2026.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>{categories.length} categories</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>Updated weekly</span>
            </div>
          </div>
        </section>

        {/* ── Featured spotlight ── */}
        {featured && (
          <section className="relative pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-indigo-400 mb-4">
                ★ Editor&apos;s pick
              </p>
              <Link
                href={`/blog/${featured.slug}`}
                className="group block ember-bento rounded-3xl overflow-hidden"
              >
                <div className="grid lg:grid-cols-[1.1fr_1fr] gap-0 items-stretch">
                  {/* Cover */}
                  <div className="relative aspect-[16/10] lg:aspect-auto min-h-[280px] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(79,70,229,0.18),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-20 h-20 rounded-3xl ember-glass-strong flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                        <Mail className="w-9 h-9 text-indigo-400" />
                      </div>
                    </div>
                    <div
                      className="absolute inset-0 opacity-30 mix-blend-screen"
                      style={{
                        backgroundImage:
                          'radial-gradient(rgba(99,102,241,0.10) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                  </div>

                  {/* Body */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="ember-pill ember-pill-saffron">{featured.category}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {featured.readingTime}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4 group-hover:text-indigo-200 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-zinc-400 leading-relaxed mb-7">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="ember-avatar">
                          <span className="text-[10px] font-bold text-indigo-300">
                            {featured.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </span>
                        <div>
                          <div className="text-sm text-white font-medium leading-tight">{featured.author}</div>
                          <div className="text-[11px] text-zinc-500">Inmybox</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                        Read article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Filters + Grid ── */}
        <section className="relative pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlogList
              posts={items}
              categories={categories}
              featuredSlug={featured?.slug}
            />
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="relative pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ember-glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-slate-500/10 blur-3xl pointer-events-none" />
              <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 mb-4">
                    <Mail className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-indigo-300">
                      The Field Notes Newsletter
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold ember-heading mb-3 leading-tight">
                    Get the next playbook before it ships.
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    One thoughtfully written deep-dive on email security every other Friday.
                    No fluff, no spam, unsubscribe anytime.
                  </p>
                </div>
                <form className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="flex-1 bg-black/40 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20"
                    required
                  />
                  <button type="submit" className="ember-shiny-cta !px-5 !py-3 !text-sm shrink-0">
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4 ember-cta-icon" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative pb-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold ember-heading mb-4 tracking-tight">
              Not sure where to start?
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Run a free domain health check. We&apos;ll score DMARC, SPF, DKIM and configuration health in seconds.
            </p>
            <Link href="/" className="ember-shiny-cta">
              <span>Scan your domain</span>
              <ChevronRight className="w-4 h-4 ember-cta-icon" />
            </Link>
          </div>
        </section>
      </main>
    </EmberShell>
  )
}
