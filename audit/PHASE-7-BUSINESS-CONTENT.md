# Phase 7 — Business Pages & Content

**Date:** April 13, 2026
**Branch backup:** `backup/pre-phase7-business`
**Build status:** ✅ Pass

---

## Scope

Phase 7 addresses remaining business-content and documentation findings from the initial audit. One item (M6 — API response standardization) was deferred as it would violate the ENHANCER NOT REBUILDER rule for marginal gain.

## Changes

### M10 / M11 — Privacy Policy: Third-Party Disclosure & Cookie Details
**File:** `src/app/privacy/page.tsx`

- **Section 5 (Data Sharing):** Added explicit disclosure that sender IP addresses from DMARC reports are queried against `rdap.org` (RDAP) and `bgpview.io` (BGPView) for IP enrichment. Clarified that no personal user data is sent to these services.
- **Section 7 (Data Retention):** Added sub-section for lead & demo request data — retained up to 12 months, deletable on request.
- **Section 8 (Cookies):** Expanded from one vague paragraph to a specific cookie inventory:
  - `next-auth.session-token` — auth session, 7-day expiry, HttpOnly/Secure
  - `cookie-consent` — consent record, 365-day expiry, HttpOnly
  - `theme` — light/dark preference, persistent, client-only
  - Confirmed no third-party advertising or tracking cookies.
- Updated "Last updated" date to April 13, 2026.

### L6 — Terms of Service: Lead Retention Clause
**File:** `src/app/terms/page.tsx`

- **Section 8 (Termination):** Added clause specifying demo requests and lead submissions from non-registered users are retained for up to 12 months, then auto-purged. Users may request earlier deletion.
- Updated "Last updated" date to April 13, 2026.

### L3 — README: Credential Placeholder Safety
**File:** `README.md`

- Replaced `[PASSWORD]` and `[PROJECT]` bracket placeholders with `<PASSWORD>` and `<PROJECT>` angle-bracket format (non-functional, clearly placeholder).
- Replaced `"your-secret-key"` and `"your-cron-secret"` with `<generate with: openssl rand -base64 32>` instructions.
- Replaced `"your-email@gmail.com"` and `"your-app-password"` with `<your-gmail@gmail.com>` and `<your-app-password>`.
- Added `cp .env.example .env` instruction and reference to `.env.example`.

### C3 — clear-data.js: IP Enrichment Scope Guard
**File:** `scripts/clear-data.js`

- `ipEnrichment.deleteMany()` was the only remaining global (non-tenant-scoped) deletion in the script (everything else was already scoped in Phase 0).
- Added `NODE_ENV !== 'production'` guard — global IP cache wipe now only runs in dev. In production, it's skipped with a log message.

### L7 — Demo Form: Phone Field Purpose Disclosure
**File:** `src/app/demo/page.tsx`

- Added helper text below phone input: "Optional — used only to schedule your demo call"
- Closes the gap between collecting phone data and disclosing its purpose.

## Deferred

### M6 — API Response Pattern Standardization
**Reason:** The API routes use varied response shapes (`{ data }`, `{ results }`, direct arrays, `{ error }`), but all are functional and consumed correctly by their respective frontends. Standardizing would require touching 20+ working routes for negligible user benefit, violating the ENHANCER NOT REBUILDER constraint. Documented as a future refactor opportunity.

## Files Changed (6)

| File | Change |
|------|--------|
| `src/app/privacy/page.tsx` | M10/M11/L6 — cookie inventory, IP enrichment disclosure, lead retention |
| `src/app/terms/page.tsx` | L6 — lead/demo retention clause |
| `README.md` | L3 — safe credential placeholders, .env.example reference |
| `scripts/clear-data.js` | C3 — production guard on global IP cache wipe |
| `src/app/demo/page.tsx` | L7 — phone field purpose text |
| `audit/PHASE-7-BUSINESS-CONTENT.md` | This document |
