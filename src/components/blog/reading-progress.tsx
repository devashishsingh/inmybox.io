'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const total = h.scrollHeight - h.clientHeight
      const p = total > 0 ? (h.scrollTop / total) * 100 : 0
      setPct(p)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-red-400 transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
