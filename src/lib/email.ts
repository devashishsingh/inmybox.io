import nodemailer from 'nodemailer'

/*
  Email notification service using SMTP.
  
  Required env vars:
    SMTP_HOST      — e.g. smtp.gmail.com
    SMTP_PORT      — e.g. 587
    SMTP_USER      — e.g. you@gmail.com
    SMTP_PASS      — app password (not your regular password)
    ADMIN_EMAIL    — where lead notifications are sent
    EMAIL_FROM     — sender address shown in emails (defaults to SMTP_USER)
*/

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null // Email not configured — skip silently
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

export async function sendLeadNotification(lead: {
  domain: string
  email: string
  score: number
  riskLevel: string
}) {
  const t = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!t || !adminEmail) {
    console.log('[email] Skipping lead notification — SMTP not configured')
    return
  }

  const riskColors: Record<string, string> = {
    healthy: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  }
  const color = riskColors[lead.riskLevel] || '#6366f1'
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER

  try {
    await t.sendMail({
      from: `"Inmybox Leads" <${from}>`,
      to: adminEmail,
      subject: `🔔 New Lead: ${lead.email} scanned ${lead.domain} (${lead.riskLevel})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: #0f172a; border-radius: 12px; padding: 24px; color: #fff;">
            <h2 style="margin: 0 0 16px; font-size: 18px;">New Lead Captured</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #fff; font-size: 13px; font-weight: 600;">${lead.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Domain</td>
                <td style="padding: 8px 0; color: #fff; font-size: 13px; font-weight: 600;">${lead.domain}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Score</td>
                <td style="padding: 8px 0; color: #fff; font-size: 13px; font-weight: 600;">${lead.score}/100</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Risk Level</td>
                <td style="padding: 8px 0; font-size: 13px; font-weight: 600;">
                  <span style="display: inline-block; padding: 2px 10px; border-radius: 99px; background: ${color}22; color: ${color}; border: 1px solid ${color}44;">
                    ${lead.riskLevel.charAt(0).toUpperCase() + lead.riskLevel.slice(1)}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Time</td>
                <td style="padding: 8px 0; color: #fff; font-size: 13px;">${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #1e293b;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/leads"
                 style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                View All Leads →
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 16px;">
            Inmybox Lead Notification · Do not reply to this email
          </p>
        </div>
      `,
    })
    // INMYBOX ENHANCEMENT: H2 — mask email in log
    console.log(`[email] Lead notification sent successfully`)
  } catch (err) {
    console.error('[email] Failed to send lead notification:', err)
  }
}

// ─── SHARED LAYOUT HELPERS ──────────────────────────────────────────────────

const BASE_URL = process.env.NEXTAUTH_URL || 'https://app.inmybox.io'

function emailShell(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;">
      <div style="background:#0f172a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 32px 20px;border-bottom:1px solid #1e293b;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a1f2e,#0d1117);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
              <span style="color:#3b82f6;font-weight:900;font-size:16px;">◎</span>
            </div>
            <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px;">Inmybox</span>
          </div>
        </div>
        <div style="padding:32px;">
          ${content}
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
          <p style="color:#475569;font-size:11px;margin:0;">Inmybox · Email Reputation Intelligence · <a href="${BASE_URL}" style="color:#475569;">app.inmybox.io</a></p>
        </div>
      </div>
    </div>
  `
}

function btnPrimary(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">${text} →</a>`
}

// ─── WELCOME EMAIL ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: { toEmail: string; toName: string | null; tenantName: string }): Promise<void> {
  const t = getTransporter()
  if (!t) return
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  const name = params.toName?.split(' ')[0] || 'there'

  try {
    await t.sendMail({
      from: `"Inmybox" <${from}>`,
      to: params.toEmail,
      subject: `Welcome to Inmybox — let's protect ${params.tenantName}`,
      html: emailShell(`
        <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome on board, ${name}! 🎉</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Your Inmybox account for <strong style="color:#e2e8f0;">${params.tenantName}</strong> is ready.
          In just a few minutes you'll be monitoring your DMARC reports and protecting your email deliverability.
        </p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;"><strong style="color:#e2e8f0;">Choose how to send your reports:</strong></p>
        <ul style="color:#94a3b8;font-size:13px;line-height:2;margin:0 0 20px;padding-left:20px;">
          <li><strong style="color:#e2e8f0;">Method 1 — DNS RUA alias</strong> (recommended): add our address to your DMARC record</li>
          <li><strong style="color:#e2e8f0;">Method 2 — Auto-forward</strong>: forward from your existing report inbox</li>
          <li><strong style="color:#e2e8f0;">Method 3 — Connect inbox</strong>: OAuth connect your Google or Microsoft mailbox</li>
        </ul>
        ${btnPrimary(`${BASE_URL}/onboarding`, 'Start Setup')}
        <p style="color:#475569;font-size:12px;margin-top:24px;">
          Need help? Reply to this email or visit our <a href="${BASE_URL}/docs/setup" style="color:#3b82f6;">setup guide</a>.
        </p>
      `),
    })
    console.log('[email] Welcome email sent')
  } catch (err) {
    console.error('[email] Failed to send welcome email:', err)
  }
}

// ─── SETUP REMINDER EMAIL ───────────────────────────────────────────────────

export async function sendSetupReminderEmail(params: { toEmail: string; toName: string | null; wizardStep: number; tenantName: string }): Promise<void> {
  const t = getTransporter()
  if (!t) return
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  const name = params.toName?.split(' ')[0] || 'there'

  const stepMessages: Record<number, string> = {
    1: 'You added your domain — next, choose your preferred report delivery method.',
    2: "You've chosen your method — complete the setup to start receiving reports.",
    3: "You're nearly there — just waiting for your first DMARC report to arrive.",
  }
  const stepHint = stepMessages[params.wizardStep] || 'Complete your setup to start protecting your domain.'

  try {
    await t.sendMail({
      from: `"Inmybox" <${from}>`,
      to: params.toEmail,
      subject: `${params.tenantName} — finish your Inmybox setup`,
      html: emailShell(`
        <h2 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;">Don't leave your domain unprotected</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Hi ${name}, your Inmybox setup for <strong style="color:#e2e8f0;">${params.tenantName}</strong> is still in progress.
        </p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">${stepHint}</p>
        ${btnPrimary(`${BASE_URL}/onboarding`, 'Continue Setup')}
      `),
    })
    console.log('[email] Setup reminder sent')
  } catch (err) {
    console.error('[email] Failed to send setup reminder:', err)
  }
}

// ─── FIRST REPORT CELEBRATION EMAIL ────────────────────────────────────────

export async function sendFirstReportCelebrationEmail(params: { toEmail: string; toName: string | null; domain: string; tenantName: string }): Promise<void> {
  const t = getTransporter()
  if (!t) return
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  const name = params.toName?.split(' ')[0] || 'there'

  try {
    await t.sendMail({
      from: `"Inmybox" <${from}>`,
      to: params.toEmail,
      subject: `Your first DMARC report is in — ${params.domain}`,
      html: emailShell(`
        <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 8px;">Your first report arrived! 🚀</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Hi ${name}, Inmybox just processed its first DMARC aggregate report for
          <strong style="color:#e2e8f0;">${params.domain}</strong>.
          Your dashboard is now live with real data.
        </p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Head over to review your senders, trust score, and any action items that need attention.
        </p>
        ${btnPrimary(`${BASE_URL}/dashboard`, 'View Dashboard')}
      `),
    })
    console.log('[email] First report celebration sent')
  } catch (err) {
    console.error('[email] Failed to send celebration email:', err)
  }
}

