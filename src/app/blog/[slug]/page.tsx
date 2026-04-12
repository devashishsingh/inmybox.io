import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import { Navbar } from '@/components/landing-nav'
import { Mail, ArrowLeft, Clock, Tag, ArrowRight } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex(p => p.slug === params.slug)
  const related = allPosts.filter((p, i) => i !== currentIndex).slice(0, 3)

  // INMYBOX ENHANCEMENT: C2 — sanitize markdown HTML output (defense-in-depth)
  const rawHtml = marked(post.content, { gfm: true, breaks: true }) as string
  const html = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />

      {/* ── Article Header ── */}
      <section className="relative pt-28 pb-12 border-b border-slate-800/50">
        <div className="absolute inset-0 hero-glow opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {post.category}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-6">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <span className="text-brand-300 font-bold text-xs">
                {post.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="text-sm text-white font-medium">{post.author}</div>
              <div className="text-xs text-slate-500">Inmybox</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Article Content ── */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article
            className="prose prose-invert prose-slate max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-400 prose-p:leading-relaxed
              prose-a:text-brand-400 prose-a:no-underline hover:prose-a:text-brand-300
              prose-strong:text-white
              prose-code:text-brand-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl
              prose-table:border-collapse
              prose-th:text-left prose-th:text-slate-400 prose-th:font-medium prose-th:border-b prose-th:border-slate-800 prose-th:pb-2 prose-th:pr-4
              prose-td:text-slate-400 prose-td:py-2 prose-td:pr-4 prose-td:border-b prose-td:border-slate-800/50
              prose-li:text-slate-400
              prose-blockquote:border-brand-500/50 prose-blockquote:text-slate-300
              prose-hr:border-slate-800
              prose-img:rounded-xl prose-img:border prose-img:border-slate-800"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-500" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA Banner */}
          <div className="mt-12 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-600/10 to-brand-500/5 p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Check your domain&apos;s email health
            </h3>
            <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
              Get an instant score across DMARC, SPF, DKIM, and configuration.
              Free — no signup required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25"
              >
                Scan Your Domain
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related Posts ── */}
      {related.length > 0 && (
        <section className="py-16 border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold text-white mb-8">More from the blog</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                  <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 h-full card-hover">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                        {p.category}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors line-clamp-2">
                      {p.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-2">{p.excerpt}</p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
