'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { ShieldCheck, Copy, Check, AlertCircle, LogOut } from 'lucide-react'

type Step = 'loading' | 'scan' | 'confirm' | 'backup' | 'done' | 'error'

export default function Setup2FAPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<Step>('loading')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  useEffect(() => {
    if (!session) return
    if (session.user.totpEnabled) {
      router.replace('/dashboard')
      return
    }
    // Start enrollment — get QR URI from server
    fetch('/api/auth/2fa/enroll', { method: 'POST' })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) { setStep('error'); return }
        setSecret(data.secret)
        const dataUrl = await QRCode.toDataURL(data.uri, { width: 200, margin: 2, color: { dark: '#ffffff', light: '#111318' } })
        setQrDataUrl(dataUrl)
        setStep('scan')
      })
      .catch(() => setStep('error'))
  }, [session, router])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, context: 'enroll' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setBackupCodes(data.backupCodes)
      // Refresh session so totpEnabled is true
      await update({ totpEnabled: true, twoFactorVerified: true })
      setStep('backup')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  // Auto-advance code input
  const handleCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <div className="bg-[#111318] border border-white/[0.07] rounded-2xl px-8 py-10 shadow-2xl">

          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Preparing setup...</p>
            </div>
          )}

          {/* ── SCAN QR ── */}
          {step === 'scan' && (
            <>
              <h1 className="text-white text-xl font-semibold text-center mb-1">Set up two-factor authentication</h1>
              <p className="text-zinc-500 text-sm text-center mb-6">
                Scan this QR code with <span className="text-zinc-300 font-medium">Google Authenticator</span> on your phone.
              </p>

              {qrDataUrl && (
                <div className="flex justify-center mb-5">
                  <div className="p-3 bg-[#111318] rounded-xl border border-white/10">
                    <img src={qrDataUrl} alt="TOTP QR Code" width={180} height={180} className="rounded" />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs text-zinc-500 text-center mb-2">Can&apos;t scan? Enter this key manually:</p>
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">
                  <code className="flex-1 text-xs text-zinc-300 font-mono break-all">{secret}</code>
                  <button
                    onClick={handleCopySecret}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Copy secret key"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep('confirm')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                I&apos;ve scanned it →
              </button>
            </>
          )}

          {/* ── CONFIRM CODE ── */}
          {step === 'confirm' && (
            <>
              <h1 className="text-white text-xl font-semibold text-center mb-1">Enter verification code</h1>
              <p className="text-zinc-500 text-sm text-center mb-6">
                Enter the 6-digit code from your authenticator app to confirm setup.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleConfirm}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="000000"
                  autoFocus
                  className="w-full py-4 text-center text-2xl font-mono tracking-[0.5em] rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all mb-4"
                />
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Verify & Enable 2FA'
                  )}
                </button>
              </form>

              <button
                onClick={() => setStep('scan')}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
              >
                ← Back to QR code
              </button>
            </>
          )}

          {/* ── BACKUP CODES ── */}
          {step === 'backup' && (
            <>
              <h1 className="text-white text-xl font-semibold text-center mb-1">Save your backup codes</h1>
              <p className="text-zinc-500 text-sm text-center mb-5">
                These codes can be used if you lose access to your authenticator app.
                <span className="text-amber-400 font-medium"> Each code can only be used once.</span>
              </p>

              <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((c) => (
                    <code key={c} className="text-xs font-mono text-zinc-300 bg-white/[0.04] rounded-lg px-2 py-1.5 text-center tracking-wider">
                      {c}
                    </code>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCopyBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors mb-3"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy all codes'}
              </button>

              <button
                onClick={() => router.push('/onboarding')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                I&apos;ve saved them — Continue →
              </button>
            </>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Setup failed</p>
              <p className="text-zinc-500 text-sm mb-5">Unable to initialise 2FA. Please try signing in again.</p>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-2 mx-auto text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Compatible with Google Authenticator, Authy, and any TOTP app
        </p>
      </div>
    </div>
  )
}
