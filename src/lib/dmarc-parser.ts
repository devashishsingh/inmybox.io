import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { execFile } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DmarcFeedback, DmarcRecordParsed } from '@/types'

// Resolve 7za binary path at module level from node_modules
const SEVEN_ZIP_BIN = path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe')

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => {
    return name === 'record'
  },
})

export async function extractFilesFromUpload(
  buffer: Buffer,
  fileName: string
): Promise<{ name: string; content: string }[]> {
  const lower = fileName.toLowerCase()

  if (lower.endsWith('.7z')) {
    return extractFrom7z(buffer, fileName)
  }

  if (lower.endsWith('.zip') || lower.endsWith('.gz') || lower.endsWith('.tgz') || lower.endsWith('.tar.gz')) {
    return extractFromZip(buffer)
  }

  if (lower.endsWith('.xml')) {
    return [{ name: fileName, content: buffer.toString('utf-8') }]
  }

  // Try as XML first, then ZIP, then 7z
  try {
    const text = buffer.toString('utf-8')
    if (text.trim().startsWith('<?xml') || text.trim().startsWith('<feedback')) {
      return [{ name: fileName, content: text }]
    }
  } catch {}

  // Try ZIP first
  try {
    return await extractFromZip(buffer)
  } catch {}

  // Try 7z as last resort
  return extractFrom7z(buffer, fileName)
}

async function extractFromZip(buffer: Buffer): Promise<{ name: string; content: string }[]> {
  const zip = await JSZip.loadAsync(buffer)
  const files: { name: string; content: string }[] = []

  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    if (name.toLowerCase().endsWith('.xml')) {
      const content = await file.async('string')
      files.push({ name, content })
    }
  }

  if (files.length === 0) {
    throw new Error('No XML files found in archive')
  }

  return files
}

async function extractFrom7z(buffer: Buffer, fileName: string): Promise<{ name: string; content: string }[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmarc-7z-'))
  const archivePath = path.join(tmpDir, fileName)
  const extractDir = path.join(tmpDir, 'extracted')
  fs.mkdirSync(extractDir, { recursive: true })
  fs.writeFileSync(archivePath, buffer)

  try {
    // Use 7za.exe directly via child_process to avoid Next.js bundling issues
    await new Promise<void>((resolve, reject) => {
      execFile(SEVEN_ZIP_BIN, ['x', archivePath, `-o${extractDir}`, '-y'], (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`7z extraction failed: ${stderr || err.message}`))
        } else {
          resolve()
        }
      })
    })

    // Read all XML files from extracted directory
    const files: { name: string; content: string }[] = []
    const readDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          readDir(fullPath)
        } else if (entry.name.toLowerCase().endsWith('.xml')) {
          files.push({ name: entry.name, content: fs.readFileSync(fullPath, 'utf-8') })
        }
      }
    }
    readDir(extractDir)

    if (files.length === 0) {
      throw new Error('No XML files found in 7z archive')
    }

    return files
  } finally {
    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

export function parseDmarcXml(xml: string): DmarcFeedback {
  const parsed = xmlParser.parse(xml)
  const feedback = parsed.feedback

  if (!feedback) {
    throw new Error('Invalid DMARC XML: missing feedback element')
  }

  const meta = feedback.report_metadata || {}
  const policy = feedback.policy_published || {}
  const rawRecords = feedback.record || []

  const records: DmarcRecordParsed[] = (Array.isArray(rawRecords) ? rawRecords : [rawRecords]).map(
    (rec: any) => {
      const row = rec.row || {}
      const policyEval = row.policy_evaluated || {}
      const identifiers = rec.identifiers || {}
      const authResults = rec.auth_results || {}

      // Use policy_evaluated for SPF/DKIM results (DMARC alignment check)
      const spfResult = (policyEval.spf || 'fail').toLowerCase()
      const dkimResult = (policyEval.dkim || 'fail').toLowerCase()

      // Use auth_results for domain info only
      const spfAuth = authResults.spf
      const dkimAuth = authResults.dkim
      const spfResults = Array.isArray(spfAuth) ? spfAuth : spfAuth ? [spfAuth] : []
      const dkimResults = Array.isArray(dkimAuth) ? dkimAuth : dkimAuth ? [dkimAuth] : []

      return {
        sourceIp: row.source_ip || 'unknown',
        count: parseInt(row.count) || 1,
        disposition: (policyEval.disposition || 'none').toLowerCase() as any,
        spfResult: spfResult as 'pass' | 'fail',
        dkimResult: dkimResult as 'pass' | 'fail',
        dmarcResult: dkimResult === 'pass' || spfResult === 'pass' ? 'pass' : 'fail',
        headerFrom: identifiers.header_from,
        envelopeFrom: identifiers.envelope_from,
        spfDomain: spfResults[0]?.domain,
        dkimDomain: dkimResults[0]?.domain,
      }
    }
  )

  return {
    reportMetadata: {
      reportId: String(meta.report_id || `report-${Date.now()}`),
      orgName: meta.org_name || 'Unknown',
      email: meta.email,
      dateRange: {
        begin: parseInt(meta.date_range?.begin) || Math.floor(Date.now() / 1000),
        end: parseInt(meta.date_range?.end) || Math.floor(Date.now() / 1000),
      },
    },
    policyPublished: {
      domain: policy.domain || 'unknown',
      adkim: policy.adkim,
      aspf: policy.aspf,
      p: policy.p,
      sp: policy.sp,
      pct: policy.pct ? parseInt(policy.pct) : undefined,
    },
    records,
  }
}

export function validateDmarcReport(feedback: DmarcFeedback): string[] {
  const errors: string[] = []

  if (!feedback.reportMetadata.reportId) {
    errors.push('Missing report ID')
  }
  if (!feedback.policyPublished.domain || feedback.policyPublished.domain === 'unknown') {
    errors.push('Missing policy domain')
  }
  if (feedback.records.length === 0) {
    errors.push('No records found in report')
  }

  return errors
}
