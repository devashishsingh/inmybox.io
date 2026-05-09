import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { execFile } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as zlib from 'zlib'
import { promisify } from 'util'
import type { DmarcFeedback, DmarcRecordParsed } from '@/types'

const gunzipAsync = promisify(zlib.gunzip)

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

  if (lower.endsWith('.zip')) {
    return extractFromZip(buffer)
  }

  // Real DMARC senders (Google, Yahoo, Microsoft) overwhelmingly ship .xml.gz —
  // route gzip and tar.gz to a proper zlib-based extractor, not JSZip.
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    return extractFromTarGz(buffer, fileName)
  }
  if (lower.endsWith('.gz') || lower.endsWith('.gzip')) {
    return extractFromGzip(buffer, fileName)
  }

  if (lower.endsWith('.xml')) {
    return [{ name: fileName, content: buffer.toString('utf-8') }]
  }

  // Unknown extension: detect by magic bytes, then text-sniff for XML.
  // Order matters: gzip first (1f 8b), then zip (50 4b 03 04), then raw XML.
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return extractFromGzip(buffer, fileName)
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 && buffer[1] === 0x4b &&
    buffer[2] === 0x03 && buffer[3] === 0x04
  ) {
    return extractFromZip(buffer)
  }

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

/**
 * Decompresses a single-member gzip stream. Most real-world DMARC reports
 * (Google, Yahoo, Microsoft) ship as `<reportname>.xml.gz` — a single XML
 * document gzipped. After gunzip, sniff the result: if it's XML, return it
 * as a single file; if it looks like a tar archive, extract members.
 */
async function extractFromGzip(
  buffer: Buffer,
  fileName: string
): Promise<{ name: string; content: string }[]> {
  let decompressed: Buffer
  try {
    decompressed = await gunzipAsync(buffer)
  } catch (err: any) {
    throw new Error(`gz extraction failed: ${err?.message || 'unknown error'}`)
  }

  // Heuristic: tar magic 'ustar' lives at offset 257 of the first 512-byte block.
  const looksLikeTar =
    decompressed.length >= 512 &&
    decompressed.slice(257, 262).toString('utf-8') === 'ustar'
  if (looksLikeTar) {
    const files = extractXmlFromTarBuffer(decompressed)
    if (files.length === 0) {
      throw new Error('gz extraction succeeded but no XML files found in tar archive')
    }
    return files
  }

  // Single-member gzip — should be the XML report itself.
  const content = decompressed.toString('utf-8')
  const trimmed = content.trim()
  if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<feedback')) {
    throw new Error('gz extraction produced a non-XML payload')
  }

  // Strip the .gz / .gzip suffix from the original filename for the inner name.
  const innerName = fileName.replace(/\.(gz|gzip)$/i, '') || 'report.xml'
  return [{ name: innerName, content }]
}

async function extractFromTarGz(
  buffer: Buffer,
  fileName: string
): Promise<{ name: string; content: string }[]> {
  let decompressed: Buffer
  try {
    decompressed = await gunzipAsync(buffer)
  } catch (err: any) {
    throw new Error(`gz extraction failed: ${err?.message || 'unknown error'}`)
  }

  const files = extractXmlFromTarBuffer(decompressed)
  if (files.length === 0) {
    throw new Error(`No XML files found in tar.gz archive (${fileName})`)
  }
  return files
}

/**
 * Minimal POSIX/USTAR tar reader. Tar archives are a sequence of 512-byte
 * header blocks followed by file content padded to a 512-byte boundary.
 *  - bytes   0-99  : file name (NUL-terminated)
 *  - bytes 124-135 : size in octal ASCII (NUL/space-terminated)
 *  - bytes 156     : type flag ('0' or '\0' = regular file, '5' = directory)
 *  - bytes 257-262 : "ustar" magic
 * Two consecutive zero blocks mark end-of-archive.
 *
 * We only extract regular files whose name ends in `.xml`. This is enough
 * for DMARC archives; we deliberately do not handle long-name extensions
 * (LongLink) since DMARC report names are well under 100 chars.
 */
function extractXmlFromTarBuffer(
  buf: Buffer
): { name: string; content: string }[] {
  const out: { name: string; content: string }[] = []
  let offset = 0
  while (offset + 512 <= buf.length) {
    const header = buf.slice(offset, offset + 512)
    // End-of-archive: a zero-filled block.
    if (header.every((b) => b === 0)) break

    const name = readCString(header, 0, 100)
    const sizeOctal = readCString(header, 124, 12).trim()
    const size = parseInt(sizeOctal, 8) || 0
    const typeFlag = String.fromCharCode(header[156] || 0x30)
    offset += 512

    if ((typeFlag === '0' || typeFlag === '\0') && name && size > 0) {
      const content = buf.slice(offset, offset + size)
      if (name.toLowerCase().endsWith('.xml')) {
        out.push({ name, content: content.toString('utf-8') })
      }
    }
    // Advance past padded content.
    offset += Math.ceil(size / 512) * 512
  }
  return out
}

function readCString(buf: Buffer, start: number, length: number): string {
  const slice = buf.slice(start, start + length)
  const nul = slice.indexOf(0)
  return slice.slice(0, nul === -1 ? length : nul).toString('utf-8')
}

async function extractFrom7z(buffer: Buffer, fileName: string): Promise<{ name: string; content: string }[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmarc-7z-'))
  const archivePath = path.join(tmpDir, fileName)
  const extractDir = path.join(tmpDir, 'extracted')
  fs.mkdirSync(extractDir, { recursive: true })
  fs.writeFileSync(archivePath, buffer)

  try {
    // Use 7za binary directly via child_process to avoid Next.js bundling issues
    const sevenZipBin = get7zBin()
    await new Promise<void>((resolve, reject) => {
      execFile(sevenZipBin, ['x', archivePath, `-o${extractDir}`, '-y'], (err, stdout, stderr) => {
        if (err) {
          // The 7za binary is shipped via the 7zip-bin npm package but Vercel's
          // build trace strips platform-specific binaries that aren't statically
          // require()'d, so the spawn fails with ENOENT in production. Real
          // DMARC senders never use .7z, so surface a clear, actionable message
          // instead of a cryptic spawn error.
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new Error(
              '7z format is not supported in cloud deployments. ' +
              'Real DMARC providers (Google, Yahoo, Microsoft) send reports ' +
              'as .zip or .gz which are fully supported.'
            ))
          } else {
            reject(new Error(`7z extraction failed: ${stderr || err.message}`))
          }
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

      // ALIGNMENT — from policy_evaluated. This is what DMARC uses to compute pass/fail.
      const spfResult = (policyEval.spf || 'fail').toLowerCase()
      const dkimResult = (policyEval.dkim || 'fail').toLowerCase()

      // AUTHENTICATION — from auth_results. Tells us whether the SPF/DKIM check itself
      // passed, independent of whether the authenticated domain aligned with header_from.
      // DMARC XML allows multiple <dkim> blocks (one per signature). We pick the first
      // pass if any signature passed, otherwise the first reported result. SPF is single
      // in practice but we use the same shape for safety.
      const spfAuth = authResults.spf
      const dkimAuth = authResults.dkim
      const spfResults = Array.isArray(spfAuth) ? spfAuth : spfAuth ? [spfAuth] : []
      const dkimResults = Array.isArray(dkimAuth) ? dkimAuth : dkimAuth ? [dkimAuth] : []

      const pickAuthResult = (entries: any[]): string | undefined => {
        if (entries.length === 0) return undefined
        const passing = entries.find(
          (e) => typeof e?.result === 'string' && e.result.toLowerCase() === 'pass'
        )
        const chosen = passing || entries[0]
        return typeof chosen?.result === 'string' ? chosen.result.toLowerCase() : undefined
      }

      // For domain selection, prefer the entry whose result was chosen above so the
      // domain shown in the UI corresponds to the auth verdict shown.
      const pickAuthDomain = (entries: any[]): string | undefined => {
        if (entries.length === 0) return undefined
        const passing = entries.find(
          (e) => typeof e?.result === 'string' && e.result.toLowerCase() === 'pass'
        )
        const chosen = passing || entries[0]
        return typeof chosen?.domain === 'string' ? chosen.domain : undefined
      }

      return {
        sourceIp: row.source_ip || 'unknown',
        count: parseInt(row.count) || 1,
        disposition: (policyEval.disposition || 'none').toLowerCase() as any,
        spfResult: spfResult as 'pass' | 'fail',
        dkimResult: dkimResult as 'pass' | 'fail',
        spfAuthResult: pickAuthResult(spfResults),
        dkimAuthResult: pickAuthResult(dkimResults),
        dmarcResult: dkimResult === 'pass' || spfResult === 'pass' ? 'pass' : 'fail',
        headerFrom: identifiers.header_from,
        envelopeFrom: identifiers.envelope_from,
        spfDomain: pickAuthDomain(spfResults),
        dkimDomain: pickAuthDomain(dkimResults),
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
