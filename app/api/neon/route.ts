import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServerClient } from '@/lib/supabase'

// POST /api/neon — insert one Neon Bank transaction row
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, amount, original_amount, exchange_rate, description, subject, category, tags, wise, spaces } = body

  if (!date || amount === undefined)
    return NextResponse.json({ error: 'date and amount are required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('neon_transactions')
    .insert({
      user_id:         user.id,
      date:            String(date),
      amount:          String(amount),
      original_amount: String(original_amount ?? ''),
      exchange_rate:   String(exchange_rate ?? ''),
      description:     String(description ?? ''),
      subject:         String(subject ?? ''),
      category:        String(category ?? ''),
      tags:            String(tags ?? ''),
      wise:            String(wise ?? '').toLowerCase() === 'true',
      spaces:          String(spaces ?? ''),
    })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// GET /api/neon — fetch the authenticated user's Neon transactions
export async function GET(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('neon_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
