import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { world?: unknown; preferred?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { world, preferred } = body
  if (typeof world !== 'string') {
    return NextResponse.json({ error: 'world must be a string' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('game_preferences')
    .eq('id', user.id)
    .maybeSingle()

  const prefs = (existing?.game_preferences as Record<string, string | null> | null) ?? {}
  if (preferred === null || preferred === undefined) {
    delete prefs[world]
  } else {
    prefs[world] = preferred as string
  }

  await supabase
    .from('profiles')
    .upsert({ id: user.id, game_preferences: prefs }, { onConflict: 'id' })

  return NextResponse.json({ ok: true })
}
