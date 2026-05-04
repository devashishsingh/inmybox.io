# Inmybox Scanner Service

Standalone DNS scanner backend. Stateless. No DB. Designed to be deployed close to your DNS resolvers (Render Oregon/Frankfurt/Singapore) so the Vercel Edge → scanner round-trip is fast even when DKIM fans out 12 selectors in parallel.

## Why a separate service?

The previous `/api/scan` route ran inside Next.js on Vercel. Two issues:

1. **Vercel function cold starts** add 200–800ms before any DNS work begins.
2. **Function timeout** (10s on Hobby) caps DKIM selector exploration.

This service runs hot on a long-lived Render instance with:

- Parallel DNS lookups (DMARC + SPF + DKIM all at once; DKIM internally checks 12 selectors in parallel).
- 5-minute LRU cache (configurable) — repeat scans return in <1ms.
- In-flight de-duplication — concurrent requests for the same domain coalesce into a single DNS scan.
- Bearer-token auth + per-IP rate limit (60 req/min default).

Target p95 < 600ms cold, < 5ms warm.

## Architecture

```
Browser ──> Vercel /api/scan ──> Render scanner ──> 8.8.8.8/1.1.1.1
                  │
                  └──> Postgres (persists scan history)
```

The Next.js route stays the public surface (auth, DB writes, rate-limit telemetry). When `SCANNER_URL` env is set, it delegates the actual DNS work to this service.

## Local dev

```bash
cd scanner-service
npm install
cp .env.example .env
npm run dev
# in another shell
curl 'http://localhost:8080/scan?domain=google.com' | jq .score
npm run smoke   # latency + cache test
```

## Deploy to Render

1. Push this folder to GitHub.
2. In Render: **New → Blueprint → select repo → pick `scanner-service/render.yaml`**.
3. Render generates a random `SCANNER_TOKEN`. Copy it.
4. In Vercel project settings, add two env vars to the Next.js app:
   ```
   SCANNER_URL=https://inmybox-scanner-xxxx.onrender.com
   SCANNER_TOKEN=<the value Render generated>
   ```
5. Redeploy Vercel. `/api/scan` will now proxy to Render.

To roll back, simply remove `SCANNER_URL` — the Next.js route will fall back to its built-in DNS implementation.

## Endpoints

### `GET /healthz`
```json
{ "status": "ok", "uptime": 1234, "cacheSize": 12, "inflight": 0 }
```

### `GET /scan?domain=<domain>`
Headers (when `SCANNER_TOKEN` is set):
```
Authorization: Bearer <SCANNER_TOKEN>
```
Response: full `ScanResult` (matches the existing `/api/scan` payload shape, plus `durationMs`).

Response headers:
```
x-cache: HIT | MISS
```

## Environment variables

| Var | Default | Description |
|---|---|---|
| `PORT` | 8080 | HTTP listen port |
| `HOST` | 0.0.0.0 | Bind host |
| `SCANNER_TOKEN` | _(empty)_ | Required bearer token. Empty = auth disabled (dev only). |
| `CACHE_TTL_MS` | 300000 | Cache TTL per domain |
| `CACHE_MAX` | 1000 | Max cache entries (LRU eviction) |
| `RATE_LIMIT_MAX` | 30 | Max requests per window per IP |
| `RATE_LIMIT_WINDOW` | `1 minute` | Window duration |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `LOG_LEVEL` | `info` | pino log level |

## Multi-instance considerations

The cache is in-process. With Render's Standard plan (multiple instances), each instance has its own cache → up to N× the cache misses. For low traffic this is fine. If/when you scale, swap `cache` in `server.ts` for an Upstash Redis client (REST API works from Render Free).
