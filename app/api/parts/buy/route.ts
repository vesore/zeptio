import { createClient } from '@/src/lib/supabase/server'
import { PART_BY_ID } from '@/src/lib/seedParts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { part_id?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { part_id } = body
  if (typeof part_id !== 'string') {
    return NextResponse.json({ error: 'part_id required' }, { status: 400 })
  }

  const part = PART_BY_ID[part_id]
  if (!part || part.unlockType !== 'buy') {
    return NextResponse.json({ error: 'Part not buyable' }, { status: 400 })
  }

  // Check not already owned
  const { data: existing } = await supabase
    .from('user_parts')
    .select('id')
    .eq('user_id', user.id)
    .eq('part_id', part_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already owned' }, { status: 409 })

  // Check balance
  const { data: wp } = await supabase
    .from('world_points')
    .select('points')
    .eq('user_id', user.id)
    .eq('world', part.world)
    .maybeSingle()

  const balance = wp?.points ?? 0
  if (balance < (part.cost ?? 0)) {
    return NextResponse.json({ error: 'Insufficient points', balance }, { status: 402 })
  }

  // Deduct points and grant part
  await Promise.all([
    supabase.from('world_points').upsert(
      { user_id: user.id, world: part.world, points: balance - (part.cost ?? 0) },
      { onConflict: 'user_id,world' }
    ),
    supabase.from('user_parts').insert({
      user_id: user.id,
      part_id,
      equipped: false,
    }),
  ])

  return NextResponse.json({
    success: true,
    new_balance: balance - (part.cost ?? 0),
  })
}
