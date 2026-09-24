export type World = 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'

export const WORLDS: readonly World[] = ['clarity', 'constraints', 'structure', 'debug', 'mastery']

export interface LevelConfig {
  world: World
  level: number
  challenge: string
  criteria: string[]
  max_xp: number
}

export interface ScoreResult {
  score: number      // 0–100
  xp_earned: number
  feedback: string
  ideal_prompt: string
}
