// INMYBOX ENHANCEMENT: H3 — Proper NextAuth session types
// Eliminates `(session.user as any).id` pattern across 15+ API routes
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface User {
    id: string
    role: string
    totpEnabled: boolean
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Session {
    user: {
      id: string
      role: string
      totpEnabled: boolean
      twoFactorVerified: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface JWT {
    id: string
    role: string
    totpEnabled: boolean
    twoFactorVerified: boolean
  }
}
