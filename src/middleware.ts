import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// INMYBOX — Phase 2b: 2FA gate + onboarding redirect
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any
    const { pathname } = req.nextUrl

    // ── 2FA gate ────────────────────────────────────────────────────
    const publicPaths = ['/auth/', '/api/auth/', '/invite']
    const is2faPath = pathname.startsWith('/auth/setup-2fa') || pathname.startsWith('/auth/verify-2fa')

    // 2FA gate temporarily disabled — redirect straight to dashboard
    // if (!is2faPath && !publicPaths.some((p) => pathname.startsWith(p))) {
    //   if (token?.totpEnabled === false) {
    //     const url = req.nextUrl.clone()
    //     url.pathname = '/auth/setup-2fa'
    //     return NextResponse.redirect(url)
    //   }
    //   if (token?.totpEnabled === true && token?.twoFactorVerified !== true) {
    //     const url = req.nextUrl.clone()
    //     url.pathname = '/auth/verify-2fa'
    //     url.searchParams.set('callbackUrl', encodeURIComponent(pathname))
    //     return NextResponse.redirect(url)
    //   }
    // }

    // ── Request ID injection for traceability ───────────────────────
    const requestId = crypto.randomUUID()
    const headers = new Headers(req.headers)
    headers.set('x-request-id', requestId)

    const response = NextResponse.next({ request: { headers } })
    response.headers.set('x-request-id', requestId)
    return response
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
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
    '/api/mailbox/:path*',
    '/api/pipeline/:path*',
  ],
}
