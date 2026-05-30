// User-supplied display name sanitization for email templates and UI greetings.
// Defends against the welcome-email abuse pattern where attackers submit junk
// values ("dumbass", a Bitcoin address, raw HTML) hoping the template renders them.

const MAX_NAME_LEN = 50

// Letters (incl. extended Latin/German umlauts), spaces, hyphens, apostrophes.
// Digits and symbols are rejected.
const NAME_ALLOWED = /^[\p{L}][\p{L} \-']{0,49}$/u

export interface SanitizedName {
  /** Cleaned first-name for use in greetings, or null if input is junk. */
  firstName: string | null
}

/**
 * Validates and trims a user-supplied name.
 * - Strips HTML tags before validation (defense in depth — templates already escape).
 * - Rejects names containing digits, URLs, or non-letter symbols.
 * - Caps length at 50 chars.
 * - Returns null firstName for empty/invalid input so callers can fall back
 *   to a name-less greeting ("Welcome.") instead of "Welcome, ."
 */
export function sanitizeUserName(input: unknown): SanitizedName {
  if (typeof input !== 'string') return { firstName: null }

  const stripped = input.replace(/<[^>]*>/g, '').trim()
  if (!stripped) return { firstName: null }

  const truncated = stripped.slice(0, MAX_NAME_LEN)
  if (!NAME_ALLOWED.test(truncated)) return { firstName: null }

  const first = truncated.split(/\s+/)[0]
  return { firstName: first }
}
