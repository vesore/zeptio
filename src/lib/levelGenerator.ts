import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { GameType } from './gameRandomizer'

export interface GeneratedChoice {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface GeneratedLevel {
  goal: string
  wordLimit: number
  gameType: GameType
  keyRule: string
  criteria: string[]
  fragments?: string[]
  choices?: GeneratedChoice[]
  isFirstVisit: boolean
}

// Level IDs for infinite levels per world (avoids collision with hand-crafted IDs 1-50)
const INFINITE_WORLD_BASE: Record<string, number> = {
  clarity: 10000, constraints: 20000, structure: 30000, debug: 40000, mastery: 50000,
}

export function getInfiniteLevelId(world: string, levelNumber: number): number {
  return (INFINITE_WORLD_BASE[world] ?? 10000) + levelNumber
}

const WORLD_SYSTEM_PROMPTS: Record<string, string> = {
  clarity:     'Generate challenges that teach writing clear, specific, unambiguous prompts. Focus on eliminating vagueness, specifying audience, defining output format, and providing useful context.',
  constraints: 'Generate challenges that teach working within strict limits. Focus on brevity, word limits, format restrictions, and doing more with less.',
  structure:   'Generate challenges that teach controlling output format and organization. Focus on tables, numbered steps, JSON, before/after comparisons, and specific structural templates.',
  debug:       'Generate challenges that teach identifying and fixing flawed or weak prompts. Focus on ambiguity, missing context, contradictions, and bias in prompt writing.',
  mastery:     'Generate challenges that combine all four skills: clarity, constraints, structure, and debugging simultaneously. These should be demanding and nuanced real-world scenarios.',
}

export const WORLD_GAME_POOLS: Record<string, GameType[]> = {
  clarity:     ['WordBudget', 'FillInTheBlank', 'RewriteChallenge', 'AudienceSwap', 'Reorder', 'MultipleChoice'],
  constraints: ['TheShrink', 'SpeedRound', 'ToneTranslator', 'WordBudget', 'Reorder', 'MultipleChoice'],
  structure:   ['FormatMaster', 'FillInTheBlank', 'ChainPrompting', 'RoleAssignment', 'Reorder', 'MultipleChoice'],
  debug:       ['SpotTheFlaw', 'PromptDetective', 'RewriteChallenge', 'HeadToHead', 'Reorder', 'MultipleChoice'],
  mastery:     [
    'WordBudget', 'FillInTheBlank', 'RewriteChallenge', 'AudienceSwap',
    'TheShrink', 'SpeedRound', 'ToneTranslator', 'PromptDetective',
    'FormatMaster', 'RoleAssignment', 'HeadToHead', 'ChainPrompting',
    'SpotTheFlaw', 'Reorder', 'MultipleChoice',
  ],
}

function getDifficulty(levelNumber: number): string {
  if (levelNumber <= 25) return 'intermediate — clear structure required, moderate constraints'
  if (levelNumber <= 50) return 'advanced — multiple constraints simultaneously, specific format required'
  if (levelNumber <= 100) return 'expert — strict word limits, complex multi-part scenarios'
  return 'master — near-impossible constraints, maximum precision required'
}

function getWordLimit(levelNumber: number): number {
  const [min, max] =
    levelNumber <= 25  ? [20, 40] :
    levelNumber <= 50  ? [15, 35] :
    levelNumber <= 100 ? [10, 30] :
                         [8,  25]
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pickGameType(
  world: string,
  preferred: GameType | null,
  recent: GameType[],
): GameType {
  if (preferred) return preferred
  const pool = WORLD_GAME_POOLS[world] ?? WORLD_GAME_POOLS.clarity
  const available = pool.filter(g => !recent.slice(0, 2).includes(g))
  const candidates = available.length > 0 ? available : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function generateLevelContent(
  world: string,
  levelNumber: number,
  gameType: GameType,
  wordLimit: number,
): Promise<Pick<GeneratedLevel, 'goal' | 'keyRule' | 'criteria' | 'fragments' | 'choices'>> {
  const difficulty = getDifficulty(levelNumber)
  const worldPrompt = WORLD_SYSTEM_PROMPTS[world] ?? WORLD_SYSTEM_PROMPTS.clarity
  const needsFragments = gameType === 'Reorder'
  const needsChoices = gameType === 'MultipleChoice'

  const system = `You are a level designer for Zeptio, a game that teaches AI prompt engineering.
${worldPrompt}

Generate a level for the ${world} world at level ${levelNumber}.
Difficulty: ${difficulty}
Game type: ${gameType}
Word limit for player responses: ${wordLimit} words

Return ONLY a valid JSON object with exactly these fields:
- "goal": string — the challenge description (1-2 sentences explaining what the player must write a prompt for)
- "keyRule": string — a short memorable lesson this level teaches (max 8 words, no quotes)
- "criteria": array of 3-4 strings — specific scoring criteria${needsFragments ? `
- "fragments": array of exactly 5-6 strings — sentence fragments that, when arranged in the CORRECT order shown here, form an ideal prompt for this goal. The player must figure out the correct order.` : ''}${needsChoices ? `
- "choices": array of 4 objects with "id" (A/B/C/D) and "text" — prompt options. Option A should be the strongest prompt. B, C, D should be plausible but have distinct flaws: too vague, wrong format/approach, or missing critical context.` : ''}

Make challenges creative, practical, and grounded in real-world AI use cases.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: `Generate level ${levelNumber} for the ${world} world.` }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('Level generator returned no text')

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Level generator returned no JSON')

  const parsed = JSON.parse(jsonMatch[0]) as {
    goal: string
    keyRule: string
    criteria: string[]
    fragments?: string[]
    choices?: GeneratedChoice[]
  }

  return {
    goal: parsed.goal,
    keyRule: parsed.keyRule,
    criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
    fragments: needsFragments ? (parsed.fragments ?? undefined) : undefined,
    choices:   needsChoices   ? (parsed.choices   ?? undefined) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOrGenerateLevel(
  userId: string,
  world: string,
  levelId: number,
  levelNumber: number,
  preferred: GameType | null,
  supabase: any,
): Promise<GeneratedLevel> {
  // Try to load from cache
  try {
    const { data: existing } = await supabase
      .from('game_assignments')
      .select('game_type, generated_goal, generated_word_limit, generated_key_rule, generated_criteria, generated_fragments, generated_choices')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle()

    if (existing?.generated_goal && existing.generated_word_limit) {
      return {
        goal:      existing.generated_goal as string,
        wordLimit: existing.generated_word_limit as number,
        gameType:  existing.game_type as GameType,
        keyRule:   (existing.generated_key_rule as string) ?? 'Think carefully about your prompt.',
        criteria:  (existing.generated_criteria as string[]) ?? [],
        fragments: existing.generated_fragments as string[] | undefined,
        choices:   existing.generated_choices as GeneratedChoice[] | undefined,
        isFirstVisit: false,
      }
    }
  } catch {
    // game_assignments missing new columns — fall through to generation
  }

  // Generate fresh
  const gameType = pickGameType(world, preferred, [])
  const wordLimit = getWordLimit(levelNumber)
  const content = await generateLevelContent(world, levelNumber, gameType, wordLimit)

  // Cache in game_assignments (silently ignore if columns don't exist)
  try {
    await supabase.from('game_assignments').upsert({
      user_id:               userId,
      level_id:              levelId,
      game_type:             gameType,
      generated_goal:        content.goal,
      generated_word_limit:  wordLimit,
      generated_key_rule:    content.keyRule,
      generated_criteria:    content.criteria,
      generated_fragments:   content.fragments ?? null,
      generated_choices:     content.choices ?? null,
    }, { onConflict: 'user_id,level_id' })
  } catch {
    // Non-critical — player gets fresh content on retry
  }

  return { ...content, wordLimit, gameType, isFirstVisit: true }
}
