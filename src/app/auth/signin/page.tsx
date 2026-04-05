'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'

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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 hero-glow opacity-30" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Inmybox</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Email reputation intelligence for growth teams
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Monitor delivery health, identify sender risks, and understand how email authentication
            impacts your leads and revenue.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'DMARC Analytics', value: 'Real-time' },
              { label: 'Delivery Prediction', value: 'AI-powered' },
              { label: 'Business Impact', value: 'Revenue-focused' },
              { label: 'Sender Intelligence', value: 'Full visibility' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Inmybox</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">
            Sign in to your account to continue
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-md shadow-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Don&apos;t have access yet?{' '}
            <Link href="/demo" className="text-brand-600 hover:text-brand-700 font-semibold">
              Request a demo
            </Link>
          </p>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mt-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
