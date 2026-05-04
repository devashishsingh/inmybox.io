'use client'

// INMYBOX REDESIGN — Spiritual Industrial Navbar
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Mail, ArrowRight } from 'lucide-react'

export function NavbarV2() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Blue Tick', href: '/blue-tick' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
  ]

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4">
      <nav
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 ember-glass ${
          scrolled ? 'shadow-2xl shadow-black/40' : ''
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="ember-avatar">
              <Mail className="w-4 h-4 text-amber-400" />
            </span>
            <span className="font-display font-bold text-white tracking-tight text-base">
              Inmybox
            </span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 pr-1 border-r border-white/10 mr-1">
              <NavSocial href="https://twitter.com/inmybox" label="X (Twitter)" tone="x">
                <NavXLogo />
              </NavSocial>
              <NavSocial href="https://linkedin.com/company/inmybox" label="LinkedIn" tone="linkedin">
                <NavLinkedInLogo />
              </NavSocial>
              <NavSocial href="mailto:hello@inmybox.io" label="Email" tone="mail">
                <Mail className="w-3.5 h-3.5" />
              </NavSocial>
            </div>
            <Link
              href="/auth/signin"
              className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link href="/auth/signup" className="ember-shiny-cta !py-2 !px-4 !text-[13px]">
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 ember-cta-icon" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-full text-zinc-300 hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden mt-2 max-w-6xl mx-auto ember-glass rounded-2xl p-4 space-y-2">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-300 hover:text-white py-2 px-2"
            >
              {item.label}
            </Link>
          ))}
          <hr className="border-white/10" />
          <div className="flex items-center justify-center gap-3 py-2">
            <NavSocial href="https://twitter.com/inmybox" label="X (Twitter)" tone="x">
              <NavXLogo />
            </NavSocial>
            <NavSocial href="https://linkedin.com/company/inmybox" label="LinkedIn" tone="linkedin">
              <NavLinkedInLogo />
            </NavSocial>
            <NavSocial href="mailto:hello@inmybox.io" label="Email" tone="mail">
              <Mail className="w-3.5 h-3.5" />
            </NavSocial>
          </div>
          <hr className="border-white/10" />
          <Link
            href="/auth/signin"
            className="block text-sm text-zinc-300 hover:text-white py-2 px-2"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="block text-center ember-shiny-cta !text-sm w-full"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 ember-cta-icon" />
          </Link>
        </div>
      )}
    </header>
  )
}

/* ─── Colorful brand-tinted social icons ───────────────────────── */
function NavSocial({
  href,
  label,
  tone,
  children,
}: {
  href: string
  label: string
  tone: 'x' | 'linkedin' | 'mail'
  children: React.ReactNode
}) {
  const external = href.startsWith('http')
  const toneClass =
    tone === 'x'
      ? 'text-white hover:bg-white/10 border-white/20'
      : tone === 'linkedin'
        ? 'text-[#0A66C2] hover:bg-[#0A66C2]/15 border-[#0A66C2]/40'
        : 'text-amber-400 hover:bg-amber-400/15 border-amber-400/40'
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`w-7 h-7 rounded-full border bg-white/[0.03] flex items-center justify-center transition-colors ${toneClass}`}
    >
      {children}
    </a>
  )
}

function NavXLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function NavLinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
