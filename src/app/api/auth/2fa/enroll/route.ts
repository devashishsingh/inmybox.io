import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/crypto'
import * as OTPAuth from 'otpauth'

// POST /api/auth/2fa/enroll — generate TOTP secret and return QR URI
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.totpEnabled) {
    return NextResponse.json({ error: '2FA is already enabled' }, { status: 409 })
  }

  // Generate a new TOTP secret
  const totp = new OTPAuth.TOTP({
    issuer: 'Inmybox',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }), // 160-bit secret
  })

  const secret = totp.secret.base32
  const uri = totp.toString() // otpauth:// URI for QR code

  // Encrypt and temporarily persist the secret (not yet confirmed / enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: encrypt(secret) },
  })

  return NextResponse.json({ uri, secret })
}
