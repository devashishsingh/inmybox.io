/**
 * Smoke test — hit /scan a few times against the running service and
 * print latency + cache behaviour.
 *
 *   npm run smoke -- http://localhost:8080 google.com cloudflare.com github.com
 */
const baseRaw = process.argv[2] || 'http://localhost:8080'
const base = baseRaw.replace(/\/$/, '')
const domains = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['google.com', 'cloudflare.com', 'github.com']

const token = process.env.SCANNER_TOKEN || ''

async function hit(domain: string, label: string) {
  const t0 = Date.now()
  const res = await fetch(`${base}/scan?domain=${encodeURIComponent(domain)}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
  const ms = Date.now() - t0
  const cache = res.headers.get('x-cache') || '-'
  const json = (await res.json()) as { score?: number; durationMs?: number; error?: string }
  const detail = json.error
    ? `ERROR ${json.error}`
    : `score=${json.score} engine=${json.durationMs}ms`
  console.log(`[${label}] ${domain.padEnd(20)} http=${ms}ms cache=${cache.padEnd(4)} ${detail}`)
}

console.log(`Target: ${base}\n`)

for (const d of domains) await hit(d, 'cold')
console.log('--- second pass should be cache HITs ---')
for (const d of domains) await hit(d, 'warm')
