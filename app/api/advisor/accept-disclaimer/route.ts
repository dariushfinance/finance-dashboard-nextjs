import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import { ADVISOR_TERMS_VERSION } from '@/app/advisor-legal/page'

// Records that a user has accepted the Advisor Terms.
// Civil-liability audit trail: stores (user_id, accepted_at, terms_version, ip, user_agent).
// The Advisor checkout endpoint refuses to proceed without a row for the current user.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const userAgent = req.headers.get('user-agent') ?? null

    const db = createServerClient()
    const { error } = await db.from('advisor_disclaimers').insert({
      user_id:       user.id,
      terms_version: ADVISOR_TERMS_VERSION,
      ip_address:    ip,
      user_agent:    userAgent,
    })

    if (error) {
      console.error('[advisor/accept-disclaimer] insert failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, version: ADVISOR_TERMS_VERSION })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[advisor/accept-disclaimer]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
