'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, Globe, AtSign, Activity, AlertTriangle } from 'lucide-react'

interface Stats {
  tenants: number
  users: number
  domains: number
  aliases: number
  pendingIngestion: number
  failedIngestion: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/tenants?limit=1').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/domains').then((r) => r.json()),
      fetch('/api/admin/aliases').then((r) => r.json()),
      fetch('/api/admin/ingestion?limit=1').then((r) => r.json()),
    ])
      .then(([tenants, users, domains, aliases, ingestion]) => {
        setStats({
          tenants: tenants.total || 0,
          users: Array.isArray(users) ? users.length : 0,
          domains: Array.isArray(domains) ? domains.length : 0,
          aliases: Array.isArray(aliases) ? aliases.length : 0,
          pendingIngestion: ingestion.summary?.processing || 0,
          failedIngestion: ingestion.summary?.failed || 0,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Tenants', value: stats?.tenants || 0, icon: Building2, href: '/admin/tenants', color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Users', value: stats?.users || 0, icon: Users, href: '/admin/users', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Domains', value: stats?.domains || 0, icon: Globe, href: '/admin/domains', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Aliases', value: stats?.aliases || 0, icon: AtSign, href: '/admin/aliases', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Processing', value: stats?.pendingIngestion || 0, icon: Activity, href: '/admin/ingestion', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Failed Jobs', value: stats?.failedIngestion || 0, icon: AlertTriangle, href: '/admin/ingestion?status=failed', color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage tenants, domains, aliases, and monitor ingestion.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-slate-400">{card.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
