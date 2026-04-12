# Phase 5: Monitoring & Observability — Fix Report

**Date:** April 13, 2026  
**Backup Branch:** `backup/pre-phase5-monitoring`  
**Build Status:** ✅ Compiled successfully  

---

## Summary

| # | Fix ID | Title | Severity | Status |
|---|--------|-------|----------|--------|
| 1 | L8 | Structured logging utility (`src/lib/logger.ts`) | LOW | ✅ Added |
| 2 | H2+ | Safe error logging in scan routes (4 sites) | HIGH | ✅ Fixed |
| 3 | NEW | Request ID injection via middleware | NEW | ✅ Added |
| 4 | H4 | `.env.example` — added feature flags section | HIGH | ✅ Updated |

---

## Pre-Implementation Audit

Before starting fixes, a thorough audit revealed several items were already resolved:

| Finding | Expected Status | Actual Status |
|---------|----------------|---------------|
| C4 — SSRF in BIMI fetch | Needs fix | ✅ Already protected (`isBlockedUrl()`) |
| H2 — PII in console logs (6 original sites) | Needs fix | ✅ Already fixed in Phase 0 |
| M13 — Error boundary UI | Needs fix | ✅ Already exists with fallback UI |
| C5 — Raw error messages to clients | Needs fix | ✅ Already fixed in Phase 0 |

### What Still Needed Fixing

| Site | File | Issue |
|------|------|-------|
| `scan/route.ts` L869 | Save scan error | `console.error('Failed to save scan:', err)` — raw error object |
| `scan/route.ts` L874 | Domain scan error | `console.error('Domain scan error:', err)` — raw error object |
| `scan/capture/route.ts` L59 | Lead notification | `.catch(err => console.error('Lead notification error:', err))` — raw error |
| `scan/capture/route.ts` L67 | Lead capture | `console.error('Lead capture error:', error)` — raw error |
| `scan/subdomains/route.ts` L105 | Subdomain discovery | `console.error('Subdomain discovery error:', err)` — raw error |

---

## Fix 1 — L8: Structured Logging Utility (NEW)

**Finding:** No standardized logging framework. Console calls are scattered with inconsistent formatting, no request context, and raw error objects that may leak stack traces.

**Added `src/lib/logger.ts`:**
```typescript
import { createLogger } from '@/lib/logger'

// Usage:
const log = createLogger('scan')
log.info('Domain scanned', { domain: 'example.com', score: 85 })
log.error('Scan failed', err, { domain: 'example.com' })
// Output: {"timestamp":"...","level":"error","module":"scan","message":"Scan failed","error":"Connection timeout","domain":"example.com"}
```

**Features:**
- Zero dependencies (built-in `JSON.stringify`)
- Safe error extraction: only `err.message` is logged, never full stack traces or raw objects
- Structured JSON output for log aggregation (Vercel, Datadog, etc.)
- Module tagging for filtering (`[scan]`, `[auth]`, etc.)
- Optional request ID propagation

**File Created:** `src/lib/logger.ts`

---

## Fix 2 — H2+: Safe Error Logging in Scan Routes (HIGH)

**Finding:** 5 `console.error` calls passed raw error objects directly, which in Node.js serializes the full Error including stack trace, potentially exposing file paths, internal code structure, and in some cases user data from the error context.

**Pattern Applied:**
```typescript
// Before (unsafe — raw error object)
console.error('Domain scan error:', err)

// After (safe — message-only extraction)
console.error(`[scan] Domain scan error: ${err instanceof Error ? err.message : 'Unknown error'}`)
```

**Files Modified:**
- `src/app/api/scan/route.ts` — 2 sites (save scan, domain scan)
- `src/app/api/scan/capture/route.ts` — 2 sites (lead notification, lead capture)
- `src/app/api/scan/subdomains/route.ts` — 1 site (subdomain discovery)

---

## Fix 3 — Request ID Injection via Middleware (NEW)

**Finding:** No way to trace a request across log entries. If a user reports an issue, there's no correlation ID to find all related log lines.

**Before:**
```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})
```

**After:**
```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const requestId = crypto.randomUUID()
    const headers = new Headers(req.headers)
    headers.set('x-request-id', requestId)

    const response = NextResponse.next({
      request: { headers },
    })
    response.headers.set('x-request-id', requestId)
    return response
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
)
```

**How it works:**
1. Generates a UUID v4 for every matched request
2. Injects `x-request-id` into both the **request headers** (available to API routes) and the **response headers** (visible to the client/browser)
3. API routes can read `req.headers.get('x-request-id')` and pass it to the logger
4. Scope: applies to all routes in the middleware matcher (dashboard, admin, protected API routes)

**File Modified:** `src/middleware.ts`

---

## Fix 4 — H4: .env.example Feature Flags Section (HIGH)

**Finding:** The `.env.example` file existed but was missing the 4 feature flags added in Phase 1. New developers wouldn't know about `NEXT_PUBLIC_NEW_LANDING`, `FEATURE_BIMI_ENABLED`, `FEATURE_EMAIL_PIPELINE`, or `FEATURE_LEAD_CAPTURE`.

**Added section:**
```env
# ─── Feature Flags (Phase 1) ──────────────────────────────────────
# NEXT_PUBLIC_NEW_LANDING="false"    # New landing page design (client-side)
# FEATURE_BIMI_ENABLED="true"        # BIMI validation features
# FEATURE_EMAIL_PIPELINE="true"      # Email pipeline auto-fetch
# FEATURE_LEAD_CAPTURE="true"        # Public domain scan lead capture
```

**File Modified:** `.env.example`

---

## Deferred Items (Future Phases)

| Item | Reason Deferred |
|------|-----------------|
| H1 — Enable RLS on Supabase | Requires SQL migration + Supabase dashboard access |
| H5 — Homepage `'use client'` SEO | Requires significant SSR refactoring |
| H7 — domain-scanner.tsx split/useMemo | Performance optimization, not a security issue |
| H9 — Color contrast WCAG AA | UI polish phase |
| Migrate all console.* calls to `createLogger` | Working code — ENHANCER NOT REBUILDER rule. Logger is available for new code and optional refactoring. |

---

## Files Modified (Complete List)

| File | Change | Fix IDs |
|------|--------|---------|
| `src/lib/logger.ts` | **Created** — structured logging utility | L8 |
| `src/app/api/scan/route.ts` | Safe error message extraction (2 sites) | H2+ |
| `src/app/api/scan/capture/route.ts` | Safe error message extraction (2 sites) | H2+ |
| `src/app/api/scan/subdomains/route.ts` | Safe error message extraction (1 site) | H2+ |
| `src/middleware.ts` | Request ID generation + header injection | NEW |
| `.env.example` | Added feature flags documentation | H4 |
