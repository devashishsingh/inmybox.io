'use client'

// INMYBOX REDESIGN — Spiritual Industrial sign-up
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Building2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (result?.error) setError('Account created but sign-in failed. Please sign in manually.')
      else { router.push('/dashboard'); router.refresh() }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const passwordStrength = (p: string) => {
    if (p.length === 0) return { label: '', color: '', width: '0%' }
    if (p.length < 8) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
    const hasUpper = /[A-Z]/.test(p)
    const hasNumber = /[0-9]/.test(p)
    const hasSpecial = /[^A-Za-z0-9]/.test(p)
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
    if (score >= 3) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
    if (score >= 2) return { label: 'Good', color: 'bg-amber-500', width: '75%' }
    return { label: 'Fair', color: 'bg-amber-400', width: '50%' }
  }
  const strength = passwordStrength(form.password)

  const inputCls = "w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
  const labelCls = "block text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-400 mb-2"

  return (
    <div className="ember-root min-h-screen ember-bg flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ember-stars-1" />
        <div className="ember-stars-2" />
        <div className="absolute inset-0 ember-grid" />
      </div>

      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="relative max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <span className="ember-avatar"><Mail className="w-4 h-4 text-amber-400" /></span>
            <span className="font-display text-2xl font-bold text-white tracking-tight">Inmybox</span>
          </Link>
          <h2 className="font-display text-4xl font-bold ember-heading mb-4 leading-tight tracking-tight">
            Start protecting your email reputation.
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-10">
            Get instant visibility into who sends under your domain, which emails reach the inbox,
            and how delivery failures impact your leads and revenue.
          </p>
          <div className="space-y-3">
            {[
              'Upload DMARC reports in seconds',
              'See delivery health and sender trust instantly',
              'Understand business impact with real metrics',
              'Identify unknown and suspicious senders',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 ember-glass rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.18em]">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <span className="ember-avatar"><Mail className="w-4 h-4 text-amber-400" /></span>
            <span className="font-display text-lg font-bold text-white">Inmybox</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2 tracking-tight">Create your account</h1>
          <p className="text-sm text-zinc-400 mb-8">Get started with a free account. No credit card required.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelCls}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="name" type="text" value={form.name} onChange={update('name')} placeholder="Jane Smith" required className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="email" type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="company" className={labelCls}>Company <span className="text-zinc-600 font-normal normal-case tracking-normal">(optional)</span></label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="company" type="text" value={form.company} onChange={update('company')} placeholder="Acme Inc." className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required minLength={8} className={inputCls} />
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{strength.label}</span>
                </div>
              )}
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ember-cta-icon" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-amber-400 hover:underline">Terms</Link>{' '}and{' '}
            <Link href="/privacy" className="text-amber-400 hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-sm text-zinc-500 text-center mt-6">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-amber-400 hover:text-amber-300 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
