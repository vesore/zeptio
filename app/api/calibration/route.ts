import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getStartingLevel(score: number): number {
  if (score < 40) return 1
  if (score < 60) return 2
  if (score < 80) return 4
  return 6
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { scores?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const scores = body.scores
  if (!Array.isArray(scores) || scores.length !== 3 || scores.some(s => typeof s !== 'number')) {
    return NextResponse.json({ error: 'scores must be an array of 3 numbers' }, { status: 400 })
  }

  const avgScore = Math.round((scores as number[]).reduce((a, b) => a + b, 0) / 3)
  const startingLevel = getStartingLevel(avgScore)

  await supabase.from('profiles').upsert(
    { id: user.id, calibration_complete: true, calibration_score: avgScore, starting_level: startingLevel },
    { onConflict: 'id' },
  )

  if (startingLevel > 1) {
    const rows = Array.from({ length: startingLevel - 1 }, (_, i) => ({
      user_id: user.id,
      world: 'clarity',
      level: i + 1,
      level_id: i + 1,
      score: avgScore,
      amount: avgScore,
      xp_earned: avgScore,
    }))
    try {
      await supabase.from('xp_ledger').insert(rows)
    } catch {
      // Non-critical — user can still play
    }
  }

  return NextResponse.json({ calibration_score: avgScore, starting_level: startingLevel })
}
