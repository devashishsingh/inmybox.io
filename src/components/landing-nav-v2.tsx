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
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Blue Tick', href: '/blue-tick' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
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
            {navLinks.map((item) => {
              const isHash = item.href.startsWith('#')
              const Cmp: any = isHash ? 'a' : Link
              return (
                <Cmp
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors tracking-wide"
                >
                  {item.label}
                </Cmp>
              )
            })}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
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
          {navLinks.map((item) => {
            const isHash = item.href.startsWith('#')
            const Cmp: any = isHash ? 'a' : Link
            return (
              <Cmp
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-zinc-300 hover:text-white py-2 px-2"
              >
                {item.label}
              </Cmp>
            )
          })}
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
