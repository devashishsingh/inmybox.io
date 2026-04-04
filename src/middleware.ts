import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

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
