import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType } from '@/src/lib/gameRandomizer'

const STRUCTURE_KEY_RULES = [
  'Structure is invisible when done right.',
  'Format shapes the answer.',
  'Tables reveal patterns words hide.',
  'Balance creates credibility.',
  'Sentences have architecture.',
  'A clear structure guides clear thinking.',
  'Ranked lists force prioritization.',
  'Data needs a container.',
  'Before and after shows transformation.',
  'The best prompt is a blueprint.',
]

interface Props {
  params: Promise<{ level: string }>
}

function isLevelUnlocked(levelIndex: number, bestScores: Map<number, number>, levels: typeof STRUCTURE_LEVELS): boolean {
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

export default async function StructureLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1 || levelIndex > STRUCTURE_LEVELS.length) notFound()

  const level = STRUCTURE_LEVELS[levelIndex - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, profileResult] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'structure'),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScores.set(row.level, row.score)
  }

  if (!isLevelUnlocked(levelIndex, bestScores, STRUCTURE_LEVELS)) redirect('/dashboard/structure')

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const { gameType, isFirstVisit } = await getGameType(user.id, 'structure', level.id, supabase)

  const levelConfig = {
    world: 'structure' as const,
    level: level.id,
    challenge: level.goal,
    criteria: level.criteria,
    max_xp: level.max_xp,
  }

  const isLastLevel = levelIndex === STRUCTURE_LEVELS.length
  const nextLevelUrl = isLastLevel ? undefined : `/dashboard/structure/${levelIndex + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/structure"
          className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#8B8FA8]"
          style={{ color: '#888888' }}
        >
          ← Structure
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-mono" style={{ color: '#999999' }}>
            {level.concept}
          </span>
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(102,102,102,0.1)', color: 'rgba(102,102,102,0.7)' }}>
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
        keyRule={STRUCTURE_KEY_RULES[levelIndex - 1]}
        isFirstVisit={isFirstVisit}
      />
    </div>
  )
}
