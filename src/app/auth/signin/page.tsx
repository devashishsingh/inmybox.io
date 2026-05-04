'use client'

// INMYBOX REDESIGN — Spiritual Industrial sign-in
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
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
      if (result?.error) setError('Invalid email or password')
      else { router.push('/dashboard'); router.refresh() }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="ember-root min-h-screen ember-bg flex relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ember-stars-1" />
        <div className="ember-stars-2" />
        <div className="absolute inset-0 ember-grid" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="relative max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <span className="ember-avatar"><Mail className="w-4 h-4 text-amber-400" /></span>
            <span className="font-display text-2xl font-bold text-white tracking-tight">Inmybox</span>
          </Link>
          <h2 className="font-display text-4xl font-bold ember-heading mb-4 leading-tight tracking-tight">
            Email reputation intelligence for growth teams.
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Monitor delivery health, identify sender risks, and understand how email authentication
            impacts your leads and revenue.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { label: 'DMARC Analytics', value: 'Real-time' },
              { label: 'Delivery Prediction', value: 'AI-powered' },
              { label: 'Business Impact', value: 'Revenue-focused' },
              { label: 'Sender Intelligence', value: 'Full visibility' },
            ].map((i) => (
              <div key={i.label} className="ember-glass rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-1 font-semibold">{i.label}</div>
                <div className="text-sm font-semibold text-amber-300">{i.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.18em]">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <span className="ember-avatar"><Mail className="w-4 h-4 text-amber-400" /></span>
            <span className="font-display text-lg font-bold text-white">Inmybox</span>
          </Link>

          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-300">Secure Sign In</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-400 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-400">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] uppercase tracking-[0.18em] text-amber-400 hover:text-amber-300 font-bold">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ember-shiny-cta w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ember-cta-icon" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-zinc-500 text-center mt-6">
            Don&apos;t have access yet?{' '}
            <Link href="/demo" className="text-amber-400 hover:text-amber-300 font-semibold">Request a demo</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
