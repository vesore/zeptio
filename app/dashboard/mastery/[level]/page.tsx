import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { MASTERY_LEVELS } from '@/src/lib/game/mastery-levels'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS } from '@/src/lib/game/debug-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType, type GameType } from '@/src/lib/gameRandomizer'
import { getOrGenerateLevel, getInfiniteLevelId } from '@/src/lib/levelGenerator'

interface Props {
  params: Promise<{ level: string }>
}

function buildBestMap(rows: Array<{ level: number; score: number }> | null): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of rows ?? []) {
    const cur = map.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) map.set(row.level, row.score)
  }
  return map
}

function isMasteryUnlocked(
  levelIndex: number,
  clarityBest: Map<number, number>,
  constraintsBest: Map<number, number>,
  structureBest: Map<number, number>,
  debugBest: Map<number, number>,
  masteryBest: Map<number, number>,
): boolean {
  const clarityId     = CLARITY_LEVELS[levelIndex - 1]?.id
  const constraintsId = CONSTRAINTS_LEVELS[levelIndex - 1]?.id
  const structureId   = STRUCTURE_LEVELS[levelIndex - 1]?.id
  const debugId       = DEBUG_LEVELS[levelIndex - 1]?.id

  if (!clarityId || !constraintsId || !structureId || !debugId) return false

  const worldsOk =
    (clarityBest.get(clarityId) ?? 0) >= 80 &&
    (constraintsBest.get(constraintsId) ?? 0) >= 80 &&
    (structureBest.get(structureId) ?? 0) >= 80 &&
    (debugBest.get(debugId) ?? 0) >= 80

  if (!worldsOk) return false
  if (levelIndex === 1) return true

  const prevMasteryId = MASTERY_LEVELS[levelIndex - 2].id
  return (masteryBest.get(prevMasteryId) ?? 0) >= 80
}

export default async function MasteryLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1) notFound()

  const isInfinite = levelIndex > MASTERY_LEVELS.length

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: clarityRows },
    { data: constraintsRows },
    { data: structureRows },
    { data: debugRows },
    { data: masteryRows },
    { data: allMasteryRows },
    profileResult,
  ] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'structure'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'debug'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'mastery'),
    isInfinite
      ? supabase.from('xp_ledger').select('level_id, score').eq('user_id', user.id).eq('world', 'mastery')
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('robot_config, game_preferences').eq('id', user.id).maybeSingle(),
  ])

  const clarityBest     = buildBestMap(clarityRows)
  const constraintsBest = buildBestMap(constraintsRows)
  const structureBest   = buildBestMap(structureRows)
  const debugBest       = buildBestMap(debugRows)
  const masteryBest     = buildBestMap(masteryRows)

  const infiniteScores = new Map<number, number>()
  for (const row of allMasteryRows ?? []) {
    const cur = infiniteScores.get(row.level_id) ?? 0
    if ((row.score ?? 0) > cur) infiniteScores.set(row.level_id, row.score)
  }

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const gamePrefs = (profileResult.data as { game_preferences?: Record<string, string> } | null)?.game_preferences ?? {}
  const preferredType = (gamePrefs['mastery'] as GameType | undefined) ?? null

  // ── Hand-crafted mastery levels ────────────────────────────────────────────

  if (!isInfinite) {
    if (levelIndex > MASTERY_LEVELS.length) notFound()
    const level = MASTERY_LEVELS[levelIndex - 1]

    if (!isMasteryUnlocked(levelIndex, clarityBest, constraintsBest, structureBest, debugBest, masteryBest)) {
      redirect('/dashboard/mastery')
    }

    const { gameType, isFirstVisit } = await getGameType(user.id, 'mastery', level.id, supabase)

    const levelConfig = {
      world: 'mastery' as const,
      level: level.id,
      challenge: level.goal,
      criteria: level.criteria,
      max_xp: level.max_xp,
    }

    const nextLevelUrl = `/dashboard/mastery/${levelIndex + 1}`

    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
          <Link
            href="/dashboard/mastery"
            className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#9B4AE2]"
            style={{ color: '#888888' }}
          >
            ← Mastery
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono" style={{ color: '#999999' }}>
              {level.concept}
            </span>
            <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(155,74,226,0.1)', color: '#9B4AE2' }}>
              Mastery {String(levelIndex).padStart(2, '0')}
            </span>
            <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(74,144,226,0.1)', color: '#4A90E2' }}>
              2× XP
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
          keyRule={level.keyRule}
          isFirstVisit={isFirstVisit}
        />
      </div>
    )
  }

  // ── Infinite mastery levels ────────────────────────────────────────────────

  const allMasteryComplete =
    (masteryBest.get(MASTERY_LEVELS[MASTERY_LEVELS.length - 1].id) ?? 0) >= 80

  if (levelIndex === MASTERY_LEVELS.length + 1) {
    if (!allMasteryComplete) redirect('/dashboard/mastery')
  } else {
    const prevInfiniteId = getInfiniteLevelId('mastery', levelIndex - 1)
    if ((infiniteScores.get(prevInfiniteId) ?? 0) < 60) redirect('/dashboard/mastery')
  }

  const resolvedLevelId = getInfiniteLevelId('mastery', levelIndex)

  const generated = await getOrGenerateLevel(
    user.id, 'mastery', resolvedLevelId, levelIndex, preferredType, supabase,
  )

  const levelConfig = {
    world: 'mastery' as const,
    level: resolvedLevelId,
    challenge: generated.goal,
    criteria: generated.criteria,
    max_xp: 100,
  }

  const nextLevelUrl = `/dashboard/mastery/${levelIndex + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/mastery"
          className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#9B4AE2]"
          style={{ color: '#888888' }}
        >
          ← Mastery
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(155,74,226,0.06)', color: 'rgba(155,74,226,0.5)' }}
          >
            ∞ Mastery {levelIndex}
          </span>
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(74,144,226,0.1)', color: '#4A90E2' }}>
            2× XP
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
