/**
 * Next.js Instrumentation — runs once on server startup.
 * In development, this starts a background polling loop that calls
 * the cron endpoint every 60 seconds to check for due pipelines.
 * In production on Vercel, Vercel Cron handles this instead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const DEV_POLL_INTERVAL = 60_000 // check every 60s in dev

    // Only start background poller in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[instrumentation] Starting background pipeline poller (every 60s)')

      // Delay 10s to let the server finish starting
      setTimeout(() => {
        setInterval(async () => {
          try {
            const port = process.env.PORT || '3000'
            const res = await fetch(`http://localhost:${port}/api/cron/fetch-emails`, {
              method: 'POST',
              headers: { 'x-internal-cron': 'true' },
            })
            const data = await res.json()
            if (data.fetched > 0) {
              console.log(
                `[cron-bg] Fetched for ${data.fetched} pipeline(s), ${data.expired} expired`
              )
            }
          } catch {
            // Server might not be ready yet, ignore
          }
        }, DEV_POLL_INTERVAL)
      }, 10_000)
    }
  }
}
