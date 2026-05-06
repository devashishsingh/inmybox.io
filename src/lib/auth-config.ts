import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { triggerWelcomeSequence } from './services/onboarding.service'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          totpEnabled: user.totpEnabled,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // INMYBOX ENHANCEMENT — Phase 2: reduced from 30 days to 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
      // Fire welcome email sequence on first login (non-blocking)
      try {
        const membership = await prisma.tenantMembership.findFirst({
          where: { userId: (user as any).id },
          include: { tenant: true },
        })
        if (membership) {
          await triggerWelcomeSequence(membership.tenantId, (user as any).id)
        }
      } catch {
        // Never block sign-in on email failure
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.totpEnabled = (user as any).totpEnabled ?? false
        // Reset 2FA verification on every new sign-in — must re-verify each session
        token.twoFactorVerified = false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.totpEnabled = token.totpEnabled as boolean
        session.user.twoFactorVerified = token.twoFactorVerified as boolean
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
