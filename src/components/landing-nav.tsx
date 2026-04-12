'use client'

// INMYBOX HERO ENHANCEMENT — Scroll-based glassmorphism nav
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Mail, ArrowRight } from 'lucide-react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(8,12,24,0.85)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-white/[0.07] skeuo-nav-ridge'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Inmybox
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {[{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Blue Tick', href: '/blue-tick' }, { label: 'Pricing', href: '/pricing' }, { label: 'Blog', href: '/blog' }].map((item) => {
              const isExternal = item.href.startsWith('#')
              const Component = isExternal ? 'a' : Link
              return (
                <Component
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium transition-colors text-slate-300 hover:text-white"
                >
                  {item.label}
                </Component>
              )
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium transition-colors text-slate-300 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg border transition-all border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
            >
              Start Free
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-500/25 skeuo-btn"
            >
              Request Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg transition-colors text-slate-300 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {[{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Blue Tick', href: '/blue-tick' }, { label: 'Pricing', href: '/pricing' }, { label: 'Blog', href: '/blog' }].map((item) => {
              const isExternal = item.href.startsWith('#')
              const Component = isExternal ? 'a' : Link
              return (
                <Component
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-slate-600 hover:text-brand-600 py-2"
                >
                  {item.label}
                </Component>
              )
            })}
            <hr className="border-slate-100" />
            <Link
              href="/auth/signin"
              className="block text-sm font-medium text-slate-600 hover:text-brand-600 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="block w-full text-center text-sm font-semibold px-4 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
            >
              Request Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
