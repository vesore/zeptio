import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GameRouter from '@/src/components/game/GameRouter'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { getGameType } from '@/src/lib/gameRandomizer'

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

export default async function ClarityLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelId = parseInt(levelParam, 10)

  if (isNaN(levelId) || levelId < 1 || levelId > CLARITY_LEVELS.length) notFound()

  const level = CLARITY_LEVELS[levelId - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, profileResult] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScores.set(row.level, row.score)
  }

  if (!isLevelUnlocked(levelId, bestScores)) redirect('/dashboard/clarity')

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const { gameType, isFirstVisit } = await getGameType(user.id, 'clarity', level.id, supabase)

  const levelConfig = {
    world: 'clarity' as const,
    level: level.id,
    challenge: level.goal,
    criteria: level.criteria,
    max_xp: level.max_xp,
  }

  const isLastLevel = levelId === CLARITY_LEVELS.length
  const nextLevelUrl = isLastLevel ? undefined : `/dashboard/clarity/${levelId + 1}`

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
