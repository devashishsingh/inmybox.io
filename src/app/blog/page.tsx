import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getCategories } from '@/lib/blog'
import { Navbar } from '@/components/landing-nav'
import { Mail, ArrowRight, Clock, Tag, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — Email Security, DMARC & Deliverability',
  description: 'Expert insights on email authentication, DMARC, SPF, DKIM, deliverability best practices, and domain protection.',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getCategories()
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 border-b border-slate-800/50">
        <div className="absolute inset-0 hero-glow opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">
              The Inmybox Blog
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
              Email Security{' '}
              <span className="gradient-text">Insights</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              Deep dives into DMARC, SPF, DKIM, email deliverability, and domain
              protection. Written by the team building Inmybox.
            </p>
          </div>
        </div>
      </section>

      {/* ── Category Pills ── */}
      <div className="border-b border-slate-800/50 bg-slate-950 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-full text-sm font-medium bg-brand-600 text-white shrink-0"
            >
              All Posts
            </Link>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 rounded-full text-sm font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 shrink-0 cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ── Featured Post ── */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="block group mb-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8 md:p-10 card-hover">
              {/* Cover image placeholder */}
              <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-violet-600/20 border border-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-8 h-8 text-brand-400" />
                  </div>
                  <span className="text-sm text-slate-500">Featured</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {featured.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-slate-400 leading-relaxed mb-5">
                  {featured.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{featured.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featured.readingTime}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-400 group-hover:text-brand-300 transition-colors">
                    Read article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Newsletter CTA ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 md:p-10 mb-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">We do newsletters, too</h3>
              <p className="text-sm text-slate-400">
                Get email security tips and product updates delivered to your inbox biweekly.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 md:w-64 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/50"
              />
              <button className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* ── Latest Posts Grid ── */}
        {rest.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-8">Latest</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <article className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden h-full flex flex-col card-hover">
                    {/* Cover placeholder */}
                    <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 via-slate-800/80 to-slate-900 flex items-center justify-center border-b border-slate-800">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-brand-400" />
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                        <span className="text-xs text-slate-500">{post.author}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
            <Mail className="w-3.5 h-3.5" />
            Free Domain Health Check
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Not sure where to start?
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Scan your domain for free and get an instant score across DMARC, SPF, DKIM, and configuration health.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
          >
            Scan Your Domain
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-10">
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
    </main>
  )
}
