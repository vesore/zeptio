import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getHandCraftedLevelConfig, getInfiniteLevelWorld, resolveLevelConfig } from './levelConfig'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS } from '@/src/lib/game/debug-levels'
import { MASTERY_LEVELS } from '@/src/lib/game/mastery-levels'
import { fakeSupabase } from '@/test/fakeSupabase'

const asClient = (c: unknown) => c as SupabaseClient

describe('getHandCraftedLevelConfig', () => {
  it('maps every hand-crafted level to its world', () => {
    const worlds = [
      ['clarity', CLARITY_LEVELS],
      ['constraints', CONSTRAINTS_LEVELS],
      ['structure', STRUCTURE_LEVELS],
      ['debug', DEBUG_LEVELS],
      ['mastery', MASTERY_LEVELS],
    ] as const
    for (const [world, levels] of worlds) {
      for (const level of levels) {
        expect(getHandCraftedLevelConfig(level.id)).toEqual({
          world, level: level.id, challenge: level.goal, criteria: level.criteria, max_xp: level.max_xp,
        })
      }
    }
  })

  it('has no ID collisions across worlds', () => {
    const ids = [CLARITY_LEVELS, CONSTRAINTS_LEVELS, STRUCTURE_LEVELS, DEBUG_LEVELS, MASTERY_LEVELS].flat().map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns null for unknown IDs', () => {
    expect(getHandCraftedLevelConfig(0)).toBeNull()
    expect(getHandCraftedLevelConfig(999)).toBeNull()
  })
})

describe('getInfiniteLevelWorld', () => {
  it('decodes infinite level IDs', () => {
    expect(getInfiniteLevelWorld(10011)).toBe('clarity')
    expect(getInfiniteLevelWorld(20011)).toBe('constraints')
    expect(getInfiniteLevelWorld(50099)).toBe('mastery')
  })

  it('rejects IDs that are not infinite levels', () => {
    expect(getInfiniteLevelWorld(10000)).toBeNull()
    expect(getInfiniteLevelWorld(5)).toBeNull()
    expect(getInfiniteLevelWorld(60001)).toBeNull()
  })
})

describe('resolveLevelConfig', () => {
  it('resolves hand-crafted levels without a DB call', async () => {
    const { client } = fakeSupabase()
    const config = await resolveLevelConfig(asClient(client), 'user-1', 1)
    expect(config?.world).toBe('clarity')
    expect(config?.challenge).toBe(CLARITY_LEVELS[0].goal)
  })

  it('resolves infinite levels from the user\'s cached generation', async () => {
    const { client } = fakeSupabase({
      tables: {
        game_assignments: [
          { user_id: 'user-1', level_id: 30012, generated_goal: 'Make a table', generated_criteria: ['Uses a table'] },
          { user_id: 'user-2', level_id: 30012, generated_goal: 'Someone else', generated_criteria: [] },
        ],
      },
    })
    expect(await resolveLevelConfig(asClient(client), 'user-1', 30012)).toEqual({
      world: 'structure', level: 30012, challenge: 'Make a table', criteria: ['Uses a table'], max_xp: 100,
    })
  })

  it('returns null for levels that were never generated for this user', async () => {
    const { client } = fakeSupabase({
      tables: { game_assignments: [{ user_id: 'user-2', level_id: 10011, generated_goal: 'x', generated_criteria: [] }] },
    })
    expect(await resolveLevelConfig(asClient(client), 'user-1', 10011)).toBeNull()
  })

  it('returns null for invalid IDs', async () => {
    const { client } = fakeSupabase()
    expect(await resolveLevelConfig(asClient(client), 'user-1', 0)).toBeNull()
    expect(await resolveLevelConfig(asClient(client), 'user-1', -3)).toBeNull()
    expect(await resolveLevelConfig(asClient(client), 'user-1', 999)).toBeNull()
  })
})
