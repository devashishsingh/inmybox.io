-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpEnrolledAt" TIMESTAMP(3),
    "backupCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactEmail" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "pollIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "stoppedReason" TEXT,
    "lastFetchAt" TIMESTAMP(3),
    "fetchCount" INTEGER NOT NULL DEFAULT 0,
    "notifiedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AliasMapping" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AliasMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domainAdded" BOOLEAN NOT NULL DEFAULT false,
    "aliasAssigned" BOOLEAN NOT NULL DEFAULT false,
    "dmarcRuaUpdated" BOOLEAN NOT NULL DEFAULT false,
    "sampleReportUploaded" BOOLEAN NOT NULL DEFAULT false,
    "firstReportReceived" BOOLEAN NOT NULL DEFAULT false,
    "parsingComplete" BOOLEAN NOT NULL DEFAULT false,
    "sendersReviewed" BOOLEAN NOT NULL DEFAULT false,
    "assumptionsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "dashboardReady" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "ingestionMethod" TEXT,
    "wizardStep" INTEGER NOT NULL DEFAULT 0,
    "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "dmarcSetupStatus" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmarcReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "email" TEXT,
    "dateBegin" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "domainId" TEXT NOT NULL,
    "rawFileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "policyDomain" TEXT,
    "policyAdkim" TEXT,
    "policyAspf" TEXT,
    "policyP" TEXT,
    "policySp" TEXT,
    "policyPct" INTEGER,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmarcReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmarcRecord" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "disposition" TEXT NOT NULL,
    "spfResult" TEXT NOT NULL,
    "dkimResult" TEXT NOT NULL,
    "dmarcResult" TEXT NOT NULL,
    "headerFrom" TEXT,
    "envelopeFrom" TEXT,
    "spfDomain" TEXT,
    "dkimDomain" TEXT,
    "ipEnrichmentId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmarcRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawFile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sender" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "hostname" TEXT,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "tags" TEXT,
    "domainId" TEXT NOT NULL,
    "totalVolume" INTEGER NOT NULL DEFAULT 0,
    "passCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderClassification" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFirstPartySender" BOOLEAN NOT NULL DEFAULT false,
    "autoClassified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpEnrichment" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reverseDns" TEXT,
    "asn" TEXT,
    "asnOrg" TEXT,
    "country" TEXT,
    "city" TEXT,
    "provider" TEXT,
    "providerType" TEXT,
    "isKnownSender" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustScore" INTEGER NOT NULL,
    "deliveryScore" DOUBLE PRECISION NOT NULL,
    "inboxProbability" DOUBLE PRECISION NOT NULL,
    "spamProbability" DOUBLE PRECISION NOT NULL,
    "rejectProbability" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "totalVolume" INTEGER NOT NULL,
    "passVolume" INTEGER NOT NULL,
    "failVolume" INTEGER NOT NULL,
    "estimatedReachable" INTEGER NOT NULL DEFAULT 0,
    "potentialLeadLoss" INTEGER NOT NULL DEFAULT 0,
    "estimatedRevenueAtRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "campaignHealthScore" INTEGER NOT NULL DEFAULT 100,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domainId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "sourceIp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "avgLeadValue" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "campaignBenchmark" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "reportRetention" INTEGER NOT NULL DEFAULT 90,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" TEXT NOT NULL DEFAULT 'weekly',
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "status" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "domainId" TEXT,
    "processingMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimiConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "certificateUrl" TEXT,
    "generatedRecord" TEXT,
    "publishedAt" TIMESTAMP(3),
    "readinessStatus" TEXT NOT NULL DEFAULT 'unknown',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "blockers" TEXT,
    "logoValid" BOOLEAN NOT NULL DEFAULT false,
    "logoError" TEXT,
    "certValid" BOOLEAN,
    "certError" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'not_started',
    "lastCheckAt" TIMESTAMP(3),
    "lastCheckResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BimiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BimiCheck" (
    "id" TEXT NOT NULL,
    "bimiConfigId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BimiCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainScan" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "dmarcScore" INTEGER NOT NULL DEFAULT 0,
    "spfScore" INTEGER NOT NULL DEFAULT 0,
    "dkimScore" INTEGER NOT NULL DEFAULT 0,
    "configScore" INTEGER NOT NULL DEFAULT 0,
    "rawResult" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "imapPass" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailboxConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSequenceLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "EmailSequenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollingHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "reportsFound" INTEGER NOT NULL DEFAULT 0,
    "reportsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollLock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineConfig_tenantId_key" ON "PipelineConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_userId_tenantId_key" ON "TenantMembership"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AliasMapping_alias_key" ON "AliasMapping"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_tenantId_idx" ON "Invitation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingChecklist_tenantId_key" ON "OnboardingChecklist"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_domain_tenantId_key" ON "Domain"("domain", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DmarcReport_reportId_domainId_key" ON "DmarcReport"("reportId", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "Sender_ip_domainId_key" ON "Sender"("ip", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "SenderClassification_senderId_key" ON "SenderClassification"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "IpEnrichment_ip_key" ON "IpEnrichment"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BimiConfig_tenantId_domainId_key" ON "BimiConfig"("tenantId", "domainId");

-- CreateIndex
CREATE INDEX "DomainScan_domain_idx" ON "DomainScan"("domain");

-- CreateIndex
CREATE INDEX "DomainScan_email_idx" ON "DomainScan"("email");

-- CreateIndex
CREATE INDEX "DomainScan_createdAt_idx" ON "DomainScan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxConnection_tenantId_key" ON "MailboxConnection"("tenantId");

-- CreateIndex
CREATE INDEX "EmailSequenceLog_tenantId_type_idx" ON "EmailSequenceLog"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PollingHistory_tenantId_idx" ON "PollingHistory"("tenantId");

-- CreateIndex
CREATE INDEX "PollingHistory_createdAt_idx" ON "PollingHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PollLock_tenantId_key" ON "PollLock"("tenantId");

-- AddForeignKey
ALTER TABLE "PipelineConfig" ADD CONSTRAINT "PipelineConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AliasMapping" ADD CONSTRAINT "AliasMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmarcReport" ADD CONSTRAINT "DmarcReport_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmarcReport" ADD CONSTRAINT "DmarcReport_rawFileId_fkey" FOREIGN KEY ("rawFileId") REFERENCES "RawFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmarcRecord" ADD CONSTRAINT "DmarcRecord_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DmarcReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmarcRecord" ADD CONSTRAINT "DmarcRecord_ipEnrichmentId_fkey" FOREIGN KEY ("ipEnrichmentId") REFERENCES "IpEnrichment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawFile" ADD CONSTRAINT "RawFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sender" ADD CONSTRAINT "Sender_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderClassification" ADD CONSTRAINT "SenderClassification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionLog" ADD CONSTRAINT "IngestionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimiConfig" ADD CONSTRAINT "BimiConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimiConfig" ADD CONSTRAINT "BimiConfig_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BimiCheck" ADD CONSTRAINT "BimiCheck_bimiConfigId_fkey" FOREIGN KEY ("bimiConfigId") REFERENCES "BimiConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxConnection" ADD CONSTRAINT "MailboxConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSequenceLog" ADD CONSTRAINT "EmailSequenceLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
