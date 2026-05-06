import { prisma } from '@/lib/prisma'

/**
 * Seeds realistic demo data for a newly onboarded tenant.
 * All records are tagged isDemo=true so they can be bulk-deleted
 * once the first real DMARC report arrives.
 *
 * Called automatically when a tenant adds their first domain.
 * No-ops if any real (non-demo) reports already exist.
 */
export async function seedDemoData(tenantId: string, domainId: string): Promise<void> {
  // Guard — only seed if no real reports exist yet
  const realCount = await prisma.dmarcReport.count({
    where: { domainId, isDemo: false },
  })
  if (realCount > 0) return

  // Also skip if demo data already seeded
  const demoCount = await prisma.dmarcReport.count({
    where: { domainId, isDemo: true },
  })
  if (demoCount > 0) return

  const now = new Date()
  const day = (n: number) => new Date(now.getTime() - n * 86_400_000)

  // ── 3 DMARC Reports ──────────────────────────────────────────────
  const reportDefs = [
    {
      reportId: `demo-google-${Date.now()}`,
      orgName: 'google.com',
      email: 'noreply-dmarc-support@google.com',
      dateBegin: day(30),
      dateEnd: day(23),
      records: [
        { sourceIp: '209.85.220.41', count: 1240, disposition: 'none', spfResult: 'pass', dkimResult: 'pass', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: 'yourdomain.com', dkimDomain: 'yourdomain.com' },
        { sourceIp: '209.85.128.65', count: 88,   disposition: 'none', spfResult: 'fail', dkimResult: 'pass', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: null, dkimDomain: 'yourdomain.com' },
        { sourceIp: '185.220.101.5', count: 14,   disposition: 'none', spfResult: 'fail', dkimResult: 'fail', dmarcResult: 'fail', headerFrom: 'yourdomain.com', spfDomain: null, dkimDomain: null },
      ],
    },
    {
      reportId: `demo-mailchimp-${Date.now()}`,
      orgName: 'mailchimp.com',
      email: 'abuse@mailchimp.com',
      dateBegin: day(22),
      dateEnd: day(15),
      records: [
        { sourceIp: '198.2.128.112', count: 4500, disposition: 'none', spfResult: 'pass', dkimResult: 'pass', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: 'yourdomain.com', dkimDomain: 'yourdomain.com' },
        { sourceIp: '198.2.133.10',  count: 112,  disposition: 'none', spfResult: 'pass', dkimResult: 'fail', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: 'yourdomain.com', dkimDomain: null },
        { sourceIp: '91.108.56.200', count: 21,   disposition: 'none', spfResult: 'fail', dkimResult: 'fail', dmarcResult: 'fail', headerFrom: 'yourdomain.com', spfDomain: null, dkimDomain: null },
      ],
    },
    {
      reportId: `demo-sendgrid-${Date.now()}`,
      orgName: 'sendgrid.net',
      email: 'dmarc@sendgrid.com',
      dateBegin: day(14),
      dateEnd: day(7),
      records: [
        { sourceIp: '167.89.123.45', count: 2100, disposition: 'none', spfResult: 'pass', dkimResult: 'pass', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: 'yourdomain.com', dkimDomain: 'yourdomain.com' },
        { sourceIp: '167.89.118.30', count: 55,   disposition: 'none', spfResult: 'fail', dkimResult: 'pass', dmarcResult: 'pass', headerFrom: 'yourdomain.com', spfDomain: null, dkimDomain: 'yourdomain.com' },
      ],
    },
  ]

  for (const def of reportDefs) {
    const report = await prisma.dmarcReport.create({
      data: {
        reportId: def.reportId,
        orgName: def.orgName,
        email: def.email,
        dateBegin: def.dateBegin,
        dateEnd: def.dateEnd,
        domainId,
        status: 'processed',
        policyDomain: 'yourdomain.com',
        policyAdkim: 'r',
        policyAspf: 'r',
        policyP: 'none',
        policySp: 'none',
        policyPct: 100,
        isDemo: true,
      },
    })

    for (const rec of def.records) {
      await prisma.dmarcRecord.create({
        data: {
          reportId: report.id,
          sourceIp: rec.sourceIp,
          count: rec.count,
          disposition: rec.disposition,
          spfResult: rec.spfResult,
          dkimResult: rec.dkimResult,
          dmarcResult: rec.dmarcResult,
          headerFrom: rec.headerFrom,
          spfDomain: rec.spfDomain ?? undefined,
          dkimDomain: rec.dkimDomain ?? undefined,
          isDemo: true,
        },
      })
    }
  }

  // ── 6 Senders ────────────────────────────────────────────────────
  const senders = [
    { ip: '209.85.220.41', hostname: 'mail-yw1-f41.google.com', label: 'Google Workspace', status: 'known' },
    { ip: '198.2.128.112', hostname: 'mail128-112.atl41.mandrillapp.com', label: 'Mailchimp / Mandrill', status: 'known' },
    { ip: '167.89.123.45', hostname: 'o1.ptr4295.sgmail.com', label: 'SendGrid', status: 'known' },
    { ip: '209.85.128.65', hostname: 'mail-lj1-f65.google.com', label: 'Google (unverified SPF)', status: 'unknown' },
    { ip: '185.220.101.5', hostname: null, label: null, status: 'suspicious' },
    { ip: '91.108.56.200', hostname: null, label: null, status: 'suspicious' },
  ]

  for (const s of senders) {
    await prisma.sender.upsert({
      where: { ip_domainId: { ip: s.ip, domainId } },
      create: {
        ip: s.ip,
        hostname: s.hostname ?? undefined,
        label: s.label ?? undefined,
        status: s.status,
        domainId,
        totalVolume: 0,
        passCount: 0,
        failCount: 0,
        isDemo: true,
      },
      update: {},
    })
  }

  // ── Risk Score ───────────────────────────────────────────────────
  await prisma.riskScore.create({
    data: {
      domainId,
      trustScore: 62,
      deliveryScore: 0.62,
      inboxProbability: 0.71,
      spamProbability: 0.19,
      rejectProbability: 0.10,
      riskLevel: 'medium',
      totalVolume: 8130,
      passVolume: 7840,
      failVolume: 290,
      estimatedReachable: 5771,
      potentialLeadLoss: 116,
      estimatedRevenueAtRisk: 5800,
      campaignHealthScore: 62,
      isDemo: true,
    },
  })

  // ── Action Items ─────────────────────────────────────────────────
  await prisma.actionItem.createMany({
    data: [
      {
        tenantId,
        domainId,
        type: 'unknown_sender',
        severity: 'critical',
        title: 'Unknown senders failing DMARC detected',
        description: '2 IP addresses are sending email claiming to be your domain but failing all authentication checks. This may indicate spoofing or a misconfigured sending service.',
        recommendation: 'Review IPs 185.220.101.5 and 91.108.56.200. If these are not your sending infrastructure, consider tightening your DMARC policy to quarantine or reject.',
        sourceIp: '185.220.101.5',
        status: 'open',
        isDemo: true,
      },
      {
        tenantId,
        domainId,
        type: 'spf_failure',
        severity: 'high',
        title: 'SPF failures on known sending IP',
        description: '209.85.128.65 (Google) is passing DKIM but failing SPF. Your SPF record may be missing a Google include or has reached the 10-lookup limit.',
        recommendation: 'Verify your SPF record includes all Google sending IPs. Check for duplicate or redundant includes that may be hitting the DNS lookup limit.',
        sourceIp: '209.85.128.65',
        status: 'open',
        isDemo: true,
      },
      {
        tenantId,
        domainId,
        type: 'policy_recommendation',
        severity: 'medium',
        title: 'DMARC policy is set to none — no enforcement',
        description: "Your current DMARC policy (p=none) means failing emails are still delivered. You're in monitoring mode but not protecting your domain.",
        recommendation: "Once you've identified and authorised all legitimate senders, move to p=quarantine then p=reject to protect your domain from spoofing.",
        status: 'open',
        isDemo: true,
      },
    ],
  })
}

/**
 * Purges all demo data for a tenant's domain.
 * Called automatically after the first real report is ingested.
 */
export async function purgeDemoData(domainId: string, tenantId: string): Promise<void> {
  // Delete in dependency order
  const demoReports = await prisma.dmarcReport.findMany({
    where: { domainId, isDemo: true },
    select: { id: true },
  })
  const reportIds = demoReports.map((r) => r.id)

  if (reportIds.length > 0) {
    await prisma.dmarcRecord.deleteMany({ where: { reportId: { in: reportIds }, isDemo: true } })
    await prisma.dmarcReport.deleteMany({ where: { id: { in: reportIds } } })
  }

  await prisma.sender.deleteMany({ where: { domainId, isDemo: true } })
  await prisma.riskScore.deleteMany({ where: { domainId, isDemo: true } })
  await prisma.actionItem.deleteMany({ where: { tenantId, domainId, isDemo: true } })
}

/**
 * Returns true if the tenant has demo data and no real reports yet.
 */
export async function hasOnlyDemoData(domainId: string): Promise<boolean> {
  const realCount = await prisma.dmarcReport.count({
    where: { domainId, isDemo: false },
  })
  if (realCount > 0) return false

  const demoCount = await prisma.dmarcReport.count({
    where: { domainId, isDemo: true },
  })
  return demoCount > 0
}
