import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SUPPORT_TO    = 'dtahajomi2007@gmail.com'
const SUPPORT_FROM  = process.env.RESEND_FROM || 'Quantfoli Support <onboarding@resend.dev>'

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (message.length > 5000 || subject.length > 200 || name.length > 120 || email.length > 200) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY not set — support form submission lost:', { name, email, subject })
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
    }

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px;">
        <h2 style="margin: 0 0 16px;">New Quantfoli support message</h2>
        <p><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
        <p><strong>Subject:</strong> ${escape(subject)}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p style="white-space: pre-wrap;">${escape(message)}</p>
      </div>
    `

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SUPPORT_FROM,
        to: [SUPPORT_TO],
        reply_to: email,
        subject: `[Quantfoli Support] ${subject}`,
        html,
      }),
    })

    if (!r.ok) {
      const text = await r.text()
      console.error('Resend API error:', r.status, text)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Support route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
