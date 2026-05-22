import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'
import { rateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate-limit: 3 welcome emails per IP per 10 minutes
  const rl = rateLimit(`welcome:${getClientIdentifier(req)}`, 3, 10 * 60_000)
  if (!rl.allowed) return rateLimitResponse(rl, 'Too many requests.')

  let email: string, name: string
  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
    name  = (body.name  ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const firstName = name.split(' ')[0] || 'there'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Welcome to Quantfoli</title>
</head>
<body style="margin:0;padding:0;background:#0f1014;font-family:'Inter',system-ui,sans-serif;color:#e8e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1014;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#161820;border:1px solid rgba(120,130,255,0.12);border-radius:18px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid rgba(120,130,255,0.10);">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;background:linear-gradient(135deg,#6272f8,#7b5ea7);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;font-weight:800;color:#f8f8fc;line-height:40px;">Q</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="font-size:16px;font-weight:700;color:#f8f8fc;letter-spacing:-0.02em;">Quantfoli</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f8f8fc;letter-spacing:-0.025em;line-height:1.3;">
              Welcome, ${firstName}.
            </p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#9098b8;">
              Your account is set up. Once you confirm your email, you can import your first portfolio — ZKB, Yuh, or Neon CSV — and see your Sharpe ratio, efficient frontier, and stress-test results in under a minute.
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#9098b8;">
              The free tier is permanent, not a trial. No credit card required.
            </p>

            <!-- CTA -->
            <a href="https://quantfoli.com"
               style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#6272f8,#7b5ea7);color:#f8f8fc;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">
              Open Quantfoli →
            </a>
          </td>
        </tr>

        <!-- Three steps -->
        <tr>
          <td style="padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(120,130,255,0.10);padding-top:24px;">
              <tr>
                <td style="padding:0 0 12px;">
                  <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#4a5280;">Getting started</span>
                </td>
              </tr>
              ${[
                ['01', 'Confirm your email', 'Click the link Supabase just sent you.'],
                ['02', 'Import your positions', 'Export a CSV from ZKB, Yuh, or Neon and upload it.'],
                ['03', 'See the math', 'Sharpe, efficient frontier, and four crisis stress tests — on your actual book.'],
              ].map(([n, t, d]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(120,130,255,0.07);">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;padding-top:2px;">
                        <span style="font-family:monospace;font-size:10px;color:#4a5280;font-weight:700;">${n}</span>
                      </td>
                      <td>
                        <div style="font-size:13px;font-weight:600;color:#c8cce8;margin-bottom:2px;">${t}</div>
                        <div style="font-size:12px;color:#6870a0;line-height:1.5;">${d}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(120,130,255,0.10);background:#0f1014;">
            <p style="margin:0;font-size:11px;color:#3a4060;line-height:1.6;">
              Quantfoli · Dariush Tahajomi, Einzelunternehmen, Schaffhausen, Switzerland<br/>
              Not investment advice. Past performance does not predict future results.<br/>
              <a href="https://quantfoli.com/privacy" style="color:#4a5280;text-decoration:none;">Privacy</a> ·
              <a href="https://quantfoli.com/terms"   style="color:#4a5280;text-decoration:none;">Terms</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Quantfoli',
    html,
    text: `Welcome to Quantfoli, ${firstName}.\n\nYour account is set up. Confirm your email, then import your first portfolio at https://quantfoli.com.\n\nNot investment advice.`,
  })

  if (!result.ok) {
    // Non-fatal — signup already succeeded, don't surface this to the user
    console.error('[welcome] email failed:', result.error)
  }

  return NextResponse.json({ ok: true })
}
