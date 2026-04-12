import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Inmybox terms of service — terms governing use of our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Inmybox</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 13, 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Inmybox (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Inmybox provides email reputation intelligence and DMARC analytics services. We process
            DMARC aggregate reports to provide delivery health metrics, sender intelligence, and
            business impact analytics.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            You must register for an account to use the Service. You are responsible for maintaining
            the confidentiality of your account credentials. You must provide accurate and complete
            registration information.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Upload malicious files or content</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use the Service to engage in email abuse, spam, or phishing</li>
            <li>Reverse engineer, decompile, or disassemble the Service</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2>5. Data Ownership</h2>
          <p>
            You retain ownership of all DMARC report data you upload. By uploading data, you grant
            us a limited license to process, store, and analyze it solely for providing the Service
            to you.
          </p>

          <h2>6. Service Availability</h2>
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may
            suspend the Service for maintenance with reasonable notice.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties. Business impact
            calculations are estimates based on your configured assumptions and should not be relied
            upon as financial advice. Our liability is limited to the fees paid in the preceding 12
            months.
          </p>

          {/* INMYBOX ENHANCEMENT: L6 — lead/demo data retention specificity */}
          <h2>8. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. Upon termination, we will delete
            your account and associated DMARC report data within 30 days unless retention is
            required by law.
          </p>
          <p>
            Demo requests and lead submissions from non-registered users are retained for up to
            12 months for follow-up purposes and are then automatically purged. You may request
            earlier deletion by contacting us.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These terms are governed by and construed in accordance with applicable laws. Any
            disputes shall be resolved through arbitration.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. Continued use of the Service after changes
            constitutes acceptance of the modified terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@inmybox.io" className="text-brand-600 hover:underline">
              legal@inmybox.io
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
