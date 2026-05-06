'use client'
// NOTE: This file uses @react-pdf/renderer — only import in API routes (server) or
// dynamic() with ssr:false on client. Never import directly in SSR server components.

import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Image, Link,
} from '@react-pdf/renderer'
import { colors } from './theme'

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // ── Header band ─────────────────────────────────────
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  brandName: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  docTitle: {
    color: colors.white,
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  docSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  // ── Body ────────────────────────────────────────────
  body: {
    paddingHorizontal: 48,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginTop: 24,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.lightText,
    marginTop: 14,
    marginBottom: 6,
  },
  p: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  // ── Step boxes ──────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNum: {
    color: colors.white,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.lightText,
    marginBottom: 3,
  },
  stepBody: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
  },
  // ── Code block ──────────────────────────────────────
  codeBlock: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  // ── Info box ────────────────────────────────────────
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 1.5,
  },
  // ── Warning box ─────────────────────────────────────
  warnBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warnText: {
    fontSize: 9.5,
    color: '#78350f',
    lineHeight: 1.5,
  },
  // ── Table ───────────────────────────────────────────
  table: {
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9.5,
    color: '#334155',
    flex: 1,
    lineHeight: 1.4,
  },
  // ── Footer ──────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  // ── Pill badges ─────────────────────────────────────
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 9,
    color: colors.primary,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 16,
  },
})

// ── Shared composites ────────────────────────────────

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.header}>
      <View style={s.logoRow}>
        <View style={s.logoBox}>
          <Text style={s.logoText}>iB</Text>
        </View>
        <Text style={s.brandName}>InMyBox</Text>
      </View>
      <Text style={s.docTitle}>{title}</Text>
      <Text style={s.docSubtitle}>{subtitle}</Text>
    </View>
  )
}

function Footer({ pageNum, total }: { pageNum?: string; total?: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>InMyBox · DMARC Monitoring Platform · app.inmybox.io</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      } />
    </View>
  )
}

function Step({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepBadge}><Text style={s.stepNum}>{num}</Text></View>
      <View style={s.stepContent}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepBody}>{body}</Text>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────
// DOCUMENT 1: Client Onboarding Guide
// ─────────────────────────────────────────────────────
export function OnboardingGuidePDF({ tenantName = 'Your Organisation', generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }) {
  return (
    <Document title="InMyBox Client Onboarding Guide" author="InMyBox" subject="DMARC Monitoring Onboarding">
      <Page size="A4" style={s.page}>
        <Header
          title="Client Onboarding Guide"
          subtitle={`Prepared for: ${tenantName}  ·  ${generatedDate}`}
        />

        <View style={s.body}>
          {/* Welcome */}
          <Text style={s.sectionTitle}>Welcome to InMyBox</Text>
          <Text style={s.p}>
            InMyBox is an enterprise DMARC monitoring platform that gives you full visibility into who is sending
            email on behalf of your domain — and whether those senders are authenticated. This guide walks you
            through every step from account activation to your first DMARC report.
          </Text>

          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Support</Text>
            <Text style={s.infoText}>
              Email: support@inmybox.io  ·  Setup guide online: app.inmybox.io/docs/setup{'\n'}
              Your account manager will reach out within 24 hours of first login.
            </Text>
          </View>

          {/* Phase 1: Account */}
          <Text style={s.sectionTitle}>Phase 1 — Activate Your Account</Text>
          <Step num={1} title="Accept your invitation email" body="Click the secure link in your invitation email. The link is valid for 48 hours. If it has expired, contact support@inmybox.io for a new one." />
          <Step num={2} title="Set your password" body="Choose a strong password (minimum 12 characters). A password manager is recommended." />
          <Step num={3} title="Set up Two-Factor Authentication (mandatory)" body="You will be prompted to scan a QR code with Google Authenticator or any TOTP-compatible app. 2FA is required for all accounts and cannot be skipped." />
          <Step num={4} title="Save your backup codes" body="Download or copy your 8 backup codes and store them securely offline. Each code can only be used once. These allow access if you lose your authenticator device." />

          {/* Phase 2: Domain */}
          <Text style={s.sectionTitle}>Phase 2 — Add Your Domain</Text>
          <Text style={s.p}>
            After login, the onboarding wizard will guide you to add your sending domain (e.g. example.com).
            You can add additional domains later from the dashboard.
          </Text>
          <Step num={1} title="Enter your domain name" body="Type your primary sending domain, e.g. example.com. Do not include www or https." />
          <Step num={2} title="Choose your DMARC report collection method" body="Select one of the three methods below. Method 1 (DNS RUA) is recommended as the most reliable." />

          {/* Phase 3: Collection methods */}
          <Text style={s.sectionTitle}>Phase 3 — Choose a Report Collection Method</Text>

          <Text style={s.subsectionTitle}>Method 1 — DNS RUA Tag (Recommended)</Text>
          <Text style={s.p}>
            Update your DMARC DNS record to include InMyBox as an aggregate report destination. Reports from
            every receiver (Google, Microsoft, Yahoo, etc.) will be delivered automatically.
          </Text>
          <View style={s.codeBlock}>
            <Text style={s.code}>v=DMARC1; p=none; rua=mailto:yourslug@rua.inmybox.io; ruf=mailto:yourslug@rua.inmybox.io; pct=100</Text>
          </View>
          <Text style={s.p}>Replace <Text style={{ fontFamily: 'Helvetica-Bold' }}>yourslug</Text> with the alias shown in your onboarding wizard. DNS changes propagate within 24–48 hours.</Text>

          <Text style={s.subsectionTitle}>Method 2 — Auto-Forward from Your Existing Inbox</Text>
          <Text style={s.p}>
            If you already receive DMARC reports to an existing mailbox, set up an auto-forward rule to
            your InMyBox alias (shown in the wizard). Reports will be forwarded automatically without
            changing your DNS record.
          </Text>

          <Text style={s.subsectionTitle}>Method 3 — Connect Your Inbox (OAuth / IMAP)</Text>
          <Text style={s.p}>
            Grant InMyBox read-only access to your existing mailbox via Google OAuth or Microsoft OAuth.
            InMyBox will scan your inbox every hour for DMARC report attachments and import them automatically.
          </Text>

          <View style={s.warnBox}>
            <Text style={s.warnText}>
              ⚠  InMyBox only reads emails from mail servers (DMARC XML attachments). It does not read, store,
              or access any other email content in your inbox. OAuth access can be revoked at any time from
              your Google/Microsoft account settings.
            </Text>
          </View>

          {/* Phase 4: Verify */}
          <Text style={s.sectionTitle}>Phase 4 — Verify & Go Live</Text>
          <Step num={1} title="Verify DNS propagation" body='Click "Verify DNS" in the wizard. InMyBox will perform a live lookup to confirm your DMARC record is correctly published. This may take up to 48 hours after a DNS change.' />
          <Step num={2} title="Wait for the first report" body="DMARC aggregate reports are delivered daily (usually 02:00–06:00 UTC) by major receivers. Your dashboard will show sample/demo data until the first real report arrives." />
          <Step num={3} title="Review your results" body="Once reports arrive, the demo data is automatically removed. You will receive a celebration email confirming your first live report." />

          {/* Dashboard overview */}
          <Text style={s.sectionTitle}>Dashboard Overview</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { flex: 1.2 }]}>Section</Text>
              <Text style={[s.tableHeaderCell, { flex: 2 }]}>What you will find</Text>
            </View>
            {[
              ['Overview', 'Pass/fail summary, total message volume, risk score trends'],
              ['Senders', 'All IPs and services sending email using your domain'],
              ['Records', 'Raw DMARC records from every report, filterable by result'],
              ['Action Items', 'Prioritised recommendations to improve your DMARC posture'],
              ['Settings → Domains', 'Add domains, manage aliases, view DNS status'],
              ['Settings → 2FA', 'Manage your TOTP device or generate new backup codes'],
            ].map(([a, b], i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>{a}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* FAQ */}
          <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
          {[
            ['How long until I see real data?', 'DNS changes propagate in 24–48 hours. First reports arrive 24–48 hours after that. Expect live data within 3 days of setup.'],
            ['Will my email delivery be affected?', 'No. DMARC monitoring is read-only. Changing the p= policy (none → quarantine → reject) affects delivery, but InMyBox will guide you through this safely.'],
            ['Is my email content ever read?', 'No. InMyBox only reads DMARC XML report files, which contain metadata about email authentication results — never email body content.'],
            ['What if I have multiple domains?', 'Add each domain individually in Settings → Domains. Each domain gets its own RUA alias and dashboard.'],
            ['Can I invite my team?', 'Yes. Go to Settings → Team and send invitation links. You can assign Admin or Viewer roles.'],
          ].map(([q, a], i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <Text style={s.subsectionTitle}>{q}</Text>
              <Text style={s.p}>{a}</Text>
            </View>
          ))}

          <View style={s.divider} />
          <Text style={s.p}>
            For further assistance, email support@inmybox.io or visit app.inmybox.io/docs/setup for the
            full interactive setup guide.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────────────────
// DOCUMENT 2: Application Workflow
// ─────────────────────────────────────────────────────
export function AppWorkflowPDF({ generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }) {
  return (
    <Document title="InMyBox Application Workflow" author="InMyBox" subject="Platform Architecture & Data Flow">
      <Page size="A4" style={s.page}>
        <Header
          title="Application Workflow"
          subtitle={`InMyBox DMARC Platform  ·  Architecture & Data Flow  ·  ${generatedDate}`}
        />

        <View style={s.body}>
          <Text style={s.sectionTitle}>Platform Overview</Text>
          <Text style={s.p}>
            InMyBox is a multi-tenant SaaS DMARC monitoring platform built on Next.js 14, PostgreSQL (Supabase),
            and a dedicated Node.js scanner microservice. This document describes the full data flow from
            DMARC report ingestion through to dashboard visualisation and automated alerts.
          </Text>

          <View style={s.pillRow}>
            {['Next.js 14', 'PostgreSQL', 'Prisma ORM', 'NextAuth.js', 'SendGrid', 'imapflow', 'TOTP 2FA', 'AES-256-GCM'].map(t => (
              <View key={t} style={s.pill}><Text style={s.pillText}>{t}</Text></View>
            ))}
          </View>

          {/* Ingestion */}
          <Text style={s.sectionTitle}>1. DMARC Report Ingestion</Text>
          <Text style={s.p}>Three parallel pipelines ingest DMARC aggregate reports:</Text>

          <Text style={s.subsectionTitle}>Pipeline A — DNS RUA / SendGrid Inbound Parse</Text>
          <View style={s.codeBlock}>
            <Text style={s.code}>
              {'Email receiver  →  rua.inmybox.io  →  SendGrid Inbound Parse\n'}
              {'  →  POST /api/email-inbound\n'}
              {'  →  Signature verification (ECDSA)\n'}
              {'  →  AliasMapping lookup (slug → tenantId)\n'}
              {'  →  Attachment extraction (zip/gz/xml)\n'}
              {'  →  ingestReport() → DmarcReport + DmarcRecord rows'}
            </Text>
          </View>

          <Text style={s.subsectionTitle}>Pipeline B — Direct Upload</Text>
          <View style={s.codeBlock}>
            <Text style={s.code}>
              {'User uploads file  →  POST /api/reports/upload\n'}
              {'  →  Size & type validation (max 50 MB)\n'}
              {'  →  ingestReport() → parsed + stored'}
            </Text>
          </View>

          <Text style={s.subsectionTitle}>Pipeline C — Mailbox Polling (OAuth / IMAP)</Text>
          <View style={s.codeBlock}>
            <Text style={s.code}>
              {'Vercel Cron (hourly)  →  GET /api/cron/fetch-emails\n'}
              {'  →  Bearer token auth (CRON_SECRET)\n'}
              {'  →  ImapPipelineService (existing pipelines)\n'}
              {'  →  pollAllMailboxes() (MailboxConnection table)\n'}
              {'     ├─ Google / Microsoft: XOAUTH2 via ImapFlow\n'}
              {'     └─ Manual IMAP: encrypted password via ImapFlow\n'}
              {'  →  simpleParser() extracts XML attachments\n'}
              {'  →  ingestReport() → stored'}
            </Text>
          </View>

          {/* Ingestion engine */}
          <Text style={s.sectionTitle}>2. Ingestion Engine</Text>
          <Text style={s.p}>All three pipelines converge at a single <Text style={{ fontFamily: 'Courier', fontSize: 10 }}>ingestReport()</Text> function which:</Text>
          {[
            ['Decompresses', 'Handles .zip, .gz, raw .xml. Extracts all inner files.'],
            ['Parses XML', 'Validates DMARC aggregate report schema (RFC 7489). Extracts org, date range, policy applied, records.'],
            ['Deduplicates', 'Skips duplicate reports by (reportId, tenantId, domainId).'],
            ['Stores', 'Creates DmarcReport + N DmarcRecord rows in PostgreSQL.'],
            ['Post-ingestion', 'Purges demo data if present. Triggers first-report celebration email. Updates OnboardingChecklist.'],
          ].map(([a, b], i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}, { paddingHorizontal: 0 }]}>
              <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold', paddingRight: 8 }]}>{a}</Text>
              <Text style={[s.tableCell, { flex: 3 }]}>{b}</Text>
            </View>
          ))}

          {/* Auth */}
          <Text style={s.sectionTitle}>3. Authentication & Security</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderCell}>Layer</Text>
              <Text style={[s.tableHeaderCell, { flex: 2 }]}>Implementation</Text>
            </View>
            {[
              ['Session', 'NextAuth.js JWT strategy, 7-day maxAge, httpOnly cookie'],
              ['2FA', 'TOTP RFC 6238 (Google Authenticator), mandatory on first login'],
              ['2FA Backup', '8 single-use SHA-256 hashed backup codes stored in DB'],
              ['Token encryption', 'AES-256-GCM with ENCRYPTION_KEY env var for OAuth tokens & IMAP passwords'],
              ['Middleware gate', 'Next.js middleware checks totpEnabled + twoFactorVerified flags on every request'],
              ['Multi-tenancy', 'All queries scoped by tenantId. Row-level isolation enforced at service layer.'],
              ['Webhook sig', 'SendGrid ECDSA signature verification on /api/email-inbound'],
              ['Cron auth', 'Bearer token (CRON_SECRET) required on /api/cron/*'],
            ].map(([a, b], i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{a}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Onboarding */}
          <Text style={s.sectionTitle}>4. Onboarding Flow</Text>
          <View style={s.codeBlock}>
            <Text style={s.code}>
              {'Invitation link  →  /invite?token=…\n'}
              {'  →  Validate token, create user, redirect /auth/signin?new=1\n'}
              {'  →  Sign in  →  2FA enroll (/auth/setup-2fa)\n'}
              {'  →  Confirm TOTP  →  Download backup codes\n'}
              {'  →  Redirect to /onboarding (wizard)\n'}
              {'     Step 0: Add domain\n'}
              {'     Step 1: Choose method (DNS / forward / inbox)\n'}
              {'     Step 2: Setup instructions\n'}
              {'     Step 3: Polling / awaiting first report\n'}
              {'     Step 4: Done — redirect to /dashboard\n'}
              {'  →  triggerWelcomeSequence() sends welcome email (once)'}
            </Text>
          </View>

          {/* Email sequences */}
          <Text style={s.sectionTitle}>5. Email Sequences</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderCell}>Trigger</Text>
              <Text style={[s.tableHeaderCell, { flex: 2 }]}>Email sent</Text>
            </View>
            {[
              ['First login (new=1 param)', 'Welcome email with setup checklist and link to onboarding wizard'],
              ['Wizard incomplete after 24h', 'Setup reminder (sent by scheduled job or manual trigger)'],
              ['First real DMARC report arrives', 'Celebration email confirming live monitoring is active'],
            ].map(([a, b], i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{a}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Demo data */}
          <Text style={s.sectionTitle}>6. Demo Data & Lifecycle</Text>
          <Text style={s.p}>
            On domain creation, <Text style={{ fontFamily: 'Courier', fontSize: 10 }}>seedDemoData()</Text> populates the tenant's dashboard with
            realistic sample DMARC data (3 reports, ~8 records, 6 senders, 1 risk score, 3 action items).
            All demo rows carry <Text style={{ fontFamily: 'Courier', fontSize: 10 }}>isDemo: true</Text>.
          </Text>
          <Text style={s.p}>
            On the first successful ingestion of a real DMARC report, <Text style={{ fontFamily: 'Courier', fontSize: 10 }}>purgeDemoData()</Text> removes
            all demo rows atomically. The amber "sample data" banner is dismissed automatically.
          </Text>

          {/* Infra */}
          <Text style={s.sectionTitle}>7. Infrastructure</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderCell}>Component</Text>
              <Text style={[s.tableHeaderCell, { flex: 2 }]}>Details</Text>
            </View>
            {[
              ['Web app', 'Next.js 14 on Vercel (auto-deploy from main branch)'],
              ['Database', 'PostgreSQL on Supabase (connection pooling via pgBouncer)'],
              ['Scanner service', 'Node.js microservice on Render (Dockerfile)'],
              ['Email sending', 'SendGrid SMTP (transactional) + Inbound Parse (receiving)'],
              ['Cron jobs', 'Vercel Cron — /api/cron/fetch-emails (hourly)'],
              ['Secrets', 'Vercel Environment Variables (never committed to git)'],
            ].map(([a, b], i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{a}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={s.divider} />
          <Text style={s.p}>
            For developer documentation and API references, see the codebase README and audit/ folder.
            For support: support@inmybox.io
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
