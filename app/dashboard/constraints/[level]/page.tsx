import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType } from '@/src/lib/gameRandomizer'

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

export default async function ConstraintsLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1 || levelIndex > CONSTRAINTS_LEVELS.length) notFound()

  const level = CONSTRAINTS_LEVELS[levelIndex - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, profileResult] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScores.set(row.level, row.score)
  }

  if (!isLevelUnlocked(levelIndex, bestScores, CONSTRAINTS_LEVELS)) redirect('/dashboard/constraints')

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const { gameType, isFirstVisit } = await getGameType(user.id, 'constraints', level.id, supabase)

  const levelConfig = {
    world: 'constraints' as const,
    level: level.id,
    challenge: level.goal,
    criteria: level.criteria,
    max_xp: level.max_xp,
  }

  const isLastLevel = levelIndex === CONSTRAINTS_LEVELS.length
  const nextLevelUrl = isLastLevel ? undefined : `/dashboard/constraints/${levelIndex + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#0F0F0F' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/constraints"
          className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#00FF88]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Constraints
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {level.concept}
          </span>
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(184,115,51,0.1)', color: 'rgba(184,115,51,0.7)' }}>
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
