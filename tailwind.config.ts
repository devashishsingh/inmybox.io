import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // INMYBOX REDESIGN — Spiritual Industrial palette
        ember: {
          red: '#ef233c',
          saffron: '#f59e0b',
          gold: '#d4a843',
          emerald: '#10b981',
          ink: '#0a0303',
          obsidian: '#000000',
          ash: '#1a0a05',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'border-spin': 'border-spin 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-sm': 'float-sm 4s ease-in-out infinite',
        'float-card-1': 'float-card-1 5s ease-in-out infinite',
        'float-card-2': 'float-card-2 6s ease-in-out infinite',
        'float-card-3': 'float-card-3 7s ease-in-out infinite',
        'orb-drift-1': 'orb-drift-1 20s ease-in-out infinite alternate',
        'orb-drift-2': 'orb-drift-2 25s ease-in-out infinite alternate',
        'orb-pulse': 'orb-pulse 8s ease-in-out infinite',
        'star-1': 'animStar 50s linear infinite',
        'star-2': 'animStar 80s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.0), 0 0 20px -10px rgba(239,35,60,0.0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(245,158,11,0.08), 0 0 40px -10px rgba(239,35,60,0.35)' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        animStar: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2000px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-sm': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'float-card-1': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-8px) translateX(3px)' },
        },
        'float-card-2': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(6px) translateX(-4px)' },
        },
        'float-card-3': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-5px) translateX(2px)' },
          '66%': { transform: 'translateY(3px) translateX(-3px)' },
        },
        'orb-drift-1': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(60px, 40px)' },
        },
        'orb-drift-2': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-50px, -30px)' },
        },
        'orb-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
