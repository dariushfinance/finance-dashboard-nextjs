// In-memory dedup for welcome emails. Prevents the abuse pattern where the same
// email address gets multiple welcome emails in quick succession.
//
// In-memory is correct for a single Vercel region (Frankfurt). If we scale to
// multiple regions or use serverless cold starts heavily, move this to Supabase.

const sent = new Map<string, number>()

if (typeof setInterval !== 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  const timer = setInterval(() => {
    const cutoff = Date.now() - 24 * 60 * 60_000
    for (const [k, t] of sent.entries()) if (t < cutoff) sent.delete(k)
  }, 60 * 60_000)
  if (typeof timer === 'object' && timer && 'unref' in timer && typeof (timer as { unref?: () => void }).unref === 'function') {
    ;(timer as { unref: () => void }).unref()
  }
}

export function wasRecentlySent(email: string, windowMs = 24 * 60 * 60_000): boolean {
  const t = sent.get(email)
  if (!t) return false
  return Date.now() - t < windowMs
}

export function markSent(email: string): void {
  sent.set(email, Date.now())
}

export function __resetWelcomeDedupForTests() {
  sent.clear()
}
