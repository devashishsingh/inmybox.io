import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'healthy': return 'text-emerald-600'
    case 'medium': return 'text-amber-500'
    case 'high': return 'text-orange-500'
    case 'critical': return 'text-red-600'
    default: return 'text-slate-500'
  }
}

export function getRiskBgColor(level: string): string {
  switch (level) {
    case 'healthy': return 'bg-emerald-50 border-emerald-200'
    case 'medium': return 'bg-amber-50 border-amber-200'
    case 'high': return 'bg-orange-50 border-orange-200'
    case 'critical': return 'bg-red-50 border-red-200'
    default: return 'bg-slate-50 border-slate-200'
  }
}
