'use client'

import { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

export function ArticleTOC() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const article = document.querySelector('#article-body')
    if (!article) return
    const nodes = Array.from(article.querySelectorAll('h2, h3')) as HTMLHeadingElement[]
    const items: Heading[] = nodes.map((n, i) => {
      if (!n.id) {
        const id = (n.textContent || `section-${i}`)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `section-${i}`
        n.id = id
      }
      return {
        id: n.id,
        text: n.textContent || '',
        level: n.tagName === 'H2' ? 2 : 3,
      }
    })
    setHeadings(items)

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    nodes.forEach((n) => obs.observe(n))
    return () => obs.disconnect()
  }, [])

  if (headings.length < 2) return null

  return (
    <nav aria-label="Table of contents" className="sticky top-28">
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-400 mb-4">
        On this page
      </p>
      <ul className="space-y-1.5 text-sm border-l border-white/10 pl-4">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
            <a
              href={`#${h.id}`}
              className={`block py-1 transition-colors leading-snug ${
                activeId === h.id
                  ? 'text-amber-300 font-medium'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
