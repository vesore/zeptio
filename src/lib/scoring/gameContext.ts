// Game-specific scoring context, shared by the game components (to render the
// options) and /api/score (to build the scoring criteria). The client only sends
// which option the player picked; the server turns that into criteria, so a
// player can never supply their own scoring instructions.

import type { LevelConfig } from './types'

export const AUDIENCES = ['5 year old', 'Business Executive', 'Expert in the field'] as const
export const FORMATS = ['Bullet Points', 'Paragraph', 'Table'] as const
export const TONES = ['Professional', 'Casual', 'Urgent'] as const
export const ROLES = ['Expert', 'Teacher', 'Child', 'CEO', 'Creative'] as const

export const CHAIN_STEP_LABELS = [
  'Set the Context',
  'Define the Format',
  'Add Precision',
] as const

export const CHAIN_STEP_DESCRIPTIONS = [
  'Who needs this, what is the goal, and why does it matter?',
  'How should the response be structured — length, format, tone?',
  'What specific details, constraints, or edge cases are critical?',
]

export const SHRINK_WORD_LIMIT = 10
export const REWRITE_ORIGINAL_SCORE = 30
export const HEAD_TO_HEAD_CORRECT_ANSWER = 'A'

export const MAX_CHAIN_STEP_CHARS = 2000

export type Audience = typeof AUDIENCES[number]
export type Format = typeof FORMATS[number]
export type Tone = typeof TONES[number]
export type Role = typeof ROLES[number]

export type GameContext =
  | { type: 'AudienceSwap'; audience: Audience }
  | { type: 'FormatMaster'; format: Format }
  | { type: 'ToneTranslator'; tone: Tone }
  | { type: 'RoleAssignment'; role: Role }
  | { type: 'ChainPrompting'; step: number; previous: string[] }
  | { type: 'HeadToHead'; selection: 'A' | 'B' }
  | { type: 'TheShrink' }
  | { type: 'RewriteChallenge' }
  | { type: 'SpotTheFlaw' }
  | { type: 'PromptDetective' }

export function makeAIOutput(challenge: string): string {
  const lowerChallenge = challenge.toLowerCase()
  const isAboutWriting = lowerChallenge.includes('write') || lowerChallenge.includes('prompt')
  const isAboutAnalysis = lowerChallenge.includes('analys') || lowerChallenge.includes('evaluat')

  if (isAboutWriting) {
    return `To craft an effective response, begin by identifying the core objective and target audience. Structure your content with a clear opening that states the purpose, followed by specific supporting points that build toward the goal. Use precise language rather than vague qualifiers, and include actionable details that guide implementation. Conclude by confirming the desired outcome or format. This approach ensures clarity, reduces ambiguity, and produces consistently useful results across different contexts and use cases.`
  }
  if (isAboutAnalysis) {
    return `The analysis reveals several key patterns worth examining. First, the primary variable shows a consistent relationship with the outcome measure across all tested conditions. Second, contextual factors account for approximately one-third of the observed variance, suggesting they cannot be ignored in any comprehensive model. Third, the data supports a structured, stepwise approach rather than a holistic one. Recommendations include refining the input parameters, establishing clear success criteria upfront, and building in iterative checkpoints to validate progress against the stated objectives.`
  }
  return `Based on a careful review of the requirements, here is a structured approach to addressing the objective effectively. The key considerations fall into three categories: clarity of purpose, specificity of constraints, and alignment with the desired output format. Each element plays a distinct role in shaping the final result. When the purpose is clearly stated, the model can prioritize relevant information. When constraints are explicit, unnecessary content is filtered out naturally. When the format is defined, the response structure follows without additional guidance. Together, these three factors produce consistently high-quality, actionable results.`
}

function oneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
}

/**
 * Validates an untrusted game_context payload. Returns `undefined` when none was
 * sent, the parsed context when valid, or `null` when it was sent but invalid.
 */
export function parseGameContext(raw: unknown): GameContext | undefined | null {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  switch (r.type) {
    case 'AudienceSwap':
      return oneOf(AUDIENCES, r.audience) ? { type: r.type, audience: r.audience } : null
    case 'FormatMaster':
      return oneOf(FORMATS, r.format) ? { type: r.type, format: r.format } : null
    case 'ToneTranslator':
      return oneOf(TONES, r.tone) ? { type: r.type, tone: r.tone } : null
    case 'RoleAssignment':
      return oneOf(ROLES, r.role) ? { type: r.type, role: r.role } : null
    case 'HeadToHead':
      return r.selection === 'A' || r.selection === 'B' ? { type: r.type, selection: r.selection } : null
    case 'ChainPrompting': {
      const { step, previous } = r
      if (typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step >= CHAIN_STEP_LABELS.length) return null
      if (!Array.isArray(previous) || previous.length !== step) return null
      if (!previous.every(p => typeof p === 'string' && p.length <= MAX_CHAIN_STEP_CHARS)) return null
      return { type: r.type, step, previous: previous as string[] }
    }
    case 'TheShrink':
    case 'RewriteChallenge':
    case 'SpotTheFlaw':
    case 'PromptDetective':
      return { type: r.type }
    default:
      return null
  }
}

export interface ScoringInput {
  config: LevelConfig
  /** Earlier player-written chain steps — untrusted, kept out of the criteria. */
  priorSteps: string[]
}

export function applyGameContext(base: LevelConfig, ctx: GameContext | undefined): ScoringInput {
  const extend = (challengeSuffix: string, criteria: string[]): ScoringInput => ({
    config: {
      ...base,
      challenge: base.challenge + challengeSuffix,
      criteria: [...base.criteria, ...criteria],
    },
    priorSteps: [],
  })

  if (!ctx) return { config: base, priorSteps: [] }

  switch (ctx.type) {
    case 'AudienceSwap':
      return extend(`\n\nTarget audience: ${ctx.audience}`, [`Prompt must be clearly tailored for a ${ctx.audience}`])
    case 'FormatMaster':
      return extend(`\n\nRequired output format: ${ctx.format}`, [`The prompt must explicitly request ${ctx.format.toLowerCase()} format`])
    case 'ToneTranslator':
      return extend(`\n\nRequired tone: ${ctx.tone}`, [`The prompt must clearly convey a ${ctx.tone.toLowerCase()} tone`])
    case 'RoleAssignment':
      return extend(`\n\nAssigned AI role: ${ctx.role}`, [`Prompt must assign the role "${ctx.role}" to the AI clearly`])
    case 'TheShrink':
      return extend(
        `\n\nConstraint: Rewrite in ${SHRINK_WORD_LIMIT} words or fewer without losing the core meaning.`,
        [`Prompt must be ${SHRINK_WORD_LIMIT} words or fewer`, 'Must preserve the core meaning of the original'],
      )
    case 'RewriteChallenge':
      return extend('', [`Score must beat the original weak prompt score of ${REWRITE_ORIGINAL_SCORE}`])
    case 'SpotTheFlaw':
      return extend('', [
        'Correctly identifies multiple specific prompt flaws',
        'Corrected version fixes all identified flaws',
        'Rewrite is clear, specific, and actionable',
      ])
    case 'HeadToHead':
      return extend('', [
        ctx.selection === HEAD_TO_HEAD_CORRECT_ANSWER
          ? 'Correctly identified the stronger prompt'
          : 'Incorrectly identified which prompt is stronger — partial credit only',
        'Explanation shows understanding of what makes prompts effective',
        'Improved version is meaningfully better than the weak original',
      ])
    case 'PromptDetective':
      return extend(
        `\n\nContext: The user is reverse-engineering a prompt that produced the following AI output. Their goal is to reconstruct the original prompt as closely as possible.\n\nAI Output to reverse-engineer:\n${makeAIOutput(base.challenge)}`,
        ['Reconstructed prompt should logically produce the given AI output', 'Prompt should capture the topic, format, and intent of the output'],
      )
    case 'ChainPrompting': {
      const label = CHAIN_STEP_LABELS[ctx.step]
      const description = CHAIN_STEP_DESCRIPTIONS[ctx.step]
      return {
        ...extend(
          `\n\nChain step ${ctx.step + 1} of ${CHAIN_STEP_LABELS.length} — ${label}: ${description}`,
          [`This is chain step ${ctx.step + 1}: ${label}`, description],
        ),
        priorSteps: ctx.previous,
      }
    }
  }
}
