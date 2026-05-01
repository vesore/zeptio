import { createClient } from '@/src/lib/supabase/server'
import { scoreResponse, type LevelConfig } from '@/src/lib/scoring/engine'
import { checkPartUnlocks } from '@/src/lib/checkPartUnlocks'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  // Validate auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate body
  let body: { user_prompt?: unknown; level_config?: unknown; level_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_prompt, level_config, level_id } = body

  if (typeof user_prompt !== 'string' || !user_prompt.trim()) {
    return NextResponse.json({ error: 'user_prompt must be a non-empty string' }, { status: 400 })
  }

  if (!level_config || typeof level_config !== 'object') {
    return NextResponse.json({ error: 'level_config must be an object' }, { status: 400 })
  }

  // Call the scoring engine
  try {
    const result = await scoreResponse(user_prompt, level_config as LevelConfig)

    // Double XP for Mastery world
    if ((level_config as LevelConfig).world === 'mastery') {
      result.xp_earned = result.score * 2
    }

    // Persist XP and update streak — non-blocking; never fail the score response
    const { world, level } = level_config as LevelConfig
    const todayUTC = new Date().toISOString().split('T')[0]

    try {
      const resolvedLevelId = typeof level_id === 'number' ? level_id : level

      // level_id 0 = calibration scoring — skip XP/streak persistence
      if (resolvedLevelId === 0) return NextResponse.json(result)

      const [{ data: existingRows }, { data: existing }] = await Promise.all([
        supabase
          .from('xp_ledger')
          .select('amount')
          .eq('user_id', user.id)
          .eq('level_id', resolvedLevelId),
        supabase
          .from('streaks')
          .select('current_streak, last_activity_date')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      const existingMax = existingRows && existingRows.length > 0
        ? Math.max(...existingRows.map((r) => r.amount ?? 0))
        : null

      console.log('[score] existing max:', existingMax, '| new score:', result.score)

      if (existingMax === null || result.score > existingMax) {
        await supabase.from('xp_ledger').insert({
          user_id: user.id,
          xp_earned: result.xp_earned,
          score: result.score,
          amount: result.score,
          world,
          level,
          level_id: resolvedLevelId,
        })
      }

      // Accumulate world points (always, not just on best score)
      try {
        const { data: wp } = await supabase
          .from('world_points')
          .select('points')
          .eq('user_id', user.id)
          .eq('world', world)
          .maybeSingle()
        await supabase.from('world_points').upsert(
          { user_id: user.id, world, points: (wp?.points ?? 0) + result.score },
          { onConflict: 'user_id,world' }
        )
      } catch { /* non-critical */ }

      // Check part unlocks
      const { newly_unlocked } = await checkPartUnlocks(
        supabase, user.id, world, resolvedLevelId, result.score
      ).catch(() => ({ newly_unlocked: [] }));
      (result as typeof result & { newly_unlocked_parts: string[] }).newly_unlocked_parts =
        newly_unlocked.map(p => p.id)

      let newStreak = 1
      if (existing?.last_activity_date) {
        if (existing.last_activity_date === todayUTC) {
          newStreak = existing.current_streak // already played today
        } else {
          const yesterday = new Date()
          yesterday.setUTCDate(yesterday.getUTCDate() - 1)
          const yesterdayUTC = yesterday.toISOString().split('T')[0]
          newStreak =
            existing.last_activity_date === yesterdayUTC
              ? existing.current_streak + 1
              : 1
        }
      }

      await supabase.from('streaks').upsert(
        {
          user_id: user.id,
          current_streak: newStreak,
          last_activity_date: todayUTC,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    } catch (dbErr) {
      console.error('[score] Failed to persist XP/streak:', dbErr)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Scoring service misconfigured' }, { status: 500 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Scoring service busy, please retry' }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[score] Anthropic.APIError', error.status, error.message, error.error)
      return NextResponse.json({ error: 'Scoring service error' }, { status: 502 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
