# Phase 4: Multi-Tenancy Hardening — Fix Report

**Date:** April 13, 2026  
**Backup Branch:** `backup/pre-phase4-multitenancy`  
**Build Status:** ✅ Compiled successfully  

---

## Summary

| # | Fix ID | Title | Severity | Status |
|---|--------|-------|----------|--------|
| 1 | M6 | Alias service: enforce tenantId on non-admin queries | MEDIUM | ✅ Fixed |
| 2 | NEW | Cron endpoint: remove x-internal-cron header bypass | NEW | ✅ Fixed |
| 3 | NEW | Centralized `requireTenantContext()` helper | NEW | ✅ Added |
| 4 | M5 | Admin leads CSV: document as intentionally unscoped | MEDIUM | ✅ Documented |

---

## Multi-Tenancy Audit Results

Before applying fixes, a comprehensive audit of all 11 services and 15+ API routes was performed:

### Tenant Isolation: What's Already Strong

| Area | Assessment |
|------|-----------|
| **Schema design** | All 14 tenant-scoped models have proper `tenantId` references with cascade deletes |
| **Domain service** | `listDomains()`, `getDomainIds()`, `removeDomain()` all filter by `tenantId` |
| **Sender service** | `updateSenderStatus()` explicitly verifies `sender.domain.tenantId !== tenantId` |
| **Action items service** | All queries include `tenantId` filter |
| **Analytics service** | Uses `getDomainIds(tenantId)` → domain-scoped joins |
| **BIMI service** | Dual filter: `tenantId` + `domainId` |
| **Onboarding service** | All functions require and filter by `tenantId` |
| **Invitation service** | `listInvitations()` filters by `tenantId` |
| **Provisioning service** | Admin-only, properly guarded by `requireSuperAdmin()` |
| **Unique constraints** | `@@unique([domain, tenantId])`, `@@unique([tenantId, domainId])`, `@@unique([userId, tenantId])` |

### Non-Tenant-Scoped Tables (Intentional)

| Table | Reason |
|-------|--------|
| `User` | Global identity — belongs to tenants via `TenantMembership` |
| `DomainScan` | Public landing page scanner — pre-authentication lead capture |
| `DemoRequest` | Public demo form — no user context |

---

## Fix 1 — M6: Alias Service tenantId Enforcement (MEDIUM)

**Finding:** `listAliases()` accepted an optional `tenantId` parameter. If called without it, it returned all aliases across all tenants. While the only call site (admin route) already required super admin, the pattern was unsafe — any future non-admin caller could accidentally omit the parameter.

**Before:**
```ts
export async function listAliases(params?: { tenantId?: string }) {
  const where: Record<string, unknown> = {}
  if (params?.tenantId) where.tenantId = params.tenantId

  return prisma.aliasMapping.findMany({
    where,
    include: { tenant: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
```

**After:**
```ts
/**
 * Admin-only: Lists all aliases, optionally filtered by tenant.
 */
export async function listAliasesForAdmin(tenantId?: string) {
  const where: Record<string, unknown> = {}
  if (tenantId) where.tenantId = tenantId

  return prisma.aliasMapping.findMany({
    where,
    include: { tenant: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Tenant-scoped: Lists aliases for a specific tenant (enforced).
 */
export async function listAliases(tenantId: string) {
  return prisma.aliasMapping.findMany({
    where: { tenantId },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
```

**Architecture Change:**
| Function | Who can use | tenantId |
|----------|-------------|----------|
| `listAliasesForAdmin()` | Admin routes only | Optional (filters all tenants) |
| `listAliases()` | Any route | **Required** (enforced isolation) |

**Admin route updated:**
```ts
// src/app/api/admin/aliases/route.ts
import { listAliasesForAdmin } from '@/lib/services/alias.service'
const aliases = await listAliasesForAdmin(tenantId) // admin-only variant
```

**Impact:** Future non-admin callers cannot accidentally list all tenants' aliases. The compiler enforces the `tenantId` parameter.

**Files Modified:**
- `src/lib/services/alias.service.ts`
- `src/app/api/admin/aliases/route.ts`

---

## Fix 2 — Cron x-internal-cron Header Bypass Removed (NEW)

**Finding:** The cron endpoint (`/api/cron/fetch-emails`) had a fallback auth path that accepted `x-internal-cron: true` when `CRON_SECRET` was not set. This meant any external request could trigger email processing in development environments without any secret.

**Before:**
```ts
async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true
  }

  // Internal background worker uses this header
  if (req.headers.get('x-internal-cron') === 'true' && !cronSecret) {
    return true  // ⚠️ ANYONE can send this header!
  }

  const session = await getServerSession(authOptions)
  if (session?.user?.role === 'super_admin') return true
  return false
}
```

**After:**
```ts
async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return true
  }

  // INMYBOX ENHANCEMENT — Phase 4: Removed x-internal-cron bypass (was exploitable)
  // In development without CRON_SECRET, require admin session instead

  const session = await getServerSession(authOptions)
  if (session?.user?.role === 'super_admin') return true
  return false
}
```

**Impact:** Removed attack vector. Without `CRON_SECRET`, only authenticated super admin sessions can trigger the cron. In production, `CRON_SECRET` via Bearer token is the primary auth path.

**File Modified:** `src/app/api/cron/fetch-emails/route.ts`

---

## Fix 3 — Centralized `requireTenantContext()` Helper (NEW)

**Finding:** Every API route that needs tenant context repeats the same 10-line pattern:
```ts
const session = await getServerSession(authOptions)
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const ctx = await resolveTenantContext(session.user.id)
if (!ctx) return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
```

This boilerplate appears in 13+ routes and is error-prone to maintain.

**Added to `src/lib/services/tenant.service.ts`:**
```ts
export async function requireTenantContext(): Promise<TenantContext | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await resolveTenantContext(session.user.id)
  if (!ctx) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  return ctx
}
```

**Usage pattern (for future route refactoring):**
```ts
// Before (10 lines):
const session = await getServerSession(authOptions)
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.user.id
const ctx = await resolveTenantContext(userId)
if (!ctx) return NextResponse.json({ error: 'No tenant found' }, { status: 404 })

// After (3 lines):
const result = await requireTenantContext()
if (result instanceof NextResponse) return result
const ctx = result
```

**Note:** Existing routes are NOT refactored in this phase (ENHANCER NOT REBUILDER rule). The helper is available for new routes and optional future refactoring.

**File Modified:** `src/lib/services/tenant.service.ts`

---

## Fix 4 — M5: Admin Leads CSV Documentation (MEDIUM)

**Finding:** The admin leads CSV export queries `DomainScan` without a `tenantId` filter. The audit flagged this as M5 "unscoped export." Investigation confirmed this is **intentional by design** because `DomainScan` is a global lead capture table (no `tenantId` column).

**Added clear documentation comment:**
```ts
// INMYBOX ENHANCEMENT — Phase 4 M5: DomainScan is intentionally NOT tenant-scoped.
// This table stores public domain scan results from the free landing page scanner.
// It has no tenantId because scans happen before authentication.
// Access is restricted to super_admin only via requireSuperAdmin() guard.
```

**File Modified:** `src/app/api/admin/leads/route.ts`

---

## Deferred Items (Future Phases)

| Item | Reason Deferred |
|------|-----------------|
| H1 — Enable RLS on Supabase | Requires SQL migration + Supabase dashboard access |
| Multi-tenant user switching UI | Not a security issue; UX feature for multi-org users |
| Tenant-level admin roles (owner/admin/viewer) | Role system works; tenant-level granularity is a feature enhancement |
| Refactor 13 routes to use `requireTenantContext()` | Working code — ENHANCER NOT REBUILDER rule |

---

## Files Modified (Complete List)

| File | Change | Fix IDs |
|------|--------|---------|
| `src/lib/services/alias.service.ts` | Split `listAliases` into enforced + admin variants | M6 |
| `src/app/api/admin/aliases/route.ts` | Updated import to `listAliasesForAdmin` | M6 |
| `src/app/api/cron/fetch-emails/route.ts` | Removed x-internal-cron bypass | NEW |
| `src/lib/services/tenant.service.ts` | Added `requireTenantContext()` helper | NEW |
| `src/app/api/admin/leads/route.ts` | Added M5 intentional-design documentation | M5 |
