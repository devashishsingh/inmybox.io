'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  User,
  Building2,
  Phone,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  BarChart3,
  Eye,
  Zap,
  Calendar,
  Headphones,
} from 'lucide-react'

export function RequestDemoForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/150/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Thank You, {form.name.split(' ')[0]}!
          </h1>
          <p className="text-zinc-400 leading-relaxed mb-3">
            Your demo request has been received. A member of our team will reach out to{' '}
            <span className="font-semibold text-zinc-200">{form.email}</span>{' '}
            within 1 business day to schedule your personalized walkthrough.
          </p>
          <p className="text-sm text-zinc-500 mb-8">
            In the meantime, feel free to explore how Inmybox helps growth teams protect their email reputation and revenue pipeline.
          </p>

          <div className="bg-white/[0.04] rounded-2xl border border-white/10 p-6 mb-8 text-left">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300" />
              What to Expect
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Our team reviews your request and confirms your demo slot via email' },
                { step: '2', text: 'A 20-minute live walkthrough tailored to your email infrastructure' },
                { step: '3', text: 'Once your DMARC record points to Inmybox, reports flow in automatically from Google, Yahoo and Microsoft — no manual uploads needed' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-300">{item.step}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-amber-500/90 text-white hover:bg-amber-500 transition-colors shadow-md shadow-amber-500/20"
            >
              Back to Home
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-white/10 text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              Already have access? Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Left panel GÇö value props */}
      <div className="hidden lg:flex lg:w-1/2 bg-transparent relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 hero-glow opacity-30" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/90 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Inmybox</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            See what&apos;s happening to your emails GÇö before revenue is lost
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-10">
            Get a personalized demo of Inmybox and discover how DMARC intelligence
            can protect your sender reputation and campaign performance.
          </p>

          <div className="space-y-5 mb-10">
            {[
              { icon: Shield, text: 'Full DMARC report analytics at a glance' },
              { icon: Eye, text: 'Identify every sender using your domain' },
              { icon: BarChart3, text: 'Quantify revenue at risk from delivery failures' },
              { icon: Zap, text: 'Actionable fixes GÇö not just raw data' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-amber-300" />
                </div>
                <span className="text-sm text-zinc-300 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.04] rounded-xl p-5 border border-white/10">
            <div className="flex items-start gap-3">
              <Headphones className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Personalized walkthrough</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Every demo is customized to your domain, your email stack, and your goals.
                  No generic slide decks GÇö just your data, your insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel GÇö form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-amber-500/90 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Inmybox</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Request a Demo</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Fill in your details and our team will schedule a personalized walkthrough for you.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Jane Smith"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Work Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition-shadow"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Please use your company email</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="company"
                    type="text"
                    value={form.company}
                    onChange={update('company')}
                    placeholder="Acme Inc."
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="+60 12-345-6789"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition-shadow"
                  />
                </div>
                {/* INMYBOX ENHANCEMENT: L7 GÇö phone field purpose disclosure */}
                <p className="text-xs text-zinc-500 mt-1">Optional GÇö used only to schedule your demo call</p>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Anything specific you&apos;d like to see?
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <textarea
                  id="message"
                  value={form.message}
                  onChange={update('message')}
                  rows={3}
                  placeholder="We're struggling with inbox placement on our marketing campaignsGÇª"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/40 outline-none transition-shadow resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold text-white bg-amber-500/90 hover:bg-amber-500 rounded-xl transition-colors shadow-md shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Request Demo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-4">
            By submitting, you agree to our{' '}
            <Link href="/terms" className="text-amber-300 hover:underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-amber-300 hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-sm text-zinc-500 text-center mt-6">
            Already have access?{' '}
            <Link href="/auth/signin" className="text-amber-300 hover:text-amber-200 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
