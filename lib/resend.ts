const RESEND_API = 'https://api.resend.com/emails'

type SendArgs = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[resend] RESEND_API_KEY not set — email skipped:', { to, subject })
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const from = process.env.RESEND_FROM || 'Quantfoli <onboarding@resend.dev>'

  try {
    const r = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })

    if (!r.ok) {
      const body = await r.text()
      console.error('[resend] API error:', r.status, body)
      return { ok: false, error: `Resend ${r.status}: ${body}` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[resend] Network error:', msg)
    return { ok: false, error: msg }
  }
}
