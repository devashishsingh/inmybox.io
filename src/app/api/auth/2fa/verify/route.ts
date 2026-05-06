import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/utils/crypto'
import * as OTPAuth from 'otpauth'
import { z } from 'zod'
import crypto from 'crypto'

const bodySchema = z.object({
  code: z.string().min(6).max(8), // 6-digit TOTP or 8-char backup code
  context: z.enum(['enroll', 'login']),
})

// POST /api/auth/2fa/verify — validate TOTP code or backup code
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { code, context } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.totpSecret) {
    return NextResponse.json({ error: 'No 2FA secret found. Please start enrollment.' }, { status: 400 })
  }

  const secret = decrypt(user.totpSecret)

  // Try TOTP code first (6 digits)
  if (/^\d{6}$/.test(code)) {
    const totp = new OTPAuth.TOTP({
      issuer: 'Inmybox',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    // delta: ±1 window (30s grace)
    const delta = totp.validate({ token: code, window: 1 })
    if (delta === null) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 })
    }
  } else {
    // Backup code path
    if (!user.backupCodes) {
      return NextResponse.json({ error: 'No backup codes available.' }, { status: 400 })
    }
    const codes: string[] = JSON.parse(decrypt(user.backupCodes))
    const idx = codes.indexOf(code.toUpperCase())
    if (idx === -1) {
      return NextResponse.json({ error: 'Invalid backup code.' }, { status: 401 })
    }
    // Consume backup code (single-use)
    codes.splice(idx, 1)
    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: encrypt(JSON.stringify(codes)) },
    })
  }

  // ── Enrollment context: activate TOTP + generate backup codes ──────
  if (context === 'enroll') {
    const rawCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpEnrolledAt: new Date(),
        backupCodes: encrypt(JSON.stringify(rawCodes)),
      },
    })
    return NextResponse.json({ success: true, backupCodes: rawCodes })
  }

  // ── Login context: mark session as 2FA-verified via custom header ───
  // The middleware reads x-2fa-verified to update the JWT token on next request.
  // We return a flag the client stores in sessionStorage to annotate the cookie.
  return NextResponse.json({ success: true, verified: true })
}
