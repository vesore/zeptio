import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WordBudget from '@/src/components/game/WordBudget'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const CONSTRAINTS_LEVEL_COUNT = CONSTRAINTS_LEVELS.length

interface Props {
  params: Promise<{ level: string }>
}

export default async function StructureLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelIndex = parseInt(levelParam, 10)

  if (isNaN(levelIndex) || levelIndex < 1 || levelIndex > STRUCTURE_LEVELS.length) notFound()

  const level = STRUCTURE_LEVELS[levelIndex - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify Constraints unlock requirement (avg 80+)
  const { data: constraintsRows } = await supabase
    .from('xp_ledger')
    .select('level, score')
    .eq('user_id', user.id)
    .eq('world', 'constraints')

  const constraintsBest = new Map<number, number>()
  for (const row of constraintsRows ?? []) {
    const cur = constraintsBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) constraintsBest.set(row.level, row.score)
  }

  const constraintsCompleted = constraintsBest.size === CONSTRAINTS_LEVEL_COUNT
  const constraintsAvg = constraintsCompleted
    ? Array.from(constraintsBest.values()).reduce((a, b) => a + b, 0) / CONSTRAINTS_LEVEL_COUNT
    : 0

  if (!constraintsCompleted || constraintsAvg < 80) {
    redirect('/dashboard')
  }

  // Check if this structure level is unlocked (previous level scored 60+)
  const [prevResult, profileResult] = await Promise.all([
    levelIndex > 1
      ? supabase.from('xp_ledger').select('score').eq('user_id', user.id).eq('world', 'structure').eq('level', STRUCTURE_LEVELS[levelIndex - 2].id).limit(1)
      : Promise.resolve({ data: [{}] }),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  if (levelIndex > 1 && !prevResult.data?.length) redirect('/dashboard/structure')

  const rawRobot = (profileResult.data as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden" style={{ background: '#0F0F0F' }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 mt-0 sm:mt-6 flex items-center justify-between">
        <Link
          href="/dashboard/structure"
          className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#8B8FA8]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Structure
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {level.concept}
          </span>
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(139,143,168,0.1)', color: 'rgba(139,143,168,0.7)' }}>
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
