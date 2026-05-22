import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { rateLimit, getClientIdentifier, __resetRateLimitForTests } from './rate-limit'

beforeEach(() => {
  __resetRateLimitForTests()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('allows the first N requests within the window', () => {
    for (let i = 0; i < 5; i++) {
      const r = rateLimit('ip-a', 5, 60_000)
      expect(r.allowed).toBe(true)
      expect(r.remaining).toBe(5 - 1 - i)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    for (let i = 0; i < 5; i++) rateLimit('ip-b', 5, 60_000)
    const r = rateLimit('ip-b', 5, 60_000)
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it('resets after the window expires', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    for (let i = 0; i < 5; i++) rateLimit('ip-c', 5, 60_000)
    expect(rateLimit('ip-c', 5, 60_000).allowed).toBe(false)

    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'))
    const r = rateLimit('ip-c', 5, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it('isolates counters across different identifiers', () => {
    for (let i = 0; i < 5; i++) rateLimit('ip-x', 5, 60_000)
    expect(rateLimit('ip-x', 5, 60_000).allowed).toBe(false)
    expect(rateLimit('ip-y', 5, 60_000).allowed).toBe(true)
  })

  it('returns the configured limit in the result', () => {
    const r = rateLimit('ip-z', 7, 60_000)
    expect(r.limit).toBe(7)
  })
})

describe('getClientIdentifier', () => {
  const make = (headers: Record<string, string>) =>
    new Request('https://example.com/', { headers })

  it('prefers cf-connecting-ip', () => {
    const id = getClientIdentifier(make({
      'cf-connecting-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2',
    }))
    expect(id).toBe('1.1.1.1')
  })

  it('falls back to first entry in x-forwarded-for', () => {
    const id = getClientIdentifier(make({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' }))
    expect(id).toBe('3.3.3.3')
  })

  it('falls back to x-real-ip', () => {
    const id = getClientIdentifier(make({ 'x-real-ip': '5.5.5.5' }))
    expect(id).toBe('5.5.5.5')
  })

  it('returns "unknown" when no relevant headers are present', () => {
    const id = getClientIdentifier(make({}))
    expect(id).toBe('unknown')
  })
})
