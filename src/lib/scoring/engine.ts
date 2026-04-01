import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export interface LevelConfig {
  world: 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'
  level: number
  challenge: string
  criteria: string[]
  max_xp: number
}

export interface ScoreResult {
  score: number      // 0–100
  xp_earned: number
  feedback: string
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function scoreResponse(
  user_prompt: string,
  level_config: LevelConfig,
): Promise<ScoreResult> {
  const systemPrompt = `You are a scoring engine for Zeptio, a game that teaches computational thinking through four worlds: Clarity, Constraints, Structure, and Debug.

Your job is to evaluate a player's response to a challenge and return a JSON object with exactly these fields:
- "score": integer from 0 to 100
- "xp_earned": integer (set this equal to the score)
- "feedback": string (2–4 sentences explaining what worked and what to improve)

Scoring criteria for the ${level_config.world} world:
${level_config.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Be encouraging but honest. Reward clear thinking over perfect answers.`

  const userMessage = `Challenge: ${level_config.challenge}

Player's response: ${user_prompt}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Scoring engine returned no text content')
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Scoring engine response contained no JSON object')
  }

  const parsed = JSON.parse(jsonMatch[0]) as ScoreResult

  // Clamp score and set xp_earned equal to score (1:1)
  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)))
  parsed.xp_earned = parsed.score

  return parsed
}
