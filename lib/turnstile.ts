// Cloudflare Turnstile server-side token verification.
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  ok: boolean
  /** True when TURNSTILE_SECRET_KEY is unset — local dev / staging without the widget. */
  skipped?: boolean
  errorCodes?: string[]
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, skipped: true }

  if (!token || typeof token !== 'string') {
    return { ok: false, errorCodes: ['missing-input-response'] }
  }

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)
  if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] }
    if (data.success) return { ok: true }
    return { ok: false, errorCodes: data['error-codes'] ?? ['unknown'] }
  } catch (e) {
    return { ok: false, errorCodes: ['network-error'] }
  }
}
