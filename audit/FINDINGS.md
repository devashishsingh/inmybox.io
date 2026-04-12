# Inmybox Security & Quality Audit — Findings

**Audit Date:** April 12, 2026
**Auditor:** Automated (GitHub Copilot Phase 0)
**Scope:** Full codebase read-only audit — 50+ files reviewed

---

## Executive Summary

Inmybox has solid fundamentals: strict TypeScript, consistent tenant isolation on authenticated routes via `resolveTenantContext()`, Prisma ORM (no raw SQL injection), Zod validation on most POST endpoints, and proper bcryptjs password hashing. However, production readiness gaps exist across security, data privacy, and infrastructure hardening.

| Severity | Count |
|----------|-------|
| CRITICAL | 6     |
| HIGH     | 15    |
| MEDIUM   | 19    |
| LOW      | 8     |

npm audit: 14 dependency vulnerabilities (2 critical Next.js DoS, 7 high, 4 moderate, 1 low)

---

## Critical Findings

### C1 — Next.js DoS Vulnerabilities (npm audit)
- **GHSA-7m27-7ghc-44w9**: Next.js DoS with Server Actions
- **GHSA-5j59-xgg2-r9c4**: Next.js DoS with Server Components
- **Fix:** Upgrade Next.js to latest patched version

### C2 — `dangerouslySetInnerHTML` in blog renderer
- **File:** `src/app/blog/[slug]/page.tsx` line ~119
- **Issue:** Renders markdown HTML without sanitization. XSS if blog content is compromised.
- **Fix:** Sanitize HTML before rendering

### C3 — `scripts/clear-data.js` — Unscoped `deleteMany()`
- **File:** `scripts/clear-data.js` lines 7-30
- **Issue:** Deletes ALL data across ALL tenants with no where clause and no confirmation
- **Fix:** Require `--tenantId` argument or confirmation prompt

### C4 — SSRF vector in BIMI logo/certificate fetch
- **File:** `src/lib/services/bimi.service.ts` lines ~289, 310, 343
- **Issue:** Fetches arbitrary user-provided URLs (logo, certificate). Can probe internal network.
- **Fix:** Validate URLs — block private IP ranges (10.x, 172.16.x, 192.168.x, localhost)

### C5 — 3 API routes expose raw error messages to clients
- `src/app/api/senders/route.ts` line 83: `{ error: 'Lookup failed', detail: err.message }`
- `src/app/api/reports/upload/route.ts` line 50: `{ error: error.message }`
- `src/app/api/admin/users/route.ts` line 54: `{ error: err.message }`
- **Fix:** Return generic error messages; log details server-side only

### C6 — Public scan capture endpoint has no rate limiting
- **File:** `src/app/api/scan/capture/route.ts` line 21
- **Issue:** Anyone with a valid `scanId` can update the record and capture email. No rate limiting.
- **Fix:** Add rate limiting per IP

---

## High Findings

### H1 — No Row-Level Security (RLS) in database
- Tenant isolation relies entirely on application-layer filtering. Database compromise exposes all tenant data.
- **Fix:** Enable RLS on Supabase for tenant-scoped tables (future phase)

### H2 — 6 instances of PII logged to console
| File | Data at Risk |
|------|-------------|
| `src/app/api/auth/register/route.ts` L69 | Email, password hash in stack |
| `src/app/api/demo-request/route.ts` L64 | Name, email, phone, company |
| `src/app/api/reports/upload/route.ts` L50 | File metadata, user context |
| `src/lib/services/email-fetcher.service.ts` L194 | Email sender in error |
| `src/lib/services/email-fetcher.service.ts` L240 | Email sender address |
| `src/lib/email.ts` L109 | Email address logged |

### H3 — 79 explicit `any` types (15+ are `(session.user as any).id`)
- Pattern repeated across 15+ API routes. Should define proper `SessionUser` type.
- **Fix:** Extend NextAuth session type in `src/lib/auth-config.ts`

### H4 — No `.env.example` file
- 17+ env vars undocumented. Silent failures when SMTP/IMAP not configured.
- **Fix:** Create `.env.example` with all required/optional vars

### H5 — Homepage is `'use client'` — blocks SEO metadata export
- **File:** `src/app/page.tsx` line 1
- **Impact:** Homepage cannot export `metadata` object. Hurts SEO significantly.
- **Deferred:** Requires significant refactoring — tracked for future phase

### H6 — DOMPurify vulnerabilities (npm audit)
- GHSA-vhxf-7vqr-mrjg (XSS), GHSA-cj63-jhhr-wcxv (prototype pollution)
- **Fix:** Update DOMPurify (transitive dependency)

### H7 — `domain-scanner.tsx` — massive component (~1300 lines), no useMemo
- Missing `useMemo` for expensive calculations
- **Deferred:** Performance optimization — tracked for future phase

### H8 — 30-day JWT session maxAge
- **File:** `src/lib/auth-config.ts` line ~47
- **Deferred:** Requires auth flow changes — tracked for future phase

### H9 — Color contrast failures (WCAG 2.1 AA)
- `text-slate-500` on `bg-slate-900` (~3.2:1 ratio — fails AA)
- **Deferred:** UI polish — tracked for future phase

---

## Medium Findings

### M1 — `execFile` in dmarc-parser.ts line 97 — validate input filename
### M2 — 8 query-param routes lack strict enum validation
### M3 — `updateSenderStatus` relies on caller to verify tenant ownership
### M4 — Cron email fetch processes ALL active pipelines
### M5 — Admin leads CSV export unscoped (intentional but undocumented)
### M6 — No standardized API response schema
### M7 — Auth signin/invite forms: label binding improvements needed
### M8 — 15+ `fetch()` calls without caching or deduplication
### M9 — Cookie consent stored in `localStorage` (not httpOnly)
### M10 — Privacy policy incomplete (no detailed cookie list)
### M11 — No explicit user consent for DNS/IP enrichment third-party sharing
### M12 — Demo page (`/demo`) is `'use client'` with no metadata
### M13 — 6+ UI components catch errors but show no error state to user
### M14 — No `.env.example` documentation

---

## Low Findings

### L1 — `Math.random()` in seed.ts (dev-only)
### L2 — Hardcoded inline script in layout.tsx (theme detection)
### L3 — README shows placeholder env patterns
### L4 — Dev scripts (`check-db.js`) query without tenant filter (dev-only)
### L5 — `imapflow`/`nodemailer` moderate vulnerability (npm audit)
### L6 — No documented data retention policy for leads
### L7 — Phone numbers collected in demo form but not visibly used
### L8 — No request ID or structured logging framework

---

## What's Good

| Area | Details |
|------|---------|
| **Tenant isolation (app layer)** | All 13+ authenticated dashboard routes use `resolveTenantContext()` with proper `tenantId` filtering |
| **Password security** | bcryptjs with salt 12; Zod enforces min 8 chars |
| **Input validation** | 9 routes use Zod schemas; Prisma ORM prevents SQL injection |
| **No hardcoded secrets** | All credentials via `process.env` |
| **Middleware protection** | `src/middleware.ts` protects `/dashboard` and `/admin` routes |
| **File storage scoping** | `storagePath` includes `tenantId`; temp files cleaned up |
| **TypeScript strict mode** | `"strict": true` in tsconfig.json |
| **CSRF protection** | NextAuth CSRF token cookie by default |
| **Icon buttons** | Aria-labels on nav/sidebar toggles |
