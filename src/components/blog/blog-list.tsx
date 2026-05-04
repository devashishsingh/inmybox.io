'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Clock, ArrowRight, Mail, SlidersHorizontal } from 'lucide-react'

export interface BlogListItem {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  tags: string[]
  readingTime: string
}

type SortKey = 'newest' | 'oldest' | 'shortest' | 'longest'

interface Props {
  posts: BlogListItem[]
  categories: string[]
  featuredSlug?: string
}

function readMinutes(s: string): number {
  const m = s.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

export function BlogList({ posts, categories, featuredSlug }: Props) {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('All')
  const [sort, setSort] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let list = posts.slice()
    if (activeCat !== 'All') list = list.filter(p => p.category === activeCat)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    switch (sort) {
      case 'newest':
        list.sort((a, b) => +new Date(b.date) - +new Date(a.date)); break
      case 'oldest':
        list.sort((a, b) => +new Date(a.date) - +new Date(b.date)); break
      case 'shortest':
        list.sort((a, b) => readMinutes(a.readingTime) - readMinutes(b.readingTime)); break
      case 'longest':
        list.sort((a, b) => readMinutes(b.readingTime) - readMinutes(a.readingTime)); break
    }
    return list
  }, [posts, query, activeCat, sort])

  const cats = ['All', ...categories]

  return (
    <div>
      {/* Filter bar */}
      <div className="ember-glass rounded-2xl p-4 md:p-5 mb-10">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, tags, topics…"
              className="w-full bg-black/40 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20 transition"
            />
          </div>
          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-amber-400/40 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="shortest">Shortest read</option>
              <option value="longest">Longest read</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {cats.map((cat) => {
            const isActive = activeCat === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold tracking-wide transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black border-transparent shadow-lg shadow-amber-500/20'
                    : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-semibold">
          {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
          {activeCat !== 'All' && <span className="text-amber-400"> · {activeCat}</span>}
          {query && <span className="text-zinc-400"> · “{query}”</span>}
        </p>
        {(query || activeCat !== 'All' || sort !== 'newest') && (
          <button
            onClick={() => { setQuery(''); setActiveCat('All'); setSort('newest') }}
            className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="ember-glass rounded-2xl p-12 text-center">
          <Mail className="w-10 h-10 text-amber-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-2">No articles match your filters</h3>
          <p className="text-sm text-zinc-400">Try a different search term or category.</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} highlighted={post.slug === featuredSlug} />
          ))}
        </div>
      )}
    </div>
  )
}

function BlogCard({ post, highlighted }: { post: BlogListItem; highlighted?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block ember-bento h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      }}
    >
      {/* Cover gradient panel */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(239,35,60,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(0,0,0,0.6))]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl ember-glass-strong flex items-center justify-center">
            <Mail className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        {highlighted && (
          <span className="absolute top-3 left-3 ember-pill ember-pill-gold">
            ★ Featured
          </span>
        )}
        <span className="absolute top-3 right-3 ember-pill ember-pill-saffron">
          {post.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
          <span>
            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime}
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-5">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="ember-avatar !w-7 !h-7">
              <span className="text-[10px] font-bold text-amber-300">
                {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </span>
            <span className="text-xs text-zinc-400">{post.author}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            Read
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
