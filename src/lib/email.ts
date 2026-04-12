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
    console.log(`[email] Lead notification sent for ${lead.email}`)
  } catch (err) {
    console.error('[email] Failed to send lead notification:', err)
  }
}
