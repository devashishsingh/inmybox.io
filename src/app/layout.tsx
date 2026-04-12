import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: 'Inmybox — Email Reputation Intelligence & DMARC Analytics',
    template: '%s | Inmybox',
  },
  description:
    'Inmybox helps businesses understand why emails fail, who sends under their domain, and how sender reputation impacts leads and revenue. DMARC aggregation, delivery prediction, and business impact analytics.',
  keywords: [
    'DMARC',
    'email deliverability',
    'email reputation',
    'sender trust',
    'SPF',
    'DKIM',
    'email authentication',
    'inbox delivery',
    'email analytics',
    'campaign delivery',
    'email security',
    'domain reputation',
    'DMARC reporting',
    'email intelligence',
  ],
  authors: [{ name: 'Inmybox' }],
  creator: 'Inmybox',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Inmybox',
    title: 'Inmybox — Email Reputation Intelligence & DMARC Analytics',
    description:
      'Stop losing leads to spam. Understand your email delivery health, sender reputation, and revenue impact with intelligent DMARC analytics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Inmybox - Email Reputation Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inmybox — Email Reputation Intelligence',
    description:
      'Stop losing leads to spam. Understand your email delivery health, sender reputation, and revenue impact.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        {/* INMYBOX ENHANCEMENT — Phase 6 L2: Moved from raw <script> to nonce-ready pattern */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('inmybox-theme')||'dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
