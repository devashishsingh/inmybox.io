import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { EmberShell } from '@/components/ember-shell'

export const metadata: Metadata = {
  title: 'Security',
  description:
    'Inmybox security practices — how we protect your data, infrastructure, and email authentication intelligence.',
}

export default function SecurityPage() {
  return (
    <EmberShell withNav={false}>
      <div className="min-h-screen">
        <header className="border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Inmybox</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-white mb-2">Security</h1>
          <p className="text-sm text-zinc-400 mb-10">Last updated: May 11, 2026</p>

          <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-300">
            <h2>1. Our Commitment</h2>
            <p>
              Security is foundational to Inmybox. As an email-authentication and deliverability
              platform, our customers trust us with sensitive DMARC report data, domain
              configuration details, and sender intelligence. We take that trust seriously and
              apply industry-standard practices across our infrastructure, application, and
              organization.
            </p>

            <h2>2. Data Encryption</h2>
            <h3>In Transit</h3>
            <p>
              All traffic to and from Inmybox is encrypted using TLS 1.2 or higher. We enforce
              HTTPS everywhere and use HSTS to prevent protocol downgrade attacks. Internal
              service-to-service communication is also encrypted.
            </p>
            <h3>At Rest</h3>
            <p>
              All customer data — including DMARC reports, account information, and analytics — is
              encrypted at rest using AES-256. Backups are encrypted with the same standard and
              stored in geographically separated regions.
            </p>

            <h2>3. Authentication &amp; Access Control</h2>
            <ul>
              <li>Passwords are hashed using bcrypt with strong salt rounds — we never store plaintext credentials.</li>
              <li>Optional two-factor authentication (TOTP) is supported for all accounts.</li>
              <li>Session tokens are signed, short-lived, and rotated on privilege change.</li>
              <li>Administrative access to production systems requires SSO, MFA, and is restricted by least-privilege role.</li>
            </ul>

            <h2>4. Infrastructure Security</h2>
            <ul>
              <li>Inmybox runs on a hardened cloud platform with isolated networking, private subnets, and least-privilege IAM.</li>
              <li>All production resources sit behind a managed firewall with default-deny rules.</li>
              <li>Container images and deployments are scanned for known vulnerabilities on every build.</li>
              <li>Operating systems and dependencies are patched on a regular cadence; critical CVEs are addressed within established SLAs.</li>
            </ul>

            <h2>5. Application Security</h2>
            <ul>
              <li>Input validation and output encoding throughout the application to mitigate OWASP Top 10 risks.</li>
              <li>Parameterized queries via Prisma ORM — protecting against SQL injection.</li>
              <li>Strict Content Security Policy (CSP) and standard security headers on all responses.</li>
              <li>CSRF protection on all state-changing requests.</li>
              <li>Regular dependency audits and automated security advisories.</li>
            </ul>

            <h2>6. Email Authentication</h2>
            <p>
              Inmybox itself follows the same standards we help our customers adopt. Our own
              domains publish strict SPF, DKIM, and DMARC <code>p=reject</code> records, and we
              monitor our reputation continuously.
            </p>

            <h2>7. Monitoring &amp; Incident Response</h2>
            <p>
              We maintain centralized logging, anomaly detection, and 24/7 alerting on critical
              systems. We have a documented incident response process and notify affected
              customers without undue delay if a security event materially impacts their data.
            </p>

            <h2>8. Data Isolation &amp; Tenancy</h2>
            <p>
              Inmybox is a multi-tenant platform. Customer data is logically isolated at the
              database layer with tenant-scoped queries enforced at the application boundary.
              Cross-tenant access is prohibited and validated through automated tests.
            </p>

            <h2>9. Backups &amp; Disaster Recovery</h2>
            <p>
              Automated, encrypted backups run daily with point-in-time recovery for the
              production database. Our recovery procedures are tested regularly to ensure
              business continuity.
            </p>

            <h2>10. Vendor &amp; Sub-processor Management</h2>
            <p>
              We vet every third-party service we use and require contractual data-protection
              commitments. A current list of sub-processors is available on request.
            </p>

            <h2>11. Responsible Disclosure</h2>
            <p>
              We welcome reports from the security community. If you believe you&apos;ve found a
              vulnerability in Inmybox, please email{' '}
              <a href="mailto:security@inmybox.io" className="text-indigo-400 hover:text-indigo-300">
                security@inmybox.io
              </a>{' '}
              with details. We commit to acknowledging valid reports promptly and will not pursue
              legal action against good-faith researchers who follow this process.
            </p>

            <h2>12. Compliance</h2>
            <p>
              Our security program is designed to align with widely recognized frameworks
              including SOC 2, ISO 27001, and GDPR. Specific certification status and supporting
              documentation are available to enterprise customers on request.
            </p>

            <h2>13. Contact</h2>
            <p>
              For security questions, audit requests, or compliance documentation, contact{' '}
              <a href="mailto:security@inmybox.io" className="text-indigo-400 hover:text-indigo-300">
                security@inmybox.io
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    </EmberShell>
  )
}
