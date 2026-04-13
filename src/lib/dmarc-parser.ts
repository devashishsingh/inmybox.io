// INMYBOX MVP IMPROVEMENT — XML Extraction Hardening — 2026-04-13
import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { execFile } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import type { DmarcFeedback, DmarcRecordParsed } from '@/types'

// ─── EXTRACTION GATE CONFIG ──────────────────────────────────────────

const EXTRACTION_LIMITS = {
  maxFileSizeMB: 10,
  maxUncompressedMB: 50,
  maxFilesInZip: 50,
  maxCompressionRatio: 100,
  allowedMagicBytes: {
    zip:  [0x50, 0x4B, 0x03, 0x04],
    gzip: [0x1F, 0x8B],
    xml:  [0x3C, 0x3F], // <?  (<?xml)
    xmlBare: [0x3C],    // <   (<feedback)
    sevenZ: [0x37, 0x7A, 0xBC, 0xAF], // 7z magic
  },
} as const

export type ExtractionErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'ZIP_BOMB_DETECTED'
  | 'TOO_MANY_FILES'
  | 'INVALID_DMARC_REPORT'
  | 'EXTRACTION_FAILED'

export class ExtractionError extends Error {
  code: ExtractionErrorCode
  supportId: string
  constructor(code: ExtractionErrorCode, message: string) {
    super(message)
    this.code = code
    this.supportId = crypto.randomBytes(8).toString('hex')
  }
}

// ─── MAGIC BYTE DETECTION ────────────────────────────────────────────

function detectFileType(buffer: Buffer): 'zip' | 'gzip' | 'xml' | '7z' | 'unknown' {
  if (buffer.length < 2) return 'unknown'
  const { allowedMagicBytes } = EXTRACTION_LIMITS
  if (buffer.length >= 4 && allowedMagicBytes.zip.every((b, i) => buffer[i] === b)) return 'zip'
  if (allowedMagicBytes.gzip.every((b, i) => buffer[i] === b)) return 'gzip'
  if (buffer.length >= 4 && allowedMagicBytes.sevenZ.every((b, i) => buffer[i] === b)) return '7z'
  if (allowedMagicBytes.xml.every((b, i) => buffer[i] === b)) return 'xml'
  // Check for bare XML (starts with < but not <?)
  if (buffer[0] === allowedMagicBytes.xmlBare[0]) {
    const head = buffer.subarray(0, 200).toString('utf-8').trim()
    if (head.startsWith('<feedback') || head.startsWith('<?xml')) return 'xml'
  }
  return 'unknown'
}

// ─── PRE-EXTRACTION VALIDATION ───────────────────────────────────────

function validateFileSize(buffer: Buffer): void {
  const sizeMB = buffer.length / (1024 * 1024)
  if (sizeMB > EXTRACTION_LIMITS.maxFileSizeMB) {
    throw new ExtractionError('FILE_TOO_LARGE',
      `This file is too large (${sizeMB.toFixed(1)}MB, max ${EXTRACTION_LIMITS.maxFileSizeMB}MB). DMARC reports are typically under 1MB.`)
  }
}

function validateMagicBytes(buffer: Buffer, fileName: string): 'zip' | 'gzip' | 'xml' | '7z' {
  const detected = detectFileType(buffer)
  if (detected === 'unknown') {
    throw new ExtractionError('INVALID_TYPE',
      'Please upload a .zip, .gz, or .xml file. Most email providers send DMARC reports as .zip or .gz compressed files.')
  }
  return detected
}

async function validateZipContents(zip: JSZip, compressedSize: number): Promise<void> {
  const entries = Object.entries(zip.files).filter(([, f]) => !f.dir)
  if (entries.length > EXTRACTION_LIMITS.maxFilesInZip) {
    throw new ExtractionError('TOO_MANY_FILES',
      `This ZIP contains too many files (${entries.length}, max ${EXTRACTION_LIMITS.maxFilesInZip}). Standard DMARC report ZIPs contain 1-5 files.`)
  }
  // Estimate uncompressed size from file metadata
  let totalUncompressed = 0
  for (const [, file] of entries) {
    // JSZip stores _data with uncompressedSize
    const fileData = file as any
    const uncompSize = fileData?._data?.uncompressedSize || 0
    totalUncompressed += uncompSize
  }
  // If metadata unavailable, decompress first file to sample
  if (totalUncompressed === 0 && entries.length > 0) {
    const sample = await entries[0][1].async('uint8array')
    totalUncompressed = sample.length * entries.length // estimate
  }
  const ratio = compressedSize > 0 ? totalUncompressed / compressedSize : 0
  if (ratio > EXTRACTION_LIMITS.maxCompressionRatio) {
    throw new ExtractionError('ZIP_BOMB_DETECTED',
      'This file has an unusual compression ratio and could not be processed safely.')
  }
  const uncompMB = totalUncompressed / (1024 * 1024)
  if (uncompMB > EXTRACTION_LIMITS.maxUncompressedMB) {
    throw new ExtractionError('ZIP_BOMB_DETECTED',
      `Uncompressed size (${uncompMB.toFixed(1)}MB) exceeds the ${EXTRACTION_LIMITS.maxUncompressedMB}MB limit.`)
  }
}

// Resolve 7za binary path based on platform
function get7zBin(): string {
  const platform = process.platform
  const arch = process.arch
  if (platform === 'win32') {
    return path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', arch === 'ia32' ? 'ia32' : 'x64', '7za.exe')
  } else if (platform === 'darwin') {
    return path.join(process.cwd(), 'node_modules', '7zip-bin', 'mac', arch === 'arm64' ? 'arm64' : 'x64', '7za')
  } else {
    // Linux (Vercel, etc.)
    return path.join(process.cwd(), 'node_modules', '7zip-bin', 'linux', arch === 'arm64' ? 'arm64' : 'x64', '7za')
  }
}

// INMYBOX MVP IMPROVEMENT — XML Parser Hardening — explicit entity/DTD protection
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: false,
  htmlEntities: false,
  allowBooleanAttributes: false,
  isArray: (name) => {
    return name === 'record'
  },
})

export async function extractFilesFromUpload(
  buffer: Buffer,
  fileName: string
): Promise<{ name: string; content: string }[]> {
  // INMYBOX MVP IMPROVEMENT — Pre-extraction gate: size → magic bytes → type-specific guards
  validateFileSize(buffer)
  const detectedType = validateMagicBytes(buffer, fileName)

  switch (detectedType) {
    case '7z':
      return extractFrom7z(buffer, fileName)
    case 'gzip':
    case 'zip':
      return extractFromZip(buffer)
    case 'xml':
      return [{ name: fileName, content: buffer.toString('utf-8') }]
    default: {
      // Fallback: try extension-based detection for edge cases
      const lower = fileName.toLowerCase()
      if (lower.endsWith('.7z')) return extractFrom7z(buffer, fileName)
      if (lower.endsWith('.zip') || lower.endsWith('.gz')) return extractFromZip(buffer)
      if (lower.endsWith('.xml')) return [{ name: fileName, content: buffer.toString('utf-8') }]
      throw new ExtractionError('INVALID_TYPE',
        'Please upload a .zip, .gz, or .xml file. Most email providers send DMARC reports as .zip or .gz compressed files.')
    }
  }
}

async function extractFromZip(buffer: Buffer): Promise<{ name: string; content: string }[]> {
  const zip = await JSZip.loadAsync(buffer)

  // INMYBOX MVP IMPROVEMENT — ZIP bomb protection: file count + compression ratio + uncompressed size
  await validateZipContents(zip, buffer.length)

  const files: { name: string; content: string }[] = []
  let totalExtracted = 0
  const maxBytes = EXTRACTION_LIMITS.maxUncompressedMB * 1024 * 1024

  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    if (name.toLowerCase().endsWith('.xml')) {
      const content = await file.async('string')
      totalExtracted += content.length
      if (totalExtracted > maxBytes) {
        throw new ExtractionError('ZIP_BOMB_DETECTED',
          `Uncompressed content exceeds ${EXTRACTION_LIMITS.maxUncompressedMB}MB limit.`)
      }
      files.push({ name, content })
    }
  }

  if (files.length === 0) {
    throw new Error('No XML files found in archive')
  }

  return files
}

async function extractFrom7z(buffer: Buffer, fileName: string): Promise<{ name: string; content: string }[]> {
  // INMYBOX ENHANCEMENT — Phase 2 M1: Sanitize filename to prevent path traversal in execFile
  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmarc-7z-'))
  const archivePath = path.join(tmpDir, sanitizedName)
  const extractDir = path.join(tmpDir, 'extracted')
  fs.mkdirSync(extractDir, { recursive: true })
  fs.writeFileSync(archivePath, buffer)

  try {
    // Use 7za binary directly via child_process to avoid Next.js bundling issues
    const sevenZipBin = get7zBin()
    await new Promise<void>((resolve, reject) => {
      execFile(sevenZipBin, ['x', archivePath, `-o${extractDir}`, '-y'], (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`7z extraction failed: ${stderr || err.message}`))
        } else {
          resolve()
        }
      })
    })

    // INMYBOX MVP IMPROVEMENT — 7z bomb protection: file count + total size limit
    const files: { name: string; content: string }[] = []
    let totalSize = 0
    const maxBytes = EXTRACTION_LIMITS.maxUncompressedMB * 1024 * 1024
    let fileCount = 0
    const readDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          readDir(fullPath)
        } else if (entry.name.toLowerCase().endsWith('.xml')) {
          fileCount++
          if (fileCount > EXTRACTION_LIMITS.maxFilesInZip) {
            throw new ExtractionError('TOO_MANY_FILES',
              `Archive contains too many files (max ${EXTRACTION_LIMITS.maxFilesInZip}). Standard DMARC report archives contain 1-5 files.`)
          }
          const stat = fs.statSync(fullPath)
          totalSize += stat.size
          if (totalSize > maxBytes) {
            throw new ExtractionError('ZIP_BOMB_DETECTED',
              `Extracted content exceeds ${EXTRACTION_LIMITS.maxUncompressedMB}MB limit.`)
          }
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

// INMYBOX MVP IMPROVEMENT — Enhanced DMARC schema validation per RFC 7489
export function validateDmarcReport(feedback: DmarcFeedback): string[] {
  const errors: string[] = []

  // Required: report_metadata > org_name
  if (!feedback.reportMetadata.orgName || feedback.reportMetadata.orgName === 'Unknown') {
    errors.push('Missing report organization name')
  }
  // Required: report_metadata > report_id
  if (!feedback.reportMetadata.reportId) {
    errors.push('Missing report ID')
  }
  // Required: report_metadata > date_range (sanity check)
  if (feedback.reportMetadata.dateRange) {
    const { begin, end } = feedback.reportMetadata.dateRange
    if (end < begin) {
      errors.push('Invalid date range: end before begin')
    }
    // Reject reports claiming to be more than 2 years in the future
    const twoYearsFromNow = Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
    if (begin > twoYearsFromNow) {
      errors.push('Invalid date range: dates are in the far future')
    }
  }
  // Required: policy_published > domain
  if (!feedback.policyPublished.domain || feedback.policyPublished.domain === 'unknown') {
    errors.push('Missing policy domain')
  }
  // Required: at least one record
  if (feedback.records.length === 0) {
    errors.push('No records found in report')
  }
  // Validate each record has required fields
  for (let i = 0; i < Math.min(feedback.records.length, 5); i++) {
    const rec = feedback.records[i]
    if (!rec.sourceIp || rec.sourceIp === 'unknown') {
      errors.push(`Record ${i + 1}: missing source IP`)
    }
    if (!rec.count || rec.count < 1) {
      errors.push(`Record ${i + 1}: invalid count`)
    }
  }
  // String length sanity
  if (feedback.reportMetadata.orgName && feedback.reportMetadata.orgName.length > 500) {
    errors.push('Organization name exceeds maximum length')
  }
  if (feedback.policyPublished.domain && feedback.policyPublished.domain.length > 253) {
    errors.push('Domain name exceeds maximum length')
  }

  return errors
}
