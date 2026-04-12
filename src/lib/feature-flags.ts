// INMYBOX ENHANCEMENT: S2 — Feature flags utility
// Wrap new features in flags so they can be toggled without redeployment.
// Flags are controlled via environment variables (NEXT_PUBLIC_ for client, server-only otherwise).

export const featureFlags = {
  // ─── Client-accessible flags (NEXT_PUBLIC_ prefix) ───────────────
  /** New landing page design */
  newLanding: process.env.NEXT_PUBLIC_NEW_LANDING === 'true',

  // ─── Server-only flags ────────────────────────────────────────────
  /** Enable BIMI validation features */
  bimiEnabled: process.env.FEATURE_BIMI_ENABLED !== 'false', // default ON
  /** Enable email pipeline auto-fetch */
  emailPipeline: process.env.FEATURE_EMAIL_PIPELINE !== 'false', // default ON
  /** Enable public domain scan lead capture */
  leadCapture: process.env.FEATURE_LEAD_CAPTURE !== 'false', // default ON
} as const

/**
 * Check if a feature flag is enabled.
 * Usage: if (isFeatureEnabled('bimiEnabled')) { ... }
 */
export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag]
}
