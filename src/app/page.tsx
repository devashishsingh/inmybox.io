import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'Inmybox — Email Reputation Intelligence & DMARC Analytics',
  description:
    'Inmybox closes the gap between sent and seen. DMARC aggregation, sender intelligence, and revenue-impact analytics for growth teams.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Inmybox — Email Reputation Intelligence & DMARC Analytics',
    description:
      'Protect your sender reputation and revenue pipeline with unified DMARC analytics, sender intelligence, and business-impact scoring.',
    url: '/',
  },
}

export default function HomePage() {
  return <LandingPage />
}