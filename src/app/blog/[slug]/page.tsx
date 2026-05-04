import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import { EmberShell } from '@/components/ember-shell'
import { ArticleTOC } from '@/components/blog/article-toc'
import { ReadingProgress } from '@/components/blog/reading-progress'
import { ShareButtons } from '@/components/blog/share-buttons'
import { Mail, ArrowLeft, Clock, Tag, ArrowRight, ChevronRight } from 'lucide-react'

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

// Inject stable ids on h2/h3 so TOC + anchor jumps work
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function injectHeadingIds(html: string): string {
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    const stripped = inner.replace(/<[^>]+>/g, '')
    const id = slugify(stripped)
    return `<${tag} id="${id}">${inner}</${tag}>`
  })
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex(p => p.slug === params.slug)
  const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  const related = allPosts
    .filter((p) => p.slug !== params.slug)
    .filter((p) => p.category === post.category || p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3)
  const fallbackRelated = related.length === 0
    ? allPosts.filter((p) => p.slug !== params.slug).slice(0, 3)
    : related

  // Render markdown synchronously (marked v18 supports parse() returning string)
  const rawHtml = marked.parse(post.content, { gfm: true, breaks: true, async: false }) as string
  const withIds = injectHeadingIds(rawHtml)
  const html = DOMPurify.sanitize(withIds, {
    ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','a','ul','ol','li','strong','em','code','pre','blockquote','img','table','thead','tbody','tr','th','td','br','hr','div','span','sup','sub','del','ins'],
    ALLOWED_ATTR: ['href','src','alt','title','class','id','target','rel','width','height'],
    ALLOW_DATA_ATTR: false,
  })

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <EmberShell>
      <ReadingProgress />
      <main className="min-h-screen">

        {/* ── Article Header ── */}
        <header className="relative pt-32 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] font-semibold text-zinc-400 hover:text-amber-400 transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Articles
            </Link>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="ember-pill ember-pill-saffron">{post.category}</span>
              <span className="text-xs text-zinc-500">{formattedDate}</span>
              <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingTime}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold ember-heading tracking-tight leading-[1.05] mb-6">
              {post.title}
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-8 max-w-3xl">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between gap-4 flex-wrap pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="ember-avatar">
                  <span className="text-[11px] font-bold text-amber-300">
                    {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </span>
                <div>
                  <div className="text-sm text-white font-medium leading-tight">{post.author}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Inmybox</div>
                </div>
              </div>
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </header>

        {/* ── Article Body + TOC ── */}
        <section className="relative pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr_220px] gap-10">
              {/* Left TOC */}
              <aside className="hidden lg:block">
                <ArticleTOC />
              </aside>

              {/* Article */}
              <article
                id="article-body"
                className="prose prose-invert prose-zinc max-w-none
                  prose-headings:font-display prose-headings:tracking-tight
                  prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-white prose-h2:font-bold prose-h2:scroll-mt-28
                  prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-amber-200 prose-h3:font-semibold prose-h3:scroll-mt-28
                  prose-p:text-zinc-300 prose-p:leading-[1.85] prose-p:text-[1.0625rem]
                  prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 prose-a:font-medium
                  prose-strong:text-white prose-strong:font-semibold
                  prose-code:text-amber-300 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.9em] prose-code:font-medium prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:backdrop-blur prose-pre:text-zinc-200 prose-pre:shadow-2xl prose-pre:shadow-black/40
                  prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-xl prose-table:border prose-table:border-white/10
                  prose-th:text-left prose-th:text-amber-300 prose-th:font-semibold prose-th:bg-white/[0.04] prose-th:border-b prose-th:border-white/10 prose-th:py-3 prose-th:px-4 prose-th:text-sm prose-th:uppercase prose-th:tracking-wider
                  prose-td:text-zinc-300 prose-td:py-3 prose-td:px-4 prose-td:border-b prose-td:border-white/5
                  prose-li:text-zinc-300 prose-li:leading-[1.85] prose-ul:my-6 prose-ol:my-6 prose-li:my-2
                  prose-blockquote:border-l-4 prose-blockquote:border-amber-400/60 prose-blockquote:bg-white/[0.03] prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:text-zinc-200 prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:my-8
                  prose-hr:border-white/10 prose-hr:my-12
                  prose-img:rounded-2xl prose-img:border prose-img:border-white/10 prose-img:shadow-2xl prose-img:shadow-black/40
                  first-letter:font-display"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Right rail */}
              <aside className="hidden xl:block">
                <div className="sticky top-28 space-y-6">
                  <div className="ember-glass rounded-2xl p-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-400 mb-3">
                      Free domain check
                    </p>
                    <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                      Score your DMARC, SPF and DKIM in seconds.
                    </p>
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                      Run a free scan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {post.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-zinc-500 mb-3">
                        Tagged
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] text-zinc-300 border border-white/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Tags (mobile) ── */}
        {post.tags.length > 0 && (
          <section className="xl:hidden pb-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="pt-6 border-t border-white/5 flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-zinc-500" />
                {post.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] text-zinc-300 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA Banner ── */}
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ember-glass-strong rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 mb-5">
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-300">
                    Free Domain Health Check
                  </span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold ember-heading mb-3 tracking-tight">
                  How does your domain score?
                </h3>
                <p className="text-zinc-400 mb-7 max-w-lg mx-auto leading-relaxed">
                  Get an instant 0–100 score across DMARC, SPF, DKIM and configuration health.
                  No signup required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/" className="ember-shiny-cta">
                    <span>Scan your domain</span>
                    <ArrowRight className="w-4 h-4 ember-cta-icon" />
                  </Link>
                  <Link href="/auth/signup" className="ember-ghost">
                    <span>Get started free</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Prev / Next ── */}
        {(prev || next) && (
          <section className="pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-4">
                {prev ? (
                  <Link href={`/blog/${prev.slug}`} className="ember-bento p-6 group">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-bold text-zinc-500 mb-2">
                      <ArrowLeft className="w-3 h-3" />
                      Previous
                    </div>
                    <h4 className="font-display text-base font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {prev.title}
                    </h4>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/blog/${next.slug}`} className="ember-bento p-6 group md:text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.22em] font-bold text-zinc-500 mb-2">
                      Next
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <h4 className="font-display text-base font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {next.title}
                    </h4>
                  </Link>
                ) : <div />}
              </div>
            </div>
          </section>
        )}

        {/* ── Related ── */}
        {fallbackRelated.length > 0 && (
          <section className="pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-400 mb-2">
                    Keep reading
                  </p>
                  <h3 className="font-display text-2xl md:text-3xl font-bold ember-heading tracking-tight">
                    More from the field
                  </h3>
                </div>
                <Link href="/blog" className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                  All articles
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {fallbackRelated.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group block ember-bento p-6 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="ember-pill ember-pill-saffron">{p.category}</span>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-display text-base font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {p.title}
                    </h4>
                    <p className="text-sm text-zinc-400 line-clamp-3">{p.excerpt}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                      Read
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </EmberShell>
  )
}
