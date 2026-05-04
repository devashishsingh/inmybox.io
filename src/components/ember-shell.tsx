// Shared visual shell for all marketing/public pages.
// Applies the ember (spiritual-industrial) background + animated mail-icon
// starfield and the NavbarV2 so individual pages don't have to repeat it.

import { NavbarV2 } from './landing-nav-v2'

export function EmberShell({
  children,
  withNav = true,
}: {
  children: React.ReactNode
  /** Set false for pages that render their own custom nav (e.g. signin/signup). */
  withNav?: boolean
}) {
  return (
    <div className="ember-root relative min-h-screen ember-bg overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ember-stars-1" />
        <div className="ember-stars-2" />
        <div className="absolute inset-0 ember-grid" />
      </div>
      {withNav && <NavbarV2 />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
