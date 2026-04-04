import { prisma } from '@/lib/prisma'
import { extractFilesFromUpload, parseDmarcXml, validateDmarcReport } from '@/lib/dmarc-parser'
import { findOrCreateDomain } from './domain.service'
import { updateSenderFromRecord } from './sender.service'
import { generateActionItems } from './action-items.service'
import type { IngestionResult, IngestionSource } from '@/types'

interface IngestionParams {
  tenantId: string
  buffer: Buffer
  fileName: string
  fileSize: number
  source: IngestionSource
}

/**
 * Full ingestion pipeline: validate → unzip → parse XML → normalize → store → calculate.
 */
export async function ingestReport(params: IngestionParams): Promise<IngestionResult> {
  const { tenantId, buffer, fileName, fileSize, source } = params
  const startTime = Date.now()

  let totalReports = 0
  let totalRecords = 0
  const errors: string[] = []

  try {
    // 1. Extract XML files from upload (handles .zip, .gz, .xml)
    const xmlFiles = await extractFilesFromUpload(buffer, fileName)

    // 2. Store raw file reference
    const rawFile = await prisma.rawFile.create({
      data: {
        tenantId,
        fileName: `${Date.now()}_${fileName}`,
        originalName: fileName,
        fileSize,
        storagePath: `${tenantId}/raw/${Date.now()}_${fileName}`,
        status: 'pending',
      },
    })

    // 3. Process each XML file
    for (const xmlFile of xmlFiles) {
      try {
        const feedback = parseDmarcXml(xmlFile.content)
        const validationErrors = validateDmarcReport(feedback)

        if (validationErrors.length > 0) {
          errors.push(`${xmlFile.name}: ${validationErrors.join(', ')}`)
          await logIngestion(tenantId, xmlFile.name, fileSize, source, 'failed', validationErrors.join(', '))
          continue
        }

        // 4. Find or create domain within tenant
        const domain = await findOrCreateDomain(tenantId, feedback.policyPublished.domain)

        // 5. Check for duplicate report
        const existing = await prisma.dmarcReport.findFirst({
          where: {
            reportId: feedback.reportMetadata.reportId,
            domainId: domain.id,
          },
        })

        if (existing) {
          errors.push(`${xmlFile.name}: Duplicate report`)
          await logIngestion(tenantId, xmlFile.name, fileSize, source, 'duplicate', null, domain.id)
          continue
        }

        // 6. Create report with records
        const report = await prisma.dmarcReport.create({
          data: {
            reportId: feedback.reportMetadata.reportId,
            orgName: feedback.reportMetadata.orgName,
            email: feedback.reportMetadata.email,
            dateBegin: new Date(feedback.reportMetadata.dateRange.begin * 1000),
            dateEnd: new Date(feedback.reportMetadata.dateRange.end * 1000),
            domainId: domain.id,
            rawFileId: rawFile.id,
            status: 'processed',
            policyDomain: feedback.policyPublished.domain,
            policyAdkim: feedback.policyPublished.adkim,
            policyAspf: feedback.policyPublished.aspf,
            policyP: feedback.policyPublished.p,
            policySp: feedback.policyPublished.sp,
            policyPct: feedback.policyPublished.pct,
            records: {
              create: feedback.records.map((rec) => ({
                sourceIp: rec.sourceIp,
                count: rec.count,
                disposition: rec.disposition,
                spfResult: rec.spfResult,
                dkimResult: rec.dkimResult,
                dmarcResult: rec.dmarcResult,
                headerFrom: rec.headerFrom,
                envelopeFrom: rec.envelopeFrom,
                spfDomain: rec.spfDomain,
                dkimDomain: rec.dkimDomain,
              })),
            },
          },
        })

        // 7. Update sender intelligence
        for (const rec of feedback.records) {
          await updateSenderFromRecord(domain.id, rec, feedback.reportMetadata.dateRange.end)
        }

        // 8. Generate action items for notable findings
        await generateActionItems(tenantId, domain.id, feedback)

        totalReports++
        totalRecords += feedback.records.length

        await logIngestion(
          tenantId, xmlFile.name, fileSize, source, 'success',
          null, domain.id, feedback.records.length, 1
        )
      } catch (err: any) {
        errors.push(`${xmlFile.name}: ${err.message}`)
        await logIngestion(tenantId, xmlFile.name, fileSize, source, 'failed', err.message)
      }
    }

    // Update raw file status
    await prisma.rawFile.update({
      where: { id: rawFile.id },
      data: { status: totalReports > 0 ? 'parsed' : 'failed' },
    })

  } catch (err: any) {
    errors.push(err.message)
    await logIngestion(tenantId, fileName, fileSize, source, 'failed', err.message)
  }

  const processingMs = Date.now() - startTime

  return {
    success: totalReports > 0,
    source,
    reportCount: totalReports,
    recordCount: totalRecords,
    processingMs,
    errors: errors.length > 0 ? errors : undefined,
  }
}

async function logIngestion(
  tenantId: string,
  fileName: string,
  fileSize: number,
  source: IngestionSource,
  status: string,
  errorMessage?: string | null,
  domainId?: string,
  recordCount?: number,
  reportCount?: number
) {
  await prisma.ingestionLog.create({
    data: {
      tenantId,
      fileName,
      fileSize,
      source,
      status,
      errorMessage: errorMessage || null,
      domainId: domainId || null,
      recordCount: recordCount || 0,
      reportCount: reportCount || 0,
    },
  })
}
