export type GameType =
  | 'WordBudget'
  | 'FillInTheBlank'
  | 'RewriteChallenge'
  | 'AudienceSwap'
  | 'TheShrink'
  | 'SpeedRound'
  | 'ToneTranslator'
  | 'PromptDetective'
  | 'FormatMaster'
  | 'RoleAssignment'
  | 'HeadToHead'
  | 'ChainPrompting'
  | 'SpotTheFlaw'
  | 'Reorder'
  | 'MultipleChoice'

const WORLD_POOLS: Record<string, GameType[]> = {
  clarity:     ['WordBudget', 'FillInTheBlank', 'RewriteChallenge', 'AudienceSwap'],
  constraints: ['TheShrink', 'SpeedRound', 'ToneTranslator', 'WordBudget'],
  structure:   ['FormatMaster', 'FillInTheBlank', 'ChainPrompting', 'RoleAssignment'],
  debug:       ['SpotTheFlaw', 'PromptDetective', 'RewriteChallenge', 'HeadToHead'],
  mastery:     [
    'WordBudget', 'FillInTheBlank', 'RewriteChallenge', 'AudienceSwap',
    'TheShrink', 'SpeedRound', 'ToneTranslator', 'PromptDetective',
    'FormatMaster', 'RoleAssignment', 'HeadToHead', 'ChainPrompting', 'SpotTheFlaw',
  ],
}

export async function getGameType(
  userId: string,
  world: string,
  levelId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ gameType: GameType; isFirstVisit: boolean }> {
  try {
    const { data: existing } = await supabase
      .from('game_assignments')
      .select('game_type')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle()

    if (existing?.game_type) {
      return { gameType: existing.game_type as GameType, isFirstVisit: false }
    }
  } catch {
    // game_assignments table may not exist yet — fall through to random selection
  }

  const pool = WORLD_POOLS[world] ?? WORLD_POOLS.clarity
  const gameType = pool[Math.floor(Math.random() * pool.length)]

  try {
    await supabase.from('game_assignments').insert({
      user_id: userId,
      level_id: levelId,
      game_type: gameType,
    })
  } catch {
    // Non-critical — user gets re-randomized next visit
  }

  return { gameType, isFirstVisit: true }
}
