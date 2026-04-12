# Phase 2: Security Hardening — Fix Report

**Date:** April 12, 2026  
**Backup Branch:** `backup/pre-phase2-security`  
**Build Status:** ✅ Compiled successfully  

---

## Summary

| # | Fix ID | Title | Severity | Status |
|---|--------|-------|----------|--------|
| 1 | C1 | Next.js upgrade (14.2.5 → 14.2.35) | CRITICAL | ✅ Fixed |
| 2 | NEW | Security response headers | NEW | ✅ Added |
| 3 | H8 | JWT session maxAge reduced | HIGH | ✅ Fixed |
| 4 | M1 | Filename sanitization in execFile | MEDIUM | ✅ Fixed |
| 5 | M2 | Query parameter enum validation | MEDIUM | ✅ Fixed (4 routes) |

---

## Fix 1 — C1: Next.js Upgrade (CRITICAL)

**Finding:** Next.js 14.2.5 had 2 critical DoS vulnerabilities:
- GHSA-7m27-7ghc-44w9: DoS via Server Actions
- GHSA-5j59-xgg2-r9c4: DoS via Server Components

**Before:**
```json
"next": "14.2.5"
"eslint-config-next": "14.2.5"
```

**After:**
```json
"next": "14.2.35"
"eslint-config-next": "14.2.35"
```

**Impact:** Resolved both critical DoS CVEs. Vulnerability count reduced from 14 → 11. Remaining 11 require breaking major version upgrades (Next 16, next-auth v5, jspdf v4) — deferred to future major upgrade phase.

**Files Modified:**
- `package.json`
- `package-lock.json`

---

## Fix 2 — Security Response Headers (NEW)

**Finding:** No security headers were set on HTTP responses. Missing protections against clickjacking, MIME-sniffing, and other browser-level attacks.

**Before:**
```js
// next.config.js — no headers() function
const nextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: { serverComponentsExternalPackages: [...] },
};
```

**After:**
```js
// next.config.js — Phase 2: Security headers added
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
}
```

**Headers Added:**
| Header | Purpose |
|--------|---------|
| `X-Frame-Options: DENY` | Prevents clickjacking (iframe embedding) |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing attacks |
| `Referrer-Policy: strict-origin-when-cross-origin` | Controls referrer information leakage |
| `X-DNS-Prefetch-Control: on` | Enables DNS prefetching for performance |
| `Strict-Transport-Security` | Enforces HTTPS for 2 years with preload |
| `Permissions-Policy` | Disables camera, microphone, geolocation access |

**File Modified:** `next.config.js`

---

## Fix 3 — H8: JWT Session maxAge Reduced (HIGH)

**Finding:** JWT session tokens were valid for 30 days. If a token is compromised, attacker has a month-long window.

**Before:**
```ts
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},
```

**After:**
```ts
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
},
```

**Impact:** Reduces attack window from 30 days to 7 days. Users will need to re-authenticate weekly.

**File Modified:** `src/lib/auth-config.ts`

---

## Fix 4 — M1: Filename Sanitization in execFile (MEDIUM)

**Finding:** `extractFrom7z()` in `dmarc-parser.ts` passes the user-provided `fileName` directly into `path.join()` and then to `execFile()`. A malicious filename like `../../etc/passwd.7z` could enable path traversal.

**Before:**
```ts
async function extractFrom7z(buffer: Buffer, fileName: string) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmarc-7z-'))
  const archivePath = path.join(tmpDir, fileName)
```

**After:**
```ts
async function extractFrom7z(buffer: Buffer, fileName: string) {
  // Sanitize filename to prevent path traversal in execFile
  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmarc-7z-'))
  const archivePath = path.join(tmpDir, sanitizedName)
```

**Sanitization Steps:**
1. `path.basename()` — strips directory components (`../../` → just the filename)
2. Regex replace — allows only alphanumeric, dots, hyphens, underscores

**File Modified:** `src/lib/dmarc-parser.ts`

---

## Fix 5 — M2: Query Parameter Enum Validation (MEDIUM)

**Finding:** 6 routes read query parameters without validating against known enums. Invalid values could cause unexpected behavior or pass untrusted data to Prisma WHERE clauses.

### Route 1: `/api/action-items` (GET)

**Before:**
```ts
const status = searchParams.get('status') || undefined
const severity = searchParams.get('severity') || undefined
```

**After:**
```ts
const validStatuses = ['open', 'acknowledged', 'resolved', 'dismissed']
const validSeverities = ['critical', 'high', 'medium', 'low']
const rawStatus = searchParams.get('status')
const rawSeverity = searchParams.get('severity')
const status = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : undefined
const severity = rawSeverity && validSeverities.includes(rawSeverity) ? rawSeverity : undefined
```

### Route 2: `/api/analytics/drilldown` (GET)

**Before:**
```ts
const type = searchParams.get('type') // spf, dkim, dmarc, ip, disposition
```

**After:**
```ts
const validTypes = ['spf', 'dkim', 'dmarc', 'ip', 'disposition']
const type = searchParams.get('type')
if (type && !validTypes.includes(type)) {
  return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
}
```

### Route 3: `/api/export` (GET)

**Before:**
```ts
const format = new URL(req.url).searchParams.get('format') || 'csv'
```

**After:**
```ts
const validFormats = ['csv', 'pdf']
const rawFormat = new URL(req.url).searchParams.get('format') || 'csv'
const format = validFormats.includes(rawFormat) ? rawFormat : 'csv'
```

### Route 4: `/api/admin/leads` (GET)

**Before:**
```ts
const risk = url.searchParams.get('risk')?.trim()
// ... directly used in: where.riskLevel = risk
```

**After:**
```ts
const rawRisk = url.searchParams.get('risk')?.trim()
const validRiskLevels = ['critical', 'high', 'medium', 'low']
const risk = rawRisk && validRiskLevels.includes(rawRisk) ? rawRisk : undefined
```

### Routes Already Adequate (No Changes Needed):
- `/api/admin/inspect` — Uses `switch/default` that returns 400 for invalid sections
- `/api/cron/fetch-emails` — Only checks `action === 'test'` as boolean guard, no DB usage

**Files Modified:**
- `src/app/api/action-items/route.ts`
- `src/app/api/analytics/drilldown/route.ts`
- `src/app/api/export/route.ts`
- `src/app/api/admin/leads/route.ts`

---

## Remaining Vulnerabilities (Deferred — Require Breaking Changes)

| Vulnerability | Package | Fix Requires | Risk |
|---------------|---------|-------------|------|
| DoS via Image Optimizer | next 14.x | Next.js 16 (breaking) | Moderate — requires crafted remotePatterns |
| HTTP request smuggling in rewrites | next 14.x | Next.js 16 (breaking) | Moderate — requires specific rewrite config |
| Disk cache exhaustion | next 14.x | Next.js 16 (breaking) | Low — self-hosted only |
| DOMPurify XSS/prototype pollution | jspdf → dompurify | jspdf v4 (breaking) | Low — DOMPurify not directly invoked |
| glob command injection | eslint-config-next → glob | eslint-config-next 16 (breaking) | Very Low — dev dependency, CLI only |
| Nodemailer SMTP injection | next-auth → nodemailer | next-auth v5 (breaking) | Low — requires SMTP config manipulation |

---

## Files Modified (Complete List)

| File | Change | Fix IDs |
|------|--------|---------|
| `package.json` | Next.js 14.2.5 → 14.2.35 | C1 |
| `package-lock.json` | Dependency tree update | C1 |
| `next.config.js` | Security headers function | NEW |
| `src/lib/auth-config.ts` | maxAge 30d → 7d | H8 |
| `src/lib/dmarc-parser.ts` | Filename sanitization | M1 |
| `src/app/api/action-items/route.ts` | status/severity enum validation | M2 |
| `src/app/api/analytics/drilldown/route.ts` | type enum validation | M2 |
| `src/app/api/export/route.ts` | format enum validation | M2 |
| `src/app/api/admin/leads/route.ts` | risk enum validation | M2 |
