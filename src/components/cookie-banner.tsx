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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-slate-600 flex-1">
          We use essential cookies to make Inmybox work. We&apos;d also like to set analytics cookies to understand how you use the product and make improvements.{' '}
          <a href="/privacy" className="text-brand-600 hover:underline font-medium">
            Privacy Policy
          </a>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setConsent('declined')}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => setConsent('accepted')}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
