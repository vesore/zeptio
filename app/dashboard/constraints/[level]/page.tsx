import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType, type GameType } from '@/src/lib/gameRandomizer'
import { getOrGenerateLevel, getInfiniteLevelId } from '@/src/lib/levelGenerator'

const CONSTRAINTS_KEY_RULES = [
  'Limits force creativity.',
  'Less words, more thought.',
  'Removing options reveals solutions.',
  'The best constraint is self-imposed.',
  'Work within the box before thinking outside it.',
  'Efficiency is a form of respect.',
  'Constraints are a superpower.',
  'The tightest prompts get the sharpest answers.',
  'Simplicity is the ultimate sophistication.',
  'True mastery shows in what you leave out.',
]

interface Props {
  params: Promise<{ level: string }>
}

function isLevelUnlocked(levelIndex: number, bestScores: Map<number, number>, levels: typeof CONSTRAINTS_LEVELS): boolean {
  if (levelIndex === 1) return true
  const prevId = levels[levelIndex - 2].id
  const prevScore = bestScores.get(prevId) ?? 0
  if (prevScore < 60) return false
  if (levelIndex >= 6 && levelIndex <= 8) {
    const ids = levels.slice(0, 5).map(l => l.id)
    const avg = ids.reduce((s, id) => s + (bestScores.get(id) ?? 0), 0) / ids.length
    return avg >= 70
  }
  if (levelIndex >= 9) {
    const ids = levels.slice(0, 8).map(l => l.id)
    const avg = ids.reduce((s, id) => s + (bestScores.get(id) ?? 0), 0) / ids.length
    return avg >= 80
  }
  return true
}

function isInfiniteLevelUnlocked(levelIndex: number, bestScores: Map<number, number>, infiniteScores: Map<number, number>): boolean {
  if (levelIndex === CONSTRAINTS_LEVELS.length + 1) {
    const lastId = CONSTRAINTS_LEVELS[CONSTRAINTS_LEVELS.length - 1].id
    return (bestScores.get(lastId) ?? 0) >= 60
  }
  const prevInfiniteId = getInfiniteLevelId('constraints', levelIndex - 1)
  return (infiniteScores.get(prevInfiniteId) ?? 0) >= 60
}

export default async function ConstraintsLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1) notFound()

  const isInfinite = levelIndex > CONSTRAINTS_LEVELS.length

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, { data: allScoreRows }, profileResult] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    isInfinite
      ? supabase.from('xp_ledger').select('level_id, score').eq('user_id', user.id).eq('world', 'constraints')
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
  const preferredType = (gamePrefs['constraints'] as GameType | undefined) ?? null

  // ── Hand-crafted levels 1-10 ───────────────────────���───────────────────────

  if (!isInfinite) {
    if (levelIndex > CONSTRAINTS_LEVELS.length) notFound()
    const level = CONSTRAINTS_LEVELS[levelIndex - 1]

    if (!isLevelUnlocked(levelIndex, bestScores, CONSTRAINTS_LEVELS)) redirect('/dashboard/constraints')

    const { gameType, isFirstVisit } = await getGameType(user.id, 'constraints', level.id, supabase)

    const levelConfig = {
      world: 'constraints' as const,
      level: level.id,
      challenge: level.goal,
      criteria: level.criteria,
      max_xp: level.max_xp,
    }

    const nextLevelUrl = `/dashboard/constraints/${levelIndex + 1}`

    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
          <Link
            href="/dashboard/constraints"
            className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#F5A623]"
            style={{ color: '#888888' }}
          >
            ← Constraints
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono" style={{ color: '#999999' }}>
              {level.concept}
            </span>
            <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623' }}>
              Level {String(levelIndex).padStart(2, '0')}
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
          keyRule={CONSTRAINTS_KEY_RULES[levelIndex - 1]}
          isFirstVisit={isFirstVisit}
        />
      </div>
    )
  }

  // ── Infinite levels 11+ ────────────────────────────────────────────────────

  if (!isInfiniteLevelUnlocked(levelIndex, bestScores, infiniteScores)) {
    redirect('/dashboard/constraints')
  }

  const resolvedLevelId = getInfiniteLevelId('constraints', levelIndex)

  const generated = await getOrGenerateLevel(
    user.id, 'constraints', resolvedLevelId, levelIndex, preferredType, supabase,
  )

  const levelConfig = {
    world: 'constraints' as const,
    level: resolvedLevelId,
    challenge: generated.goal,
    criteria: generated.criteria,
    max_xp: 100,
  }

  const nextLevelUrl = `/dashboard/constraints/${levelIndex + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/constraints"
          className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#F5A623]"
          style={{ color: '#888888' }}
        >
          ← Constraints
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(245,166,35,0.06)', color: 'rgba(245,166,35,0.5)' }}
          >
            ∞ Level {levelIndex}
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
