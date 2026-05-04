import type { Metadata } from 'next'
// INMYBOX REDESIGN — Spiritual Industrial. Rollback: swap import back to '@/components/landing-page'
import { LandingPageV2 } from '@/components/landing-page-v2'

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
  return <LandingPageV2 />
}