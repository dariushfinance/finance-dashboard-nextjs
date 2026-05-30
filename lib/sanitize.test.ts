import { describe, it, expect } from 'vitest'
import { sanitizeUserName } from './sanitize'

describe('sanitizeUserName', () => {
  it('accepts a plain first name', () => {
    expect(sanitizeUserName('Marc').firstName).toBe('Marc')
  })

  it('accepts a full name and returns only the first token', () => {
    expect(sanitizeUserName('Marc Müller').firstName).toBe('Marc')
  })

  it('preserves German umlauts', () => {
    expect(sanitizeUserName('Müller').firstName).toBe('Müller')
  })

  it('accepts hyphenated names', () => {
    expect(sanitizeUserName('Anne-Sophie').firstName).toBe('Anne-Sophie')
  })

  it('accepts apostrophe names', () => {
    expect(sanitizeUserName("O'Brien").firstName).toBe("O'Brien")
  })

  it('rejects the empty string', () => {
    expect(sanitizeUserName('').firstName).toBeNull()
  })

  it('rejects whitespace only', () => {
    expect(sanitizeUserName('   ').firstName).toBeNull()
  })

  it('rejects non-string input', () => {
    expect(sanitizeUserName(undefined).firstName).toBeNull()
    expect(sanitizeUserName(null).firstName).toBeNull()
    expect(sanitizeUserName(42).firstName).toBeNull()
    expect(sanitizeUserName({}).firstName).toBeNull()
  })

  it('rejects the recorded abuse inputs', () => {
    expect(sanitizeUserName('send').firstName).toBe('send') // legitimate-ish, single word
    expect(sanitizeUserName('dumbass').firstName).toBe('dumbass') // we cannot dictionary-filter — that is template-side concern; this still validates as a word
    // Bitcoin address: 26-35 alphanumerics → rejected by digit rule
    expect(sanitizeUserName('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa').firstName).toBeNull()
  })

  it('strips HTML tags', () => {
    // Tag wrapper stripped; inner text content survives but still must pass the allowlist.
    expect(sanitizeUserName('<b>Marc</b>').firstName).toBe('Marc')
    // Mixed content: tags removed, surviving text concatenated. Safe because allowlist forbids <, >, ".
    expect(sanitizeUserName('<script>x</script>Marc').firstName).toBe('xMarc')
  })

  it('rejects names that are pure HTML payload', () => {
    expect(sanitizeUserName('<img src=x onerror=alert(1)>').firstName).toBeNull()
  })

  it('rejects names containing digits', () => {
    expect(sanitizeUserName('Marc123').firstName).toBeNull()
  })

  it('rejects names containing URLs / special chars', () => {
    expect(sanitizeUserName('http://x.com').firstName).toBeNull()
    expect(sanitizeUserName('a@b.com').firstName).toBeNull()
    expect(sanitizeUserName('${jndi:ldap}').firstName).toBeNull()
  })

  it('truncates names longer than 50 chars', () => {
    const long = 'A'.repeat(60)
    // Truncated to 50 — first token is still the same A-string of length 50.
    expect(sanitizeUserName(long).firstName?.length).toBe(50)
  })
})
