/**
 * Inmybox Scanner Service — Fastify entrypoint.
 *
 * Endpoints:
 *   GET  /healthz                — liveness
 *   GET  /scan?domain=foo.com    — scan a domain (cached 5 min)
 *
 * Auth: shared-secret bearer token via SCANNER_TOKEN env var (optional but
 * strongly recommended in production). When set, every /scan request must
 * include `Authorization: Bearer <SCANNER_TOKEN>`.
 *
 * Cache: in-process LRU with TTL. Single-instance deploys benefit most;
 * for multi-instance Render plans, consider switching to Upstash Redis.
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import compress from '@fastify/compress'
import { isValidDomain, scanDomain, type ScanResult } from './engine.js'

const PORT = Number(process.env.PORT || 8080)
const HOST = process.env.HOST || '0.0.0.0'
const TOKEN = process.env.SCANNER_TOKEN || ''
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000) // 5 min
const CACHE_MAX = Number(process.env.CACHE_MAX || 1000)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*' // comma-separated list or '*'

/* ─── Cache ─────────────────────────────────────────────────── */
interface CacheEntry { value: ScanResult; expiresAt: number }
const cache = new Map<string, CacheEntry>()

function cacheGet(key: string): ScanResult | null {
  const e = cache.get(key)
  if (!e) return null
  if (e.expiresAt < Date.now()) { cache.delete(key); return null }
  // LRU bump
  cache.delete(key)
  cache.set(key, e)
  return e.value
}

function cacheSet(key: string, value: ScanResult): void {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

/* ─── In-flight de-duplication ──────────────────────────────── */
// If 50 requests for the same domain land in 200ms, only do 1 DNS scan.
const inflight = new Map<string, Promise<ScanResult>>()

async function scanWithCoalesce(domain: string): Promise<{ result: ScanResult; cached: boolean }> {
  const cached = cacheGet(domain)
  if (cached) return { result: cached, cached: true }
  const existing = inflight.get(domain)
  if (existing) return { result: await existing, cached: false }
  const p = (async () => {
    try {
      const result = await scanDomain(domain)
      cacheSet(domain, result)
      return result
    } finally {
      inflight.delete(domain)
    }
  })()
  inflight.set(domain, p)
  return { result: await p, cached: false }
}

/* ─── Server ────────────────────────────────────────────────── */
const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
  trustProxy: true, // Render terminates TLS in front of us
})

await fastify.register(cors, {
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  methods: ['GET', 'OPTIONS'],
})

// Compress JSON responses — typical scan payload is ~4 KB, compresses to ~1 KB
await fastify.register(compress, { global: true, encodings: ['gzip', 'deflate'] })

await fastify.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 30),
  timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  // Skip rate-limiting for healthchecks
  skipOnError: false,
  allowList: (req) => req.url.startsWith('/healthz'),
})

fastify.get('/healthz', async () => ({
  status: 'ok',
  uptime: Math.round(process.uptime()),
  cacheSize: cache.size,
  inflight: inflight.size,
}))

// Pre-warm: silently scan a list of domains in the background so the cache is
// hot before the first real request. Called by Render deploy hook or a cron.
fastify.post<{ Body: { domains?: string[] } }>(
  '/warmup',
  { schema: { body: { type: 'object', properties: { domains: { type: 'array', items: { type: 'string' }, maxItems: 50 } } } } },
  async (req, reply) => {
    if (TOKEN) {
      const auth = req.headers.authorization || ''
      if (auth !== `Bearer ${TOKEN}`) return reply.code(401).send({ error: 'Unauthorized' })
    }
    const domains: string[] = req.body?.domains ?? []
    const valid = domains.filter(isValidDomain)
    // Fire and forget — don't await so the response returns immediately
    Promise.allSettled(valid.map((d) => scanWithCoalesce(d))).catch(() => {})
    return { queued: valid.length }
  },
)

fastify.get<{ Querystring: { domain?: string } }>(
  '/scan',
  {
    schema: {
      querystring: {
        type: 'object',
        required: ['domain'],
        properties: { domain: { type: 'string', minLength: 3, maxLength: 253 } },
      },
    },
  },
  async (req, reply) => {
    // Auth — require bearer token if configured
    if (TOKEN) {
      const auth = req.headers.authorization || ''
      if (auth !== `Bearer ${TOKEN}`) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
    }

    const domain = (req.query.domain || '').trim().toLowerCase()
    if (!isValidDomain(domain)) {
      return reply.code(400).send({ error: 'Invalid domain format' })
    }

    try {
      const { result, cached } = await scanWithCoalesce(domain)
      reply.header('x-cache', cached ? 'HIT' : 'MISS')
      reply.header('x-scan-duration', String(result.durationMs))
      // Allow CDN / Vercel Edge to cache scan results for 5 min (matches in-process TTL)
      reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
      return result
    } catch (err) {
      req.log.error({ err: err instanceof Error ? err.message : String(err) }, '[scan] failed')
      return reply.code(500).send({ error: 'Scan failed. Please retry.' })
    }
  },
)

/* ─── Bootstrap ─────────────────────────────────────────────── */
const closeGracefully = async (signal: string) => {
  fastify.log.info({ signal }, 'shutting down')
  await fastify.close()
  process.exit(0)
}
process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

try {
  await fastify.listen({ port: PORT, host: HOST })
  fastify.log.info(
    { port: PORT, authRequired: Boolean(TOKEN), cacheTtlMs: CACHE_TTL_MS },
    'inmybox-scanner ready',
  )
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
