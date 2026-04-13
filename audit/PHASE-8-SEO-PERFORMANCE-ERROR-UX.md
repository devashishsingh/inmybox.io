# Phase 8 — SEO, Performance & Error-UX Improvements

**Date:** 2025-07-14
**Scope:** H5, H7, M3, M12, M13

---

## Changes

### H5 — Homepage SSR / Metadata (SEO)
- **`src/app/page.tsx`** — converted to server component; exports `metadata` with title, description, canonical URL, and OpenGraph tags.
- **`src/components/landing-page.tsx`** — extracted full client landing page into a named-export component imported by the server page.

### M12 — Demo Page Metadata (SEO)
- **`src/app/demo/page.tsx`** — converted to server component; exports `metadata` with title, description, canonical URL, and OpenGraph tags.
- **`src/components/demo-form.tsx`** — extracted client form into a named-export component imported by the server page.

### H7 — `useMemo` in Domain Scanner (Performance)
- **`src/components/domain-scanner.tsx`** — memoised `PillarDonut` chart-data computation and `FindingsSection` grouped-findings derivation with `useMemo`.

### M3 — Sender Tenant Check (Security — verified safe)
- Reviewed `src/app/api/senders/route.ts` — tenant filtering is enforced on every query via `where: { tenantId }`. No additional fix required.

### M13 — Dismissible Error Banners (Error UX)
Added `error` / `setError` state and a dismissible red error banner to **8 pages**:

| Page | Catches Updated |
|------|----------------|
| `dashboard/settings/page.tsx` | 2 |
| `dashboard/senders/page.tsx` | 5 |
| `dashboard/actions/page.tsx` | 2 |
| `dashboard/bimi/page.tsx` | 3 |
| `dashboard/page.tsx` | 1 + empty-state fallback |
| `dashboard/export/page.tsx` | 2 |
| `admin/leads/page.tsx` | 1 |
| `admin/tenants/[id]/page.tsx` | 2 |

---

## Remaining Open Items

| ID | Finding | Status |
|----|---------|--------|
| H1 | Prisma RLS (row-level security) | Deferred — requires DB migration |
| M4 | Cron endpoint throttle / rate-limit | Deferred — infra-level concern |
| M6 | API error-response standardisation | Deferred — low risk |
| M8 | Next.js fetch caching headers | Deferred — optimisation pass |

---

## Build Result
`next build` — **passed** (no errors, no warnings).
