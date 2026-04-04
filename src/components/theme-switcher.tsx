'use client'

import { useTheme, type Theme } from './theme-provider'
import { Sun, Moon, Sunset } from 'lucide-react'

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'warm', label: 'Night Light', icon: Sunset },
]

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    const current = themes.find((t) => t.id === theme) || themes[0]
    const next = themes[(themes.findIndex((t) => t.id === theme) + 1) % themes.length]
    return (
      <button
        onClick={() => setTheme(next.id)}
        title={`Switch to ${next.label}`}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <current.icon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
      {themes.map((t) => {
        const active = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`p-2 rounded-lg transition-all ${
              active
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
