import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'DMARC Report Setup Guide | Inmybox',
  description: 'Step-by-step guide to connecting your domain\'s DMARC reports to Inmybox — three methods covered: DNS RUA alias, email forwarding, and direct inbox connection.',
  openGraph: {
    title: 'DMARC Report Setup Guide | Inmybox',
    description: 'Connect your DMARC reports to Inmybox in minutes using DNS, forwarding, or OAuth.',
    type: 'article',
  },
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-white/10">{title}</h2>
      {children}
    </section>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5 mb-8">
      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm mt-0.5">
        {n}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-semibold mb-2 leading-tight">{title}</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-200 overflow-x-auto my-3 whitespace-pre-wrap break-all">
      {children}
    </pre>
  )
}

function Badge({ label, color = 'blue' }: { label: string; color?: 'blue' | 'green' | 'purple' }) {
  const classes = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }[color]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${classes}`}>
      {label}
    </span>
  )
}

export default function DocsSetupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0a]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border border-white/10 flex items-center justify-center">
              <span className="text-blue-400 font-black text-sm">◎</span>
            </div>
            <span className="font-semibold text-sm">Inmybox</span>
          </Link>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors">
            Go to Dashboard →
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Setup Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Connect your DMARC reports to Inmybox
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
            Choose the method that fits your infrastructure. All three approaches result in the same outcome:
            Inmybox automatically processes your DMARC aggregate reports and keeps your dashboard up to date.
          </p>
        </div>

        {/* Method overview cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            { id: 'method-1', title: 'DNS RUA Alias', desc: 'Add our address to your DMARC record', badge: 'Recommended', color: 'blue' as const, href: '#method-1' },
            { id: 'method-2', title: 'Auto-Forward', desc: 'Forward from your existing report inbox', badge: 'No DNS changes', color: 'purple' as const, href: '#method-2' },
            { id: 'method-3', title: 'Connect Inbox', desc: 'OAuth or IMAP direct polling', badge: 'Most automated', color: 'green' as const, href: '#method-3' },
          ].map((m) => (
            <a key={m.id} href={m.href} className="group block p-5 bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-blue-500/30 rounded-xl transition-all">
              <Badge label={m.badge} color={m.color} />
              <p className="text-white font-semibold mt-3 mb-1">{m.title}</p>
              <p className="text-zinc-500 text-xs">{m.desc}</p>
            </a>
          ))}
        </div>

        {/* Method 1 — DNS RUA */}
        <Section id="method-1" title="Method 1 — DNS RUA alias (Recommended)">
          <p className="text-zinc-400 text-sm mb-8">
            This is the official, standards-compliant way to deliver DMARC reports.
            You add Inmybox&apos;s address to the <code className="text-zinc-300 bg-zinc-800 px-1 rounded">rua=</code> field of your existing DMARC TXT record.
            Email providers (Google, Microsoft, Yahoo, etc.) then deliver aggregate reports directly to us.
          </p>

          <Step n={1} title="Find your existing DMARC record">
            <p>Look up the current TXT record at <code className="text-zinc-300 bg-zinc-800 px-1 rounded">_dmarc.yourdomain.com</code>. You can use a DNS lookup tool or run:</p>
            <Code>nslookup -type=TXT _dmarc.yourdomain.com</Code>
            <p>A typical record looks like: <code className="text-zinc-300 bg-zinc-800 px-1 rounded">v=DMARC1; p=none; rua=mailto:existing@yourdomain.com</code></p>
          </Step>

          <Step n={2} title="Locate your Inmybox RUA address">
            <p>Log in to Inmybox and start the Setup Wizard. After adding your domain, you&apos;ll receive a dedicated alias:</p>
            <Code>your-slug@rua.inmybox.io</Code>
            <p>This alias is unique to your account. All reports sent here are automatically attributed to your tenant.</p>
          </Step>

          <Step n={3} title="Update your DMARC record">
            <p>In your DNS provider (Cloudflare, Route 53, GoDaddy, etc.), edit the TXT record at <code className="text-zinc-300 bg-zinc-800 px-1 rounded">_dmarc.yourdomain.com</code>.</p>
            <p><strong className="text-white">If you already have a rua= address</strong>, add ours separated by a comma:</p>
            <Code>{`v=DMARC1; p=none; rua=mailto:existing@yourdomain.com,mailto:your-slug@rua.inmybox.io; pct=100;`}</Code>
            <p><strong className="text-white">If you don&apos;t have a DMARC record yet</strong>, create one:</p>
            <Code>{`_dmarc.yourdomain.com  IN  TXT  "v=DMARC1; p=none; rua=mailto:your-slug@rua.inmybox.io; pct=100;"`}</Code>
            <p>We recommend starting with <code className="text-zinc-300 bg-zinc-800 px-1 rounded">p=none</code> (monitoring mode) until you&apos;ve reviewed all your senders.</p>
          </Step>

          <Step n={4} title="Wait for propagation and verify">
            <p>DNS changes typically propagate within 1–60 minutes, but can take up to 24 hours.</p>
            <p>Back in the Inmybox wizard, click <strong className="text-white">Verify DNS</strong> to confirm the record is live. The first reports will arrive within 24 hours after the DNS is in place.</p>
          </Step>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mt-4">
            <p className="text-blue-300 text-sm font-semibold mb-2">💡 When to upgrade your DMARC policy</p>
            <p className="text-zinc-400 text-sm">Once Inmybox shows that all your legitimate sending sources are passing DMARC, consider moving from <code className="text-zinc-300 bg-zinc-800 px-1 rounded">p=none</code> → <code className="text-zinc-300 bg-zinc-800 px-1 rounded">p=quarantine</code> → <code className="text-zinc-300 bg-zinc-800 px-1 rounded">p=reject</code> to actively block spoofed emails.</p>
          </div>
        </Section>

        {/* Method 2 — Forwarding */}
        <Section id="method-2" title="Method 2 — Auto-forward from your inbox">
          <p className="text-zinc-400 text-sm mb-8">
            If you already receive DMARC reports to a shared inbox (e.g. <code className="text-zinc-300 bg-zinc-800 px-1 rounded">dmarc@yourdomain.com</code>),
            you can set up an auto-forward rule without changing your DNS at all.
          </p>

          <Step n={1} title="Get your Inmybox forwarding address">
            <p>It&apos;s the same address as Method 1 — log in and visit the Setup Wizard to find your alias:</p>
            <Code>your-slug@rua.inmybox.io</Code>
          </Step>

          <Step n={2} title="Set up auto-forwarding in Gmail">
            <p>Go to <strong className="text-white">Settings → See all settings → Forwarding and POP/IMAP</strong>.</p>
            <p>Or create a filter: <strong className="text-white">Settings → Filters → Create a new filter</strong> with the criteria:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>From: <code className="text-zinc-300 bg-zinc-800 px-1 rounded">*@*</code></li>
              <li>Subject contains: <code className="text-zinc-300 bg-zinc-800 px-1 rounded">Report domain:</code></li>
            </ul>
            <p className="mt-2">Action: <strong className="text-white">Forward to your-slug@rua.inmybox.io</strong></p>
          </Step>

          <Step n={2} title="Set up auto-forwarding in Outlook / Microsoft 365">
            <p>Go to <strong className="text-white">Settings → Mail → Forwarding</strong>, or create an Inbox Rule:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Condition: Subject contains <code className="text-zinc-300 bg-zinc-800 px-1 rounded">DMARC</code> or <code className="text-zinc-300 bg-zinc-800 px-1 rounded">Report domain</code></li>
              <li>Action: Forward to <code className="text-zinc-300 bg-zinc-800 px-1 rounded">your-slug@rua.inmybox.io</code></li>
            </ul>
          </Step>

          <Step n={3} title="Test the forward">
            <p>Send a test email to your DMARC report inbox. It should appear in Inmybox within a few minutes once forwarded.</p>
            <p>Inmybox accepts both raw DMARC XML attachments and forwarded emails containing them.</p>
          </Step>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mt-4">
            <p className="text-amber-300 text-sm font-semibold mb-2">⚠️ Note on report volumes</p>
            <p className="text-zinc-400 text-sm">Large domains may receive hundreds of reports per day. Forwarding rules process them one by one. For high volume, Method 1 (DNS) or Method 3 (OAuth) is more reliable.</p>
          </div>
        </Section>

        {/* Method 3 — Connect Inbox */}
        <Section id="method-3" title="Method 3 — Connect your inbox directly">
          <p className="text-zinc-400 text-sm mb-8">
            Connect the mailbox where DMARC reports land directly to Inmybox using OAuth (no password required) or IMAP credentials.
            Inmybox polls the inbox on a schedule and processes any new report emails automatically.
          </p>

          <Step n={1} title="Connect via Google OAuth">
            <p>Click <strong className="text-white">Connect with Google</strong> in the Setup Wizard. You&apos;ll be redirected to Google&apos;s consent screen.</p>
            <p>Inmybox requests <strong className="text-white">read-only</strong> Gmail access — we only read emails, never send or delete.</p>
            <p>After authorization, Inmybox polls your inbox every hour (or per your plan&apos;s frequency) and ingests any DMARC report attachments.</p>
          </Step>

          <Step n={1} title="Connect via Microsoft OAuth">
            <p>Click <strong className="text-white">Connect with Microsoft</strong>. You&apos;ll be redirected to Microsoft&apos;s Entra ID login.</p>
            <p>Inmybox requests <strong className="text-white">IMAP read access</strong> to your Outlook/M365 inbox.</p>
          </Step>

          <Step n={2} title="Connect via IMAP (any provider)">
            <p>In the Setup Wizard, choose <strong className="text-white">IMAP (manual)</strong> and provide:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2 mb-3">
              <li>IMAP host (e.g. <code className="text-zinc-300 bg-zinc-800 px-1 rounded">imap.gmail.com</code>)</li>
              <li>Port (993 with TLS, or 143)</li>
              <li>Username / email address</li>
              <li>App password (not your regular login — generate one in your email provider&apos;s security settings)</li>
            </ul>
            <p>Credentials are encrypted at rest using AES-256-GCM before storage.</p>
          </Step>

          <Step n={3} title="Verify the connection">
            <p>Once saved, Inmybox runs an immediate test connection. If successful, polling starts on the next cron cycle.</p>
            <p>You can monitor connection status and last sync time in <strong className="text-white">Settings → Mailbox Connection</strong> in your dashboard.</p>
          </Step>

          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 mt-4">
            <p className="text-green-300 text-sm font-semibold mb-2">🔒 Security note</p>
            <p className="text-zinc-400 text-sm">OAuth tokens and IMAP passwords are encrypted with AES-256-GCM before being stored. Access tokens are never logged or exposed in API responses. You can disconnect the mailbox at any time.</p>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" title="Frequently asked questions">
          <div className="space-y-6">
            {[
              {
                q: 'How often do email providers send DMARC reports?',
                a: 'Most major senders (Google, Microsoft, Yahoo) send reports once per day at midnight UTC, covering the previous 24-hour window. Some providers send hourly or weekly — you can see this in the report metadata on your dashboard.',
              },
              {
                q: 'Can I use more than one method at the same time?',
                a: 'Yes. For example you can use Method 1 (DNS) to catch new providers going forward, and Method 3 (OAuth) to backfill reports from your existing inbox. Inmybox deduplicates reports by report ID, so no double-counting occurs.',
              },
              {
                q: 'What if my domain already uses a third-party DMARC service?',
                a: 'DMARC supports multiple RUA addresses separated by commas. Simply add the Inmybox address alongside your existing service. No reports will be lost.',
              },
              {
                q: 'How do I know when my first report arrives?',
                a: 'Inmybox sends a "first report received" notification email and updates your dashboard from sample data to real data automatically. You can also see the live polling status in Settings.',
              },
              {
                q: 'What report formats does Inmybox accept?',
                a: 'DMARC aggregate reports (rua) as .xml, .zip (containing XML), or .gz compressed XML. The DMARC standard (RFC 7489) mandates these formats, so all compliant senders are covered.',
              },
            ].map((faq) => (
              <div key={faq.q} className="border border-zinc-800 rounded-xl p-5">
                <p className="text-white font-medium mb-2">{faq.q}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="text-center py-12 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-zinc-400 mb-6 text-sm">Set up takes under 5 minutes. Your first reports arrive within 24 hours.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
            Open Setup Wizard →
          </Link>
        </div>
      </div>
    </div>
  )
}
