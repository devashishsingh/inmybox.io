'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  Globe,
  AtSign,
  UserPlus,
  Activity,
  Search,
  Users,
  Mail,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Shield,
  Radar,
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/leads', icon: Radar, label: 'Scan Leads' },
  { href: '/admin/tenants', icon: Building2, label: 'Tenants' },
  { href: '/admin/domains', icon: Globe, label: 'Domains' },
  { href: '/admin/aliases', icon: AtSign, label: 'Alias Mapping' },
  { href: '/admin/invitations', icon: UserPlus, label: 'Invitations' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/ingestion', icon: Activity, label: 'Ingestion' },
  { href: '/admin/inspect', icon: Search, label: 'Inspect' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-sm shadow-red-600/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Admin</span>
            <span className="text-xs text-slate-400 block -mt-0.5">Inmybox</span>
          </div>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-red-500/10 text-red-400 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? 'text-red-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Back to Dashboard link */}
      <div className="px-3 py-3 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
        >
          <Mail className="w-[18px] h-[18px] text-slate-400" />
          Client Dashboard
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {session?.user?.name || 'Admin'}
              </div>
              <div className="text-xs text-slate-400 truncate">
                Super Admin
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-1 z-50">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
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
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        {sidebar}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-white">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 shadow-xl">
            {sidebar}
          </aside>
        </>
      )}
    </>
  )
}
