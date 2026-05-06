/**
 * AES-256-GCM encrypt/decrypt utility.
 *
 * Required env var: ENCRYPTION_KEY — 64 hex chars (32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALG = 'aes-256-gcm'
const IV_LEN = 12  // 96-bit IV — NIST recommended for GCM
const TAG_LEN = 16 // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts plaintext and returns a base64 string: iv:ciphertext:tag
 */
export function encrypt(plaintext: string): string {
  const crypto = require('crypto') as typeof import('crypto')
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, key, iv, { authTagLength: TAG_LEN })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), encrypted.toString('base64'), tag.toString('base64')].join(':')
}

/**
 * Decrypts a base64 string produced by encrypt().
 */
export function decrypt(payload: string): string {
  const crypto = require('crypto') as typeof import('crypto')
  const key = getKey()
  const parts = payload.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted payload format')
  const [ivB64, encB64, tagB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const encrypted = Buffer.from(encB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const decipher = crypto.createDecipheriv(ALG, key, iv, { authTagLength: TAG_LEN })
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
