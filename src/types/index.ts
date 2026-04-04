// ─── DMARC PARSING TYPES ────────────────────────────────────────────

export interface DmarcFeedback {
  reportMetadata: {
    reportId: string;
    orgName: string;
    email?: string;
    dateRange: {
      begin: number;
      end: number;
    };
  };
  policyPublished: {
    domain: string;
    adkim?: string;
    aspf?: string;
    p?: string;
    sp?: string;
    pct?: number;
  };
  records: DmarcRecordParsed[];
}

export interface DmarcRecordParsed {
  sourceIp: string;
  count: number;
  disposition: 'none' | 'quarantine' | 'reject';
  spfResult: 'pass' | 'fail';
  dkimResult: 'pass' | 'fail';
  dmarcResult: 'pass' | 'fail';
  headerFrom?: string;
  envelopeFrom?: string;
  spfDomain?: string;
  dkimDomain?: string;
}

// ─── DELIVERY & RISK TYPES ─────────────────────────────────────────

export type RiskLevel = 'healthy' | 'medium' | 'high' | 'critical';

export interface DeliveryOutcome {
  riskLevel: RiskLevel;
  inboxProbability: number;
  spamProbability: number;
  rejectProbability: number;
  trustScore: number;
  label: string;
  description: string;
}

export interface BusinessImpact {
  totalEmails: number;
  estimatedReachable: number;
  likelyUnreachable: number;
  spamRiskVolume: number;
  expectedLeads: number;
  potentialLeadLoss: number;
  estimatedRevenueAtRisk: number;
  campaignHealthScore: number;
}

// ─── SENDER TYPES ───────────────────────────────────────────────────

export interface SenderProfile {
  ip: string;
  hostname?: string;
  label?: string;
  status: 'known' | 'unknown' | 'suspicious' | 'trusted';
  totalVolume: number;
  passCount: number;
  failCount: number;
  lastSeen?: Date;
  notes?: string;
  tags?: string[];
}

export type SenderCategory =
  | 'legitimate'
  | 'marketing'
  | 'transactional'
  | 'forwarding'
  | 'spoofing'
  | 'unknown';

// ─── IP ENRICHMENT TYPES ────────────────────────────────────────────

export interface IpEnrichmentData {
  ip: string;
  reverseDns?: string;
  asn?: string;
  asnOrg?: string;
  country?: string;
  city?: string;
  provider?: string;
  providerType?: 'cloud' | 'isp' | 'hosting' | 'enterprise';
  isKnownSender: boolean;
}

// ─── ACTION ITEM TYPES ─────────────────────────────────────────────

export type ActionItemType =
  | 'spf_failure'
  | 'dkim_failure'
  | 'unknown_sender'
  | 'suspicious_ip'
  | 'policy_recommendation'
  | 'config_issue';

export type ActionItemSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ActionItemData {
  type: ActionItemType;
  severity: ActionItemSeverity;
  title: string;
  description: string;
  recommendation: string;
  sourceIp?: string;
  domainId?: string;
  metadata?: Record<string, unknown>;
}

// ─── ANALYTICS TYPES ────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalReports: number;
  totalRecords: number;
  totalVolume: number;
  spfPassRate: number;
  dkimPassRate: number;
  dmarcPassRate: number;
  rejectionRate: number;
  quarantineRate: number;
  delivery: DeliveryOutcome;
  impact: BusinessImpact;
  trendData: TrendPoint[];
  topFailingIps: { ip: string; count: number; failRate: number }[];
  senderBreakdown: { known: number; unknown: number; suspicious: number; trusted: number };
  actionItems?: { open: number; critical: number; high: number };
}

export interface TrendPoint {
  date: string;
  pass: number;
  fail: number;
  volume: number;
}

// ─── TENANT TYPES ───────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export interface TenantSettings {
  conversionRate: number;
  avgLeadValue: number;
  campaignBenchmark: number;
  reportRetention: number;
  notifications: boolean;
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'never';
  alertThreshold: number;
}

// ─── INGESTION TYPES ────────────────────────────────────────────────

export type IngestionSource = 'upload' | 'email' | 'api';

export interface IngestionResult {
  success: boolean;
  source: IngestionSource;
  reportCount: number;
  recordCount: number;
  processingMs: number;
  errors?: string[];
}

export interface UploadResult {
  success: boolean;
  fileName: string;
  reportCount: number;
  recordCount: number;
  errors?: string[];
}
