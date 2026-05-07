'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'

// Circuit corner decoration — matches reference screenshot
function CircuitCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isRight = position === 'tr' || position === 'br'
  const isBottom = position === 'bl' || position === 'br'
  return (
    <div
      className={`absolute pointer-events-none ${isBottom ? 'bottom-0' : 'top-0'} ${isRight ? 'right-0' : 'left-0'}`}
      style={{ width: 220, height: 120 }}
    >
      <svg width="220" height="120" viewBox="0 0 220 120" fill="none">
        {/* horizontal line */}
        <line
          x1={isRight ? 220 : 0} y1={isBottom ? 100 : 20}
          x2={isRight ? 60 : 160} y2={isBottom ? 100 : 20}
          stroke="#1e293b" strokeWidth="1.5"
        />
        {/* vertical line */}
        <line
          x1={isRight ? 60 : 160} y1={isBottom ? 120 : 0}
          x2={isRight ? 60 : 160} y2={isBottom ? 100 : 20}
          stroke="#1e293b" strokeWidth="1.5"
        />
        {/* node dot */}
        <circle
          cx={isRight ? 60 : 160} cy={isBottom ? 100 : 20}
          r="3.5" fill="#1e293b" stroke="#334155" strokeWidth="1"
        />
        {/* small label chip */}
        <rect
          x={isRight ? 150 : 0} y={isBottom ? 88 : 8}
          width="52" height="14" rx="3"
          fill="#0f172a" stroke="#1e293b" strokeWidth="1"
        />
        <text
          x={isRight ? 176 : 26} y={isBottom ? 99 : 19}
          fill="#334155" fontSize="7" fontFamily="monospace" textAnchor="middle"
        >
          {position.toUpperCase()}-NODE
        </text>
      </svg>
    </div>
  )
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewUser = searchParams.get('new') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Circuit corner decorations */}
      <CircuitCorner position="tl" />
      <CircuitCorner position="tr" />
      <CircuitCorner position="bl" />
      <CircuitCorner position="br" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-[#111318] border border-white/[0.07] rounded-2xl px-8 py-10 shadow-2xl">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border border-white/10 flex items-center justify-center shadow-inner">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#3b82f6" strokeWidth="1.5" />
                <circle cx="11" cy="11" r="4" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="11" cy="11" r="1.5" fill="#818cf8" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-white text-[22px] font-semibold text-center mb-1 tracking-tight">
            {isNewUser ? 'Welcome on board!' : 'Welcome back!'}
          </h1>
          <p className="text-zinc-500 text-sm text-center mb-7">
            {isNewUser
              ? "Your account is ready. Sign in to get started."
              : "Don't have an account yet? \u00a0"}
            {!isNewUser && (
              <Link href="/demo" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
                Sign up
              </Link>
            )}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email address"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              />
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-1">
              <Link href="/auth/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
