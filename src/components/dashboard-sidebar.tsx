'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  FileText,
  Users,
  Download,
  Settings,
  Mail,
  Menu,
  X,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { ThemeSwitcher } from './theme-switcher'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/senders', icon: Users, label: 'Senders' },
  { href: '/dashboard/actions', icon: AlertTriangle, label: 'Actions Required' },
  { href: '/dashboard/bimi', icon: Shield, label: 'BIMI & Brand' },
  { href: '/dashboard/export', icon: Download, label: 'Export' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b dash-divider">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm shadow-brand-600/20">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold dash-heading tracking-tight">Inmybox</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'dash-sidebar-item-active text-brand-400'
                  : 'dash-sidebar-item text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? 'text-brand-400' : 'text-slate-500'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Theme Switcher */}
      <div className="px-4 py-3 border-t dash-divider">
        <ThemeSwitcher />
      </div>

      {/* Admin Link (super_admin only) */}
      {session?.user?.role === 'super_admin' && (
        <div className="px-3 py-2 border-t dash-divider">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Shield className="w-[18px] h-[18px] text-red-500" />
            Admin Panel
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4 border-t dash-divider">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">
                {session?.user?.name || 'User'}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {session?.user?.email || ''}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 dash-menu py-1 z-50">
              <Link
                href="/dashboard/settings"
                onClick={() => { setUserMenuOpen(false); setMobileOpen(false) }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 dash-sidebar h-screen sticky top-0 z-[2]">
        {sidebar}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 dash-sidebar border-b border-white/[0.06] flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Mail className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold dash-heading">Inmybox</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 dash-sidebar shadow-2xl shadow-black/50">
            {sidebar}
          </aside>
        </>
      )}
    </>
  )
}
