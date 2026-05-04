// INMYBOX ENHANCEMENT — Phase 3 M9: Cookie consent via httpOnly server-side cookie (replaces localStorage)
'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if consent cookie exists by looking for it in document.cookie
    // (the httpOnly cookie won't be visible, so we check a companion non-httpOnly flag)
    const hasConsent = document.cookie.split(';').some((c) => c.trim().startsWith('inmybox-consent-set='))
    if (!hasConsent) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const setConsent = async (value: 'accepted' | 'declined') => {
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: value }),
      })
      // Set a visible companion cookie so we know consent was given (non-sensitive flag only)
      document.cookie = `inmybox-consent-set=1; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    } catch {
      // Fallback: still hide banner even if API fails
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
        <p className="text-sm text-zinc-300 flex-1 leading-relaxed">
          We use essential cookies to make Inmybox work. We&apos;d also like to set analytics cookies to understand how you use the product and make improvements.{' '}
          <a href="/privacy" className="text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline font-medium">
            Privacy Policy
          </a>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setConsent('declined')}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => setConsent('accepted')}
            className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg, #ef233c 0%, #f59e0b 60%, #d4a843 100%)' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
