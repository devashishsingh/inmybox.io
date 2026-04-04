'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Mail, ArrowRight } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDarkHero = !scrolled

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
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
            <span className={`text-lg font-bold tracking-tight transition-colors ${isDarkHero ? 'text-white' : 'text-slate-900'}`}>
              Inmybox
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className={`text-sm font-medium transition-colors ${isDarkHero ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-brand-600'}`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/signin"
              className={`text-sm font-medium transition-colors ${isDarkHero ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-500/25"
            >
              Request Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${isDarkHero ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}
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
            {['Features', 'How It Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-600 hover:text-brand-600 py-2"
              >
                {item}
              </a>
            ))}
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
