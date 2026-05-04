'use client'

import { useState } from 'react'
import { Twitter, Linkedin, Link2, Check } from 'lucide-react'

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : `https://inmybox.io/blog/${slug}`

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const Btn = 'inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-500 mr-1">Share</span>
      <a href={tweet} target="_blank" rel="noopener noreferrer"
        className={`${Btn} text-white border-white/15 hover:bg-white/10`}
        aria-label="Share on X">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={li} target="_blank" rel="noopener noreferrer"
        className={`${Btn} text-[#0A66C2] border-[#0A66C2]/40 hover:bg-[#0A66C2]/15`}
        aria-label="Share on LinkedIn">
        <Linkedin className="w-4 h-4" />
      </a>
      <button onClick={onCopy}
        className={`${Btn} ${copied ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' : 'text-amber-400 border-amber-400/40 hover:bg-amber-400/15'}`}
        aria-label="Copy link">
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
