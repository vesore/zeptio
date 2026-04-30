import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType, type GameType } from '@/src/lib/gameRandomizer'
import { getOrGenerateLevel, getInfiniteLevelId } from '@/src/lib/levelGenerator'

const CLARITY_KEY_RULES = [
  'Clear prompts get clear answers.',
  'Specificity is kindness to the AI.',
  'Know your audience before you write.',
  'Context changes everything.',
  'Details unlock better outputs.',
  'Preparation beats improvisation.',
  'Constraints define the solution.',
  'Precision is a skill, not an accident.',
  'Simple language travels further.',
  'Mastery is clarity under pressure.',
]

interface Props {
  params: Promise<{ level: string }>
}

function avgRange(bestScores: Map<number, number>, fromId: number, toId: number): number {
  let sum = 0
  const count = toId - fromId + 1
  for (let id = fromId; id <= toId; id++) sum += bestScores.get(id) ?? 0
  return sum / count
}

function isLevelUnlocked(levelId: number, bestScores: Map<number, number>): boolean {
  if (levelId === 1) return true
  const prevScore = bestScores.get(levelId - 1) ?? 0
  if (prevScore < 60) return false
  if (levelId >= 6 && levelId <= 8) return avgRange(bestScores, 1, 5) >= 70
  if (levelId >= 9) return avgRange(bestScores, 1, 8) >= 80
  return true
}

function isInfiniteLevelUnlocked(levelId: number, bestScores: Map<number, number>, infiniteScores: Map<number, number>): boolean {
  if (levelId === CLARITY_LEVELS.length + 1) {
    return (bestScores.get(CLARITY_LEVELS.length) ?? 0) >= 60
  }
  const prevInfiniteId = getInfiniteLevelId('clarity', levelId - 1)
  return (infiniteScores.get(prevInfiniteId) ?? 0) >= 60
}

export default async function ClarityLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelId = parseInt(levelParam, 10)

  if (isNaN(levelId) || levelId < 1) notFound()

  const isInfinite = levelId > CLARITY_LEVELS.length

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, { data: allScoreRows }, profileResult] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    isInfinite
      ? supabase.from('xp_ledger').select('level_id, score').eq('user_id', user.id).eq('world', 'clarity')
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('robot_config, game_preferences').eq('id', user.id).maybeSingle(),
  ])

  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScores.set(row.level, row.score)
  }

  const infiniteScores = new Map<number, number>()
  for (const row of allScoreRows ?? []) {
    const cur = infiniteScores.get(row.level_id) ?? 0
    if ((row.score ?? 0) > cur) infiniteScores.set(row.level_id, row.score)
  }

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const gamePrefs = (profileResult.data as { game_preferences?: Record<string, string> } | null)?.game_preferences ?? {}
  const preferredType = (gamePrefs['clarity'] as GameType | undefined) ?? null

  // ── Hand-crafted levels 1-10 ───────────────────────────────────────────────

  if (!isInfinite) {
    if (levelId > CLARITY_LEVELS.length) notFound()
    const level = CLARITY_LEVELS[levelId - 1]

    if (!isLevelUnlocked(levelId, bestScores)) redirect('/dashboard/clarity')

    const { gameType, isFirstVisit } = await getGameType(user.id, 'clarity', level.id, supabase)

    const levelConfig = {
      world: 'clarity' as const,
      level: level.id,
      challenge: level.goal,
      criteria: level.criteria,
      max_xp: level.max_xp,
    }

    const nextLevelUrl = `/dashboard/clarity/${levelId + 1}`

    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
          <Link
            href="/dashboard/clarity"
            className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#4A90E2]"
            style={{ color: '#888888' }}
          >
            ← Clarity
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono" style={{ color: '#999999' }}>
              {level.concept}
            </span>
            <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(74,144,226,0.1)', color: 'rgba(74,144,226,0.7)' }}>
              Level {String(levelId).padStart(2, '0')}
            </span>
          </div>
        </div>

        <GameRouter
          gameType={gameType}
          wordLimit={level.wordLimit}
          levelConfig={levelConfig}
          levelId={level.id}
          nextLevelUrl={nextLevelUrl}
          robotConfig={robotConfig}
          keyRule={CLARITY_KEY_RULES[levelId - 1]}
          isFirstVisit={isFirstVisit}
        />
      </div>
    )
  }

  // ── Infinite levels 11+ ────────────────────────────────────────────────────

  if (!isInfiniteLevelUnlocked(levelId, bestScores, infiniteScores)) {
    redirect('/dashboard/clarity')
  }

  const resolvedLevelId = getInfiniteLevelId('clarity', levelId)

  const generated = await getOrGenerateLevel(
    user.id, 'clarity', resolvedLevelId, levelId, preferredType, supabase,
  )

  const levelConfig = {
    world: 'clarity' as const,
    level: resolvedLevelId,
    challenge: generated.goal,
    criteria: generated.criteria,
    max_xp: 100,
  }

  const nextLevelUrl = `/dashboard/clarity/${levelId + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/clarity"
          className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#4A90E2]"
          style={{ color: '#888888' }}
        >
          ← Clarity
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(74,144,226,0.06)', color: 'rgba(74,144,226,0.5)' }}
          >
            ∞ Level {levelId}
          </span>
        </div>
      </div>

      <GameRouter
        gameType={generated.gameType}
        wordLimit={generated.wordLimit}
        levelConfig={levelConfig}
        levelId={resolvedLevelId}
        nextLevelUrl={nextLevelUrl}
        robotConfig={robotConfig}
        keyRule={generated.keyRule}
        isFirstVisit={generated.isFirstVisit}
        fragments={generated.fragments}
        choices={generated.choices}
      />
    </div>
  )
}
