import { Metadata } from 'next'
import { OnboardingWizard } from '@/components/onboarding-wizard'

export const metadata: Metadata = {
  title: 'Setup | Inmybox',
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <OnboardingWizard />
    </div>
  )
}
