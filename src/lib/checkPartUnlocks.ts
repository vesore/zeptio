import { ALL_PARTS, type PartDef } from './seedParts'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UnlockResult {
  newly_unlocked: PartDef[]
}

export async function checkPartUnlocks(
  supabase: SupabaseClient,
  userId: string,
  world: string,
  levelCompleted: number,
  score: number,
): Promise<UnlockResult> {
  const candidates = ALL_PARTS.filter(p => p.world === world)
  if (!candidates.length) return { newly_unlocked: [] }

  const { data: existing } = await supabase
    .from('user_parts')
    .select('part_id')
    .eq('user_id', userId)

  const owned = new Set((existing ?? []).map((r: { part_id: string }) => r.part_id))

  const toUnlock = candidates.filter(p => {
    if (owned.has(p.id)) return false
    if (p.unlockType === 'auto_level') return levelCompleted >= (p.unlockLevel ?? 999)
    if (p.unlockType === 'auto_score100') return score >= 100
    return false
  })

  if (!toUnlock.length) return { newly_unlocked: [] }

  await supabase.from('user_parts').insert(
    toUnlock.map(p => ({
      user_id: userId,
      part_id: p.id,
      equipped: false,
    }))
  )

  return { newly_unlocked: toUnlock }
}
