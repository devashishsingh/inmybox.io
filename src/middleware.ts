import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// INMYBOX ENHANCEMENT — Phase 5: Request ID injection for traceability
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
