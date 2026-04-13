import type { Metadata } from 'next'
import { RequestDemoForm } from '@/components/demo-form'

export const metadata: Metadata = {
  title: 'Request a Demo',
  description:
    'Get a personalized walkthrough of Inmybox. See how DMARC intelligence can protect your sender reputation and revenue pipeline.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Request a Demo | Inmybox',
    description:
      'Get a personalized walkthrough of Inmybox. See how DMARC intelligence can protect your sender reputation and revenue pipeline.',
    url: '/demo',
  },
}

export default function RequestDemoPage() {
  return <RequestDemoForm />
}