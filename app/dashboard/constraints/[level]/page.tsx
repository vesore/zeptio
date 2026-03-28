import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WordBudget from '@/src/components/game/WordBudget'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const CLARITY_LEVEL_COUNT = CLARITY_LEVELS.length

interface Props {
  params: Promise<{ level: string }>
}

export default async function ConstraintsLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1 || levelIndex > CONSTRAINTS_LEVELS.length) notFound()

  const level = CONSTRAINTS_LEVELS[levelIndex - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify Clarity unlock requirement
  const { data: clarityRows } = await supabase
    .from('xp_ledger')
    .select('level, score')
    .eq('user_id', user.id)
    .eq('world', 'clarity')

  const clarityBest = new Map<number, number>()
  for (const row of clarityRows ?? []) {
    const cur = clarityBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) clarityBest.set(row.level, row.score)
  }

  const clarityCompleted = clarityBest.size === CLARITY_LEVEL_COUNT
  const clarityAvg = clarityCompleted
    ? Array.from(clarityBest.values()).reduce((a, b) => a + b, 0) / CLARITY_LEVEL_COUNT
    : 0

  if (!clarityCompleted || clarityAvg < 80) {
    redirect('/dashboard')
  }

  // Check if this constraints level is unlocked + fetch robot config in parallel
  const [prevResult, profileResult] = await Promise.all([
    levelIndex > 1
      ? supabase.from('xp_ledger').select('score').eq('user_id', user.id).eq('world', 'constraints').eq('level', CONSTRAINTS_LEVELS[levelIndex - 2].id).limit(1)
      : Promise.resolve({ data: [{}] }),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  if (levelIndex > 1 && !prevResult.data?.length) redirect('/dashboard/constraints')

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const levelConfig = {
    world: 'constraints' as const,
    level: level.id,        // 11–20, stored in xp_ledger.level
    challenge: level.goal,
    criteria: level.criteria,
    max_xp: level.max_xp,
  }

  const isLastLevel = levelIndex === CONSTRAINTS_LEVELS.length
  const nextLevelUrl = isLastLevel ? undefined : `/dashboard/constraints/${levelIndex + 1}`

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Nav bar */}
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
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(0,255,136,0.1)', color: 'rgba(0,255,136,0.7)' }}>
            Level {String(levelIndex).padStart(2, '0')}
          </span>
        </div>
      </div>

      <WordBudget
        goal={level.goal}
        wordLimit={level.wordLimit}
        levelId={level.id}
        levelConfig={levelConfig}
        nextLevelUrl={nextLevelUrl}
        robotConfig={robotConfig}
      />
    </div>
  )
}
