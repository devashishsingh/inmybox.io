# Phase 3: Auth Improvements — Fix Report

**Date:** April 13, 2026  
**Backup Branch:** `backup/pre-phase3-auth`  
**Build Status:** ✅ Compiled successfully  

---

## Summary

| # | Fix ID | Title | Severity | Status |
|---|--------|-------|----------|--------|
| 1 | M7 | Invite page password minLength 6→8 | MEDIUM | ✅ Fixed |
| 2 | NEW | Middleware: add `/api/bimi` route coverage | NEW | ✅ Added |
| 3 | NEW | Server-side password complexity (register + invite accept) | NEW | ✅ Added |
| 4 | NEW | Rate limiting on `/api/auth/register` | NEW | ✅ Added |
| 5 | M9 | Cookie consent: localStorage → httpOnly cookie | MEDIUM | ✅ Fixed |

---

## Fix 1 — M7: Invite Page Password minLength (MEDIUM)

**Finding:** The invite acceptance form (`/invite`) had `minLength={6}` on the password input, but the backend Zod schema requires `min(8)`. Users could type 6-7 character passwords, submit, and get a confusing server error.

**Before:**
```tsx
<input id="invite-password" type="password" required minLength={6}
  ... placeholder="Min 6 characters" />
```

**After:**
```tsx
{/* INMYBOX ENHANCEMENT — Phase 3: minLength 6→8 to match backend Zod validation */}
<input id="invite-password" type="password" required minLength={8}
  ... placeholder="Min 8 characters" />
```

**Impact:** Client-side validation now matches server-side. No more UX gap.

**File Modified:** `src/app/invite/page.tsx`

---

## Fix 2 — Middleware: Add `/api/bimi` Route Coverage (NEW)

**Finding:** The `/api/bimi` endpoint relied solely on route-level `getServerSession()` checks. While functional, it was inconsistent with other authenticated API routes that are protected at the middleware layer.

**Before:**
```ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/reports/:path*',
    '/api/analytics/:path*',
    '/api/senders/:path*',
    '/api/settings/:path*',
    '/api/export/:path*',
    '/api/action-items/:path*',
    '/api/admin/:path*',
    '/api/onboarding/:path*',
  ],
}
```

**After:**
```ts
// INMYBOX ENHANCEMENT — Phase 3: Added /api/bimi to consolidate auth at middleware layer
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/reports/:path*',
    '/api/analytics/:path*',
    '/api/senders/:path*',
    '/api/settings/:path*',
    '/api/export/:path*',
    '/api/action-items/:path*',
    '/api/admin/:path*',
    '/api/onboarding/:path*',
    '/api/bimi/:path*',
  ],
}
```

**Impact:** BIMI endpoint now has defense-in-depth — middleware rejects unauthenticated requests before they reach the route handler. Unauthorized requests get redirected to `/auth/signin` instead of receiving a JSON error.

**File Modified:** `src/middleware.ts`

---

## Fix 3 — Server-Side Password Complexity (NEW)

**Finding:** The register and invite acceptance routes only enforced `min(8)` on passwords server-side. The signup page had a client-side strength meter showing "Fair/Good/Strong" but no matching server enforcement. A direct API call could bypass the UI entirely with a weak 8-character password like `aaaaaaaa`.

**Before (register route):**
```ts
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
})
```

**After (register route):**
```ts
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain at least one number')
    .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password must contain at least one special character'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
})
```

**Before (invite accept route):**
```ts
const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
```

**After (invite accept route):**
```ts
const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain at least one number')
    .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password must contain at least one special character'),
})
```

**Password Policy (enforced server-side):**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Impact:** Passwords are now validated server-side regardless of client. Both registration and invitation acceptance enforce the same policy.

**Files Modified:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/invite/accept/route.ts`

---

## Fix 4 — Rate Limiting on `/api/auth/register` (NEW)

**Finding:** The registration endpoint had no rate limiting. An attacker could automate mass account creation, abuse resources, and potentially fill the database with fake accounts.

**Before:**
```ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ...no rate check
```

**After:**
```ts
// In-memory rate limiter: 3 registrations per 15 minutes per IP
const registerRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const REGISTER_RATE_WINDOW = 15 * 60_000 // 15 minutes
const REGISTER_RATE_MAX = 3

function isRegisterRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = registerRateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    registerRateLimitMap.set(ip, { count: 1, resetAt: now + REGISTER_RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > REGISTER_RATE_MAX
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown'
  if (isRegisterRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    )
  }
  // ...proceed with registration
```

**Rate Limit Config:**
| Parameter | Value |
|-----------|-------|
| Window | 15 minutes |
| Max requests | 3 per IP |
| Response | HTTP 429 + descriptive error |

**Impact:** Prevents automated mass account creation. Legitimate users are unlikely to register more than 3 times in 15 minutes.

**File Modified:** `src/app/api/auth/register/route.ts`

---

## Fix 5 — M9: Cookie Consent → httpOnly Cookie (MEDIUM)

**Finding:** Cookie consent was stored in `localStorage` (`inmybox-cookie-consent`). localStorage is accessible to any JavaScript on the page, meaning an XSS attack could read or modify consent status.

**Before:**
```tsx
// cookie-banner.tsx
const accept = () => {
  localStorage.setItem('inmybox-cookie-consent', 'accepted')
  setShow(false)
}
const decline = () => {
  localStorage.setItem('inmybox-cookie-consent', 'declined')
  setShow(false)
}
```

**After — New API Route (`/api/consent`):**
```ts
// src/app/api/consent/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  const value = body.consent // 'accepted' or 'declined'

  const response = NextResponse.json({ consent: value })
  response.cookies.set('inmybox-cookie-consent', value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
  })
  return response
}
```

**After — Updated Cookie Banner:**
```tsx
// cookie-banner.tsx
const setConsent = async (value: 'accepted' | 'declined') => {
  await fetch('/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consent: value }),
  })
  // Companion visible cookie so banner knows consent was given
  document.cookie = `inmybox-consent-set=1; path=/; max-age=...`
}
```

**Architecture:**
| Layer | Cookie | Purpose |
|-------|--------|---------|
| Server (httpOnly) | `inmybox-cookie-consent` | Stores actual consent value — not accessible to client JS |
| Client (visible) | `inmybox-consent-set` | Flag-only — tells banner not to show again |

**Impact:** Consent value is now protected from XSS. Only the existence flag (not the value) is visible to client-side JavaScript.

**Files Created:**
- `src/app/api/consent/route.ts`

**Files Modified:**
- `src/components/cookie-banner.tsx`

---

## Deferred Items (Future Phases)

| Item | Reason Deferred |
|------|-----------------|
| Password reset flow (`/api/auth/reset-password`) | Requires Resend email integration (not yet configured) |
| OAuth providers (Google, GitHub) | Feature expansion — not a security fix |
| Redis-backed rate limiting | Current in-memory is adequate for single-instance deployment |
| Session revocation / force logout | Requires token blacklist infrastructure |

---

## Files Modified (Complete List)

| File | Change | Fix IDs |
|------|--------|---------|
| `src/app/invite/page.tsx` | minLength 6→8, placeholder text updated | M7 |
| `src/middleware.ts` | Added `/api/bimi/:path*` to matcher | NEW |
| `src/app/api/auth/register/route.ts` | Password complexity + rate limiter | NEW |
| `src/app/api/invite/accept/route.ts` | Password complexity validation | NEW |
| `src/app/api/consent/route.ts` | **NEW FILE** — httpOnly cookie consent endpoint | M9 |
| `src/components/cookie-banner.tsx` | Replaced localStorage with API call + companion cookie | M9 |
