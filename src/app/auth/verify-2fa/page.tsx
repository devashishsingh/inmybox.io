'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function Verify2FAForm() {
  const { update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [useBackup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), context: 'login' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      // Persist twoFactorVerified in the JWT
      await update({ twoFactorVerified: true })
      router.replace(decodeURIComponent(callbackUrl))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (val: string) => {
    if (useBackup) {
      setCode(val.toUpperCase().slice(0, 8))
    } else {
      const digits = val.replace(/\D/g, '').slice(0, 6)
      setCode(digits)
    }
  }

  const canSubmit = useBackup ? code.length === 8 : code.length === 6

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-[#111318] border border-white/[0.07] rounded-2xl px-8 py-10 shadow-2xl">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <h1 className="text-white text-xl font-semibold text-center mb-1">Two-factor authentication</h1>
          <p className="text-zinc-500 text-sm text-center mb-7">
            {useBackup
              ? 'Enter one of your 8-character backup codes.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type={useBackup ? 'text' : 'text'}
              inputMode={useBackup ? 'text' : 'numeric'}
              pattern={useBackup ? '[A-F0-9]{8}' : '[0-9]*'}
              maxLength={useBackup ? 8 : 6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={useBackup ? 'XXXXXXXX' : '000000'}
              autoFocus
              autoComplete="one-time-code"
              className="w-full py-4 text-center text-2xl font-mono tracking-[0.4em] rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all mb-4"
            />
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify'
              )}
            </button>
          </form>

          <button
            onClick={() => { setUseBackup(!useBackup); setCode(''); setError('') }}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 mt-4 transition-colors"
          >
            {useBackup ? '← Use authenticator app instead' : 'Use a backup code instead'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <Verify2FAForm />
    </Suspense>
  )
}
