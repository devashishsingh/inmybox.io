'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle, Building2 } from 'lucide-react'

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [state, setState] = useState<'loading' | 'valid' | 'invalid' | 'accepting' | 'success' | 'error'>('loading')
  const [invitation, setInvitation] = useState<any>(null)
  const [form, setForm] = useState({ name: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    fetch(`/api/invite/accept?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setInvitation(d.invitation)
          setState('valid')
        } else {
          setError(d.error || 'Invalid or expired invitation')
          setState('invalid')
        }
      })
      .catch(() => setState('invalid'))
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('accepting')
    setError('')
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState('success')
      setTimeout(() => router.push('/auth/signin'), 3000)
    } catch (err: any) {
      setError(err.message)
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold">Inmybox</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          {state === 'loading' && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Validating invitation...</p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Invalid Invitation</h2>
              <p className="text-slate-400 text-sm">{error || 'This invitation link is invalid or has expired.'}</p>
              <button onClick={() => router.push('/auth/signin')} className="mt-6 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500">
                Go to Login
              </button>
            </div>
          )}

          {(state === 'valid' || state === 'accepting' || state === 'error') && invitation && (
            <>
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-brand-400" />
                  <div>
                    <div className="text-white font-medium">You&apos;re invited to join</div>
                    <div className="text-brand-400 text-sm font-semibold">{invitation.tenantName || 'a team'}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAccept} className="p-6 space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input type="email" disabled value={invitation.email}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-brand-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password *</label>
                  <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-brand-500" placeholder="Min 6 characters" />
                </div>
                <button type="submit" disabled={state === 'accepting'}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50 transition-colors">
                  {state === 'accepting' ? 'Setting up your account...' : 'Accept Invitation & Join'}
                </button>
              </form>
            </>
          )}

          {state === 'success' && (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Welcome aboard!</h2>
              <p className="text-slate-400 text-sm">Your account has been created. Redirecting to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
