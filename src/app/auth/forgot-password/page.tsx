'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call — in production, send reset email
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="ember-root min-h-screen ember-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ember-stars-1" />
        <div className="ember-stars-2" />
        <div className="absolute inset-0 ember-grid" />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <span className="ember-avatar"><Mail className="w-4 h-4 text-amber-400" /></span>
          <span className="font-display text-lg font-bold text-white tracking-tight">Inmybox</span>
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              If an account exists for <strong className="text-zinc-200">{email}</strong>, we&apos;ve sent
              password reset instructions.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Reset your password</h1>
            <p className="text-sm text-zinc-400 mb-8">
              Enter the email associated with your account, and we&apos;ll send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ember-shiny-cta w-full justify-center !py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4 ember-cta-icon" />
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-zinc-400 text-center mt-6">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
