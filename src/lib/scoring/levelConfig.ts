import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS } from '@/src/lib/game/debug-levels'
import { MASTERY_LEVELS } from '@/src/lib/game/mastery-levels'
import { WORLDS, type LevelConfig, type World } from './types'

// Level IDs for infinite levels per world (avoids collision with hand-crafted IDs 1-50)
export const INFINITE_WORLD_BASE: Record<World, number> = {
  clarity: 10000, constraints: 20000, structure: 30000, debug: 40000, mastery: 50000,
}

const HAND_CRAFTED: Array<{ world: World; levels: Array<{ id: number; goal: string; criteria: string[]; max_xp: number }> }> = [
  { world: 'clarity', levels: CLARITY_LEVELS },
  { world: 'constraints', levels: CONSTRAINTS_LEVELS },
  { world: 'structure', levels: STRUCTURE_LEVELS },
  { world: 'debug', levels: DEBUG_LEVELS },
  { world: 'mastery', levels: MASTERY_LEVELS },
]

export function getHandCraftedLevelConfig(levelId: number): LevelConfig | null {
  for (const { world, levels } of HAND_CRAFTED) {
    const level = levels.find(l => l.id === levelId)
    if (level) {
      return { world, level: level.id, challenge: level.goal, criteria: level.criteria, max_xp: level.max_xp }
    }
  }
  return null
}

/** Maps an infinite level ID (e.g. 20007) back to its world, or null if it isn't one. */
export function getInfiniteLevelWorld(levelId: number): World | null {
  for (const world of WORLDS) {
    const base = INFINITE_WORLD_BASE[world]
    if (levelId > base && levelId < base + 10000) return world
  }
  return null
}

/**
 * Builds the scoring config for a level from trusted sources only: the
 * hand-crafted level files, or the generated level cached for this user.
 * Returns null when the level doesn't exist (or hasn't been generated yet).
 */
export async function resolveLevelConfig(
  supabase: SupabaseClient,
  userId: string,
  levelId: number,
): Promise<LevelConfig | null> {
  if (!Number.isInteger(levelId) || levelId < 1) return null

  const handCrafted = getHandCraftedLevelConfig(levelId)
  if (handCrafted) return handCrafted

  const world = getInfiniteLevelWorld(levelId)
  if (!world) return null

  const { data, error } = await supabase
    .from('game_assignments')
    .select('generated_goal, generated_criteria')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load generated level ${levelId}: ${error.message}`)
  if (!data?.generated_goal) return null

  return {
    world,
    level: levelId,
    challenge: data.generated_goal as string,
    criteria: Array.isArray(data.generated_criteria) ? (data.generated_criteria as string[]) : [],
    max_xp: 100,
  }
}
