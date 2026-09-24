import { createClient } from '@/src/lib/supabase/server'
import { scoreResponse, MAX_USER_PROMPT_CHARS } from '@/src/lib/scoring/engine'
import { resolveLevelConfig } from '@/src/lib/scoring/levelConfig'
import { applyGameContext, parseGameContext } from '@/src/lib/scoring/gameContext'
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

  // Parse and validate body. The level's challenge and criteria are looked up
  // server-side from level_id — never taken from the client.
  let body: { user_prompt?: unknown; level_id?: unknown; game_context?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_prompt, level_id } = body

  if (typeof user_prompt !== 'string' || !user_prompt.trim()) {
    return NextResponse.json({ error: 'user_prompt must be a non-empty string' }, { status: 400 })
  }
  if (user_prompt.length > MAX_USER_PROMPT_CHARS) {
    return NextResponse.json({ error: `user_prompt must be at most ${MAX_USER_PROMPT_CHARS} characters` }, { status: 400 })
  }
  if (typeof level_id !== 'number' || !Number.isInteger(level_id)) {
    return NextResponse.json({ error: 'level_id must be an integer' }, { status: 400 })
  }

  const gameContext = parseGameContext(body.game_context)
  if (gameContext === null) {
    return NextResponse.json({ error: 'Invalid game_context' }, { status: 400 })
  }

  // Call the scoring engine
  try {
    const baseConfig = await resolveLevelConfig(supabase, user.id, level_id)
    if (!baseConfig) {
      return NextResponse.json({ error: 'Unknown level' }, { status: 404 })
    }
    const { config: levelConfig, priorSteps } = applyGameContext(baseConfig, gameContext)

    const result = await scoreResponse(user_prompt, levelConfig, priorSteps)

    // Double XP for Mastery world
    if (levelConfig.world === 'mastery') {
      result.xp_earned = result.score * 2
    }

    // Persist XP and update streak — non-blocking; never fail the score response
    const { world, level } = levelConfig
    const todayUTC = new Date().toISOString().split('T')[0]

    try {
      const resolvedLevelId = level_id

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
    console.error('[score] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
