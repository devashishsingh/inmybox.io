'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, X, ArrowRight } from 'lucide-react'

interface DemoDataBannerProps {
  /** Pass true when the API reports hasOnlyDemoData === true */
  show: boolean
}

const STORAGE_KEY = 'imb_demo_banner_dismissed'

export function DemoDataBanner({ show }: DemoDataBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    // Re-show on every new session — only persist dismiss for current tab session
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    if (!dismissed) setVisible(true)
  }, [show])

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-3 text-sm">
      <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-amber-200 flex-1">
        You&apos;re viewing <span className="font-semibold">sample data</span>. Your real DMARC reports will replace this automatically once received.
      </span>
      <Link
        href="/onboarding"
        className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
      >
        Finish Setup <ArrowRight className="w-3.5 h-3.5" />
      </Link>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
