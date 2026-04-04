import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create super admin user
  const adminPasswordHash = await hash('admin1234', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@inmybox.io' },
    update: {},
    create: {
      email: 'admin@inmybox.io',
      name: 'Super Admin',
      password: adminPasswordHash,
      role: 'super_admin',
    },
  })
  console.log(`✓ Super Admin: ${superAdmin.email}`)

  // Create demo user
  const passwordHash = await hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@inmybox.io' },
    update: {},
    create: {
      email: 'demo@inmybox.io',
      name: 'Demo User',
      password: passwordHash,
    },
  })
  console.log(`✓ User: ${user.email}`)

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-demo' },
    update: {},
    create: {
      id: 'tenant-demo-001',
      name: 'Acme Corp Demo',
      slug: 'acme-demo',
      contactEmail: 'demo@acme-corp.com',
      plan: 'pro',
    },
  })
  console.log(`✓ Tenant: ${tenant.name}`)

  // Create alias mapping
  await prisma.aliasMapping.upsert({
    where: { alias: 'acme-demo@inmybox.io' },
    update: {},
    create: {
      alias: 'acme-demo@inmybox.io',
      tenantId: tenant.id,
    },
  })
  console.log(`✓ Alias: acme-demo@inmybox.io`)

  // Create onboarding checklist
  await prisma.onboardingChecklist.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      domainAdded: true,
      aliasAssigned: true,
      dmarcRuaUpdated: true,
      sampleReportUploaded: true,
      firstReportReceived: true,
      parsingComplete: true,
      sendersReviewed: true,
      assumptionsConfigured: true,
      dashboardReady: true,
      completedAt: new Date(),
    },
  })
  console.log(`✓ Onboarding: complete`)

  // Create membership
  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    },
  })
  console.log(`✓ Membership: owner`)

  // Create tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      conversionRate: 0.025,
      avgLeadValue: 120,
      campaignBenchmark: 0.95,
      reportRetention: 90,
      notifications: true,
      emailDigest: 'weekly',
      alertThreshold: 0.7,
    },
  })
  console.log(`✓ Settings configured`)

  // Create domains
  const domain1 = await prisma.domain.upsert({
    where: { domain_tenantId: { domain: 'acme-corp.com', tenantId: tenant.id } },
    update: {},
    create: {
      id: 'dom-001',
      domain: 'acme-corp.com',
      tenantId: tenant.id,
      verified: true,
    },
  })

  const domain2 = await prisma.domain.upsert({
    where: { domain_tenantId: { domain: 'marketing.acme-corp.com', tenantId: tenant.id } },
    update: {},
    create: {
      id: 'dom-002',
      domain: 'marketing.acme-corp.com',
      tenantId: tenant.id,
      verified: true,
    },
  })
  console.log(`✓ Domains: ${domain1.domain}, ${domain2.domain}`)

  // Sample DMARC reports
  const reportDates = [
    new Date('2026-03-28'),
    new Date('2026-03-29'),
    new Date('2026-03-30'),
    new Date('2026-03-31'),
    new Date('2026-04-01'),
    new Date('2026-04-02'),
    new Date('2026-04-03'),
  ]

  const providers = [
    { org: 'google.com', email: 'noreply-dmarc-support@google.com' },
    { org: 'yahoo.com', email: 'dmarcreport@yahoo.com' },
    { org: 'outlook.com', email: 'dmarcreport@microsoft.com' },
  ]

  const senderIPs = [
    { ip: '198.51.100.10', label: 'Primary MTA', status: 'trusted' as const },
    { ip: '198.51.100.11', label: 'Backup MTA', status: 'trusted' as const },
    { ip: '203.0.113.50', label: 'Marketing ESP', status: 'trusted' as const },
    { ip: '203.0.113.51', label: '', status: 'unknown' as const },
    { ip: '192.0.2.100', label: 'Unknown sender', status: 'suspicious' as const },
    { ip: '10.20.30.40', label: 'Spoofing attempt', status: 'suspicious' as const },
  ]

  // Create senders with classifications
  for (const s of senderIPs) {
    const totalVolume = Math.floor(Math.random() * 5000) + 100
    const failCount = s.status === 'trusted' ? Math.floor(totalVolume * 0.02) : s.status === 'suspicious' ? Math.floor(totalVolume * 0.9) : Math.floor(totalVolume * 0.4)
    const passCount = totalVolume - failCount

    const sender = await prisma.sender.upsert({
      where: {
        ip_domainId: { ip: s.ip, domainId: domain1.id },
      },
      update: {},
      create: {
        ip: s.ip,
        domainId: domain1.id,
        label: s.label,
        status: s.status,
        totalVolume,
        passCount,
        failCount,
        lastSeen: reportDates[reportDates.length - 1],
        notes: s.label === 'Spoofing attempt' ? 'Flagged: domain spoofing detected' : '',
      },
    })

    // Create sender classifications
    if (s.status === 'trusted') {
      await prisma.senderClassification.upsert({
        where: { senderId: sender.id },
        update: {},
        create: {
          senderId: sender.id,
          category: s.label === 'Marketing ESP' ? 'marketing' : 'legitimate',
          provider: s.label === 'Marketing ESP' ? 'SendGrid' : undefined,
          confidence: 0.95,
          isFirstPartySender: s.label !== 'Marketing ESP',
          autoClassified: true,
        },
      })
    } else if (s.status === 'suspicious') {
      await prisma.senderClassification.upsert({
        where: { senderId: sender.id },
        update: {},
        create: {
          senderId: sender.id,
          category: 'spoofing',
          confidence: 0.8,
          isFirstPartySender: false,
          autoClassified: true,
        },
      })
    }
  }
  console.log(`✓ Senders: ${senderIPs.length} entries with classifications`)

  // Create IP enrichment data
  const ipEnrichments = [
    { ip: '198.51.100.10', reverseDns: 'mail1.acme-corp.com', provider: null, providerType: 'enterprise', isKnownSender: true },
    { ip: '198.51.100.11', reverseDns: 'mail2.acme-corp.com', provider: null, providerType: 'enterprise', isKnownSender: true },
    { ip: '203.0.113.50', reverseDns: 'o1.ptr1234.sendgrid.net', provider: 'SendGrid', providerType: 'cloud', isKnownSender: true },
    { ip: '203.0.113.51', reverseDns: null, provider: null, providerType: null, isKnownSender: false },
    { ip: '192.0.2.100', reverseDns: 'vps-unknown.hostingprovider.net', provider: null, providerType: 'hosting', isKnownSender: false },
    { ip: '10.20.30.40', reverseDns: null, provider: null, providerType: null, isKnownSender: false },
  ]

  for (const enrichment of ipEnrichments) {
    await prisma.ipEnrichment.upsert({
      where: { ip: enrichment.ip },
      update: {},
      create: {
        ip: enrichment.ip,
        reverseDns: enrichment.reverseDns,
        provider: enrichment.provider,
        providerType: enrichment.providerType,
        isKnownSender: enrichment.isKnownSender,
      },
    })
  }
  console.log(`✓ IP enrichments: ${ipEnrichments.length} entries`)

  // Create reports with records
  let reportCount = 0
  for (const date of reportDates) {
    for (const provider of providers) {
      const reportId = `rpt-${date.toISOString().split('T')[0]}-${provider.org}`
      const beginDate = new Date(date)
      beginDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      const report = await prisma.dmarcReport.upsert({
        where: {
          reportId_domainId: { reportId, domainId: domain1.id },
        },
        update: {},
        create: {
          reportId,
          domainId: domain1.id,
          orgName: provider.org,
          email: provider.email,
          dateBegin: beginDate,
          dateEnd: endDate,
          status: 'processed',
          policyDomain: domain1.domain,
          policyP: 'none',
          policyAdkim: 'r',
          policyAspf: 'r',
        },
      })

      // Create records for each report
      const recordConfigs = [
        { ip: '198.51.100.10', count: 800 + Math.floor(Math.random() * 400), spf: 'pass', dkim: 'pass', dmarc: 'pass', disposition: 'none' },
        { ip: '198.51.100.11', count: 200 + Math.floor(Math.random() * 100), spf: 'pass', dkim: 'pass', dmarc: 'pass', disposition: 'none' },
        { ip: '203.0.113.50', count: 500 + Math.floor(Math.random() * 300), spf: 'pass', dkim: 'pass', dmarc: 'pass', disposition: 'none' },
        { ip: '203.0.113.51', count: 50 + Math.floor(Math.random() * 50), spf: 'pass', dkim: 'fail', dmarc: 'fail', disposition: 'none' },
        { ip: '192.0.2.100', count: 20 + Math.floor(Math.random() * 30), spf: 'fail', dkim: 'fail', dmarc: 'fail', disposition: 'quarantine' },
        { ip: '10.20.30.40', count: 5 + Math.floor(Math.random() * 15), spf: 'fail', dkim: 'fail', dmarc: 'fail', disposition: 'reject' },
      ]

      for (const rec of recordConfigs) {
        await prisma.dmarcRecord.create({
          data: {
            reportId: report.id,
            sourceIp: rec.ip,
            count: rec.count,
            disposition: rec.disposition,
            dmarcResult: rec.dmarc,
            spfDomain: domain1.domain,
            spfResult: rec.spf,
            dkimDomain: domain1.domain,
            dkimResult: rec.dkim,
            headerFrom: domain1.domain,
          },
        })
      }

      reportCount++
    }
  }
  console.log(`✓ Reports: ${reportCount} with records`)

  // Create action items
  await prisma.actionItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        domainId: domain1.id,
        type: 'unknown_sender',
        severity: 'medium',
        title: 'Unknown sender detected: 203.0.113.51',
        description: 'IP 203.0.113.51 is sending emails on behalf of acme-corp.com but is not recognized as a legitimate sender.',
        recommendation: 'Investigate if this IP belongs to a third-party service you use. If legitimate, add it to your SPF record and classify the sender. If unauthorized, monitor and consider blocking.',
        sourceIp: '203.0.113.51',
        status: 'open',
      },
      {
        tenantId: tenant.id,
        domainId: domain1.id,
        type: 'suspicious_ip',
        severity: 'critical',
        title: 'Suspected spoofing from 10.20.30.40',
        description: 'IP 10.20.30.40 is failing all authentication checks (SPF, DKIM, DMARC) and emails are being rejected. This may be a spoofing attempt.',
        recommendation: 'This IP appears to be spoofing your domain. Ensure your DMARC policy is set to reject mode. Report this IP if spoofing is confirmed.',
        sourceIp: '10.20.30.40',
        status: 'open',
      },
      {
        tenantId: tenant.id,
        domainId: domain1.id,
        type: 'policy_recommendation',
        severity: 'medium',
        title: 'Consider upgrading DMARC policy to quarantine',
        description: 'Your DMARC policy is set to "none" (monitor only). Your pass rate is high enough to consider enforcement.',
        recommendation: 'Move your DMARC policy from p=none to p=quarantine. Monitor for 2-4 weeks, then upgrade to p=reject for maximum protection.',
        status: 'open',
      },
    ],
  })
  console.log(`✓ Action items: 3 entries`)

  // Ingestion logs
  await prisma.ingestionLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        fileName: 'google-dmarc-acme-corp-20260328.xml.gz',
        source: 'upload',
        status: 'success',
        recordCount: 6,
        reportCount: 1,
        errorMessage: null,
        domainId: domain1.id,
      },
      {
        tenantId: tenant.id,
        fileName: 'yahoo-dmarc-acme-corp-20260329.zip',
        source: 'upload',
        status: 'success',
        recordCount: 6,
        reportCount: 1,
        errorMessage: null,
        domainId: domain1.id,
      },
      {
        tenantId: tenant.id,
        fileName: 'microsoft-dmarc-acme-corp-20260330.xml',
        source: 'email',
        status: 'success',
        recordCount: 6,
        reportCount: 1,
        errorMessage: null,
        domainId: domain1.id,
      },
    ],
  })
  console.log(`✓ Ingestion logs created`)

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Demo credentials:')
  console.log('  Email:    demo@inmybox.io')
  console.log('  Password: demo1234')
  console.log('')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
