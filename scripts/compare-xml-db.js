require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compare() {
  // ─── XML SOURCE DATA ─────────────────────────────────────────────
  const xmlData = {
    reportId: '1743782400.examplecorp.com',
    orgName: 'google.com',
    domain: 'examplecorp.com',
    policy: { p: 'quarantine', sp: 'reject', adkim: 'r', aspf: 'r', pct: 100 },
    records: [
      { ip: '192.168.10.10', count: 1250, disposition: 'none',       dkim: 'pass', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'mailer.examplecorp.com' },
      { ip: '203.0.113.45',  count: 980,  disposition: 'quarantine', dkim: 'fail', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'marketing.examplecorp.com' },
      { ip: '198.51.100.22', count: 760,  disposition: 'reject',     dkim: 'fail', spf: 'fail', headerFrom: 'examplecorp.com', envelopeFrom: 'spoofed-mail.com' },
      { ip: '172.16.20.5',   count: 540,  disposition: 'none',       dkim: 'pass', spf: 'fail', headerFrom: 'examplecorp.com', envelopeFrom: 'newsletter.vendor.com' },
      { ip: '10.10.50.90',   count: 430,  disposition: 'quarantine', dkim: 'fail', spf: 'fail', headerFrom: 'examplecorp.com', envelopeFrom: 'phish-login-alert.com' },
      { ip: '34.117.59.81',  count: 620,  disposition: 'none',       dkim: 'pass', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'sendgrid.examplecorp.com' },
      { ip: '52.95.110.1',   count: 310,  disposition: 'none',       dkim: 'pass', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'amazonses.examplecorp.com' },
      { ip: '185.220.101.4', count: 890,  disposition: 'reject',     dkim: 'fail', spf: 'fail', headerFrom: 'examplecorp.com', envelopeFrom: 'fraud-payments.com' },
      { ip: '104.26.3.2',    count: 455,  disposition: 'none',       dkim: 'pass', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'support.examplecorp.com' },
      { ip: '45.33.22.11',   count: 210,  disposition: 'quarantine', dkim: 'fail', spf: 'pass', headerFrom: 'examplecorp.com', envelopeFrom: 'unknownrelay.partner.net' },
    ]
  };

  // ─── DB DATA ──────────────────────────────────────────────────────
  const report = await prisma.dmarcReport.findFirst({
    where: { reportId: xmlData.reportId },
    include: { records: true },
  });

  if (!report) {
    console.log('❌ Report not found in database!');
    await prisma.$disconnect();
    return;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('         XML vs DATABASE COMPARISON');
  console.log('═══════════════════════════════════════════════════════\n');

  // Report metadata
  console.log('── Report Metadata ──');
  check('Report ID', xmlData.reportId, report.reportId);
  check('Org Name', xmlData.orgName, report.orgName);
  check('Policy Domain', xmlData.domain, report.policyDomain);
  check('Policy P', xmlData.policy.p, report.policyP);
  check('Policy SP', xmlData.policy.sp, report.policySp);
  check('Policy ADKIM', xmlData.policy.adkim, report.policyAdkim);
  check('Policy ASPF', xmlData.policy.aspf, report.policyAspf);
  check('Policy PCT', String(xmlData.policy.pct), String(report.policyPct));
  check('Record Count', String(xmlData.records.length), String(report.records.length));

  // Records
  console.log('\n── Records (per source IP) ──');
  let allMatch = true;

  for (const xmlRec of xmlData.records) {
    const dbRec = report.records.find(r => r.sourceIp === xmlRec.ip);
    if (!dbRec) {
      console.log(`  ❌ IP ${xmlRec.ip} — NOT FOUND in DB`);
      allMatch = false;
      continue;
    }

    const issues = [];
    if (dbRec.count !== xmlRec.count) issues.push(`count: XML=${xmlRec.count} DB=${dbRec.count}`);
    if (dbRec.disposition !== xmlRec.disposition) issues.push(`disposition: XML=${xmlRec.disposition} DB=${dbRec.disposition}`);
    if (dbRec.dkimResult !== xmlRec.dkim) issues.push(`dkim: XML=${xmlRec.dkim} DB=${dbRec.dkimResult}`);
    if (dbRec.spfResult !== xmlRec.spf) issues.push(`spf: XML=${xmlRec.spf} DB=${dbRec.spfResult}`);
    if (dbRec.headerFrom !== xmlRec.headerFrom) issues.push(`headerFrom: XML=${xmlRec.headerFrom} DB=${dbRec.headerFrom}`);
    if (dbRec.envelopeFrom !== xmlRec.envelopeFrom) issues.push(`envelopeFrom: XML=${xmlRec.envelopeFrom} DB=${dbRec.envelopeFrom}`);

    if (issues.length === 0) {
      console.log(`  ✅ ${xmlRec.ip} (count=${xmlRec.count}) — all fields match`);
    } else {
      console.log(`  ❌ ${xmlRec.ip} — MISMATCHES: ${issues.join('; ')}`);
      allMatch = false;
    }
  }

  // Sender volumes
  console.log('\n── Sender Volumes ──');
  const senders = await prisma.sender.findMany();
  for (const xmlRec of xmlData.records) {
    const sender = senders.find(s => s.ip === xmlRec.ip);
    if (sender) {
      const volMatch = sender.totalVolume === xmlRec.count;
      console.log(`  ${volMatch ? '✅' : '❌'} ${xmlRec.ip}: XML count=${xmlRec.count}, DB totalVolume=${sender.totalVolume}, pass=${sender.passCount}, fail=${sender.failCount}`);
    } else {
      console.log(`  ❌ ${xmlRec.ip}: No sender record found`);
    }
  }

  // Summary
  const totalXmlVolume = xmlData.records.reduce((s, r) => s + r.count, 0);
  const totalDbVolume = senders.reduce((s, r) => s + r.totalVolume, 0);
  console.log(`\n── Summary ──`);
  console.log(`  Total XML email volume: ${totalXmlVolume}`);
  console.log(`  Total DB email volume:  ${totalDbVolume}`);
  console.log(`  ${totalXmlVolume === totalDbVolume ? '✅' : '❌'} Volume ${totalXmlVolume === totalDbVolume ? 'matches' : 'MISMATCH'}`);
  console.log(`\n  ${allMatch ? '✅ ALL RECORDS MATCH' : '❌ SOME RECORDS HAVE MISMATCHES'}`);

  await prisma.$disconnect();
}

function check(label, expected, actual) {
  const match = String(expected) === String(actual);
  console.log(`  ${match ? '✅' : '❌'} ${label}: ${match ? actual : `XML="${expected}" DB="${actual}"`}`);
}

compare().catch(console.error);
