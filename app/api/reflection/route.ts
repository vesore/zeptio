import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { level_id?: unknown; world?: unknown; reflection?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { level_id, world, reflection } = body

  if (typeof level_id !== 'number') {
    return NextResponse.json({ error: 'level_id must be a number' }, { status: 400 })
  }
  if (typeof world !== 'string') {
    return NextResponse.json({ error: 'world must be a string' }, { status: 400 })
  }
  if (typeof reflection !== 'string' || !reflection.trim()) {
    return NextResponse.json({ error: 'reflection must be a non-empty string' }, { status: 400 })
  }

  const { error } = await supabase.from('reflections').insert({
    user_id: user.id,
    level_id,
    world,
    reflection: reflection.trim().slice(0, 100),
  })

  if (error) {
    console.error('[reflection] DB error:', error)
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
