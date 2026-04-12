import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Inmybox privacy policy — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 13, 2026</p>

        <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
          <h2>1. Introduction</h2>
          <p>
            Inmybox (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our email reputation intelligence platform.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your name, email address, company name, and
            password (stored securely using bcrypt hashing).
          </p>
          <h3>DMARC Report Data</h3>
          <p>
            When you upload DMARC aggregate reports, we process and store the data contained in
            those reports, including sending IP addresses, authentication results, and message
            disposition information.
          </p>
          <h3>Usage Data</h3>
          <p>
            We collect standard usage data including pages visited, features used, and interaction
            patterns to improve our service.
          </p>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain our email analytics service</li>
            <li>To process and analyze your DMARC reports</li>
            <li>To generate delivery health and business impact analytics</li>
            <li>To send you notifications and service updates</li>
            <li>To improve our product and develop new features</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. All data is
            encrypted in transit using TLS. Passwords are hashed using bcrypt with salt rounds.
            We conduct regular security reviews.
          </p>

          {/* INMYBOX ENHANCEMENT: M10/M11 — disclose third-party IP enrichment services */}
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with third-party service
            providers who assist in operating our platform, subject to confidentiality obligations.
          </p>
          <h3>IP Enrichment Services</h3>
          <p>
            To provide sender intelligence from your DMARC reports, we query the following external
            services with the sending IP addresses found in those reports:
          </p>
          <ul>
            <li><strong>RDAP (rdap.org)</strong> — to resolve IP ownership and registrant details</li>
            <li><strong>BGPView (bgpview.io)</strong> — to resolve ASN and network information</li>
          </ul>
          <p>
            These services receive only the IP addresses contained in your DMARC reports. No
            personal user information is transmitted to these services.
          </p>

          <h2>6. Your Rights (GDPR)</h2>
          <p>
            If you are located in the European Economic Area, you have rights including: access to
            your data, rectification, erasure, restriction of processing, data portability, and
            objection to processing. Contact us to exercise these rights.
          </p>

          {/* INMYBOX ENHANCEMENT: L6 — lead/demo data retention clause */}
          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide
            services. You can configure report data retention in your workspace settings. Upon
            account deletion, we remove your data within 30 days.
          </p>
          <h3>Lead &amp; Demo Request Data</h3>
          <p>
            If you submit a demo request or contact form, we retain your name, email, company,
            phone number (if provided), and message for up to 12 months to follow up and improve
            our service. You may request deletion of this data at any time by contacting us.
          </p>

          {/* INMYBOX ENHANCEMENT: M10 — expanded cookie disclosure */}
          <h2>8. Cookies</h2>
          <p>
            We use the following cookies:
          </p>
          <ul>
            <li>
              <strong>next-auth.session-token</strong> (essential) — Authenticates your session.
              Expires after 7 days of inactivity. HttpOnly, Secure.
            </li>
            <li>
              <strong>cookie-consent</strong> (essential) — Records your cookie consent choice.
              Expires after 365 days. HttpOnly.
            </li>
            <li>
              <strong>theme</strong> (functional) — Stores your light/dark theme preference.
              Persistent. Not sent to server.
            </li>
          </ul>
          <p>
            We do not use third-party advertising or tracking cookies. Analytics cookies, if
            introduced in the future, will require your explicit consent before activation.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{' '}
            <a href="mailto:privacy@inmybox.io" className="text-brand-600 hover:underline">
              privacy@inmybox.io
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
