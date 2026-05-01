import { createClient } from '@/src/lib/supabase/server'
import { PART_BY_ID } from '@/src/lib/seedParts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { part_id?: unknown; equipped?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { part_id, equipped } = body
  if (typeof part_id !== 'string') {
    return NextResponse.json({ error: 'part_id required' }, { status: 400 })
  }
  if (typeof equipped !== 'boolean') {
    return NextResponse.json({ error: 'equipped (boolean) required' }, { status: 400 })
  }

  const part = PART_BY_ID[part_id]
  if (!part) return NextResponse.json({ error: 'Unknown part' }, { status: 404 })

  // Must own the part
  const { data: owned } = await supabase
    .from('user_parts')
    .select('id')
    .eq('user_id', user.id)
    .eq('part_id', part_id)
    .maybeSingle()

  if (!owned) return NextResponse.json({ error: 'Part not owned' }, { status: 403 })

  await supabase
    .from('user_parts')
    .update({ equipped })
    .eq('user_id', user.id)
    .eq('part_id', part_id)

  return NextResponse.json({ success: true })
}
