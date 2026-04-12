import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

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
