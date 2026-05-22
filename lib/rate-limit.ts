interface RateLimitRecord {
  count: number
  resetAt: number
}

const attempts = new Map<string, RateLimitRecord>()

// Periodic cleanup prevents unbounded growth under sustained traffic with rotating IPs.
// Guarded so test suites and edge runtimes don't leak a timer.
if (typeof setInterval !== 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of attempts.entries()) {
      if (record.resetAt < now) attempts.delete(key)
    }
  }, 5 * 60 * 1000)
  if (typeof timer === 'object' && timer && 'unref' in timer && typeof (timer as { unref?: () => void }).unref === 'function') {
    ;(timer as { unref: () => void }).unref()
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function rateLimit(
  identifier: string,
  max = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record || record.resetAt < now) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs, limit: max }
  }

  if (record.count >= max) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt, limit: max }
  }

  record.count++
  return { allowed: true, remaining: max - record.count, resetAt: record.resetAt, limit: max }
}

export function getClientIdentifier(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const real = req.headers.get('x-real-ip')
  if (real) return real

  return 'unknown'
}

export function rateLimitResponse(result: RateLimitResult, message = 'Too many attempts. Try again later.') {
  return new Response(
    JSON.stringify({ error: message, resetAt: result.resetAt }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  )
}

// Test-only helper. Exported under a name that signals intent.
export function __resetRateLimitForTests() {
  attempts.clear()
}
