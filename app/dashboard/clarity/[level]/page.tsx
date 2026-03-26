import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WordBudget from '@/src/components/game/WordBudget'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'

interface Props {
  params: Promise<{ level: string }>
}

export default async function ClarityLevelPage({ params }: Props) {
  const { level: levelParam } = await params
  const levelId = parseInt(levelParam, 10)

  if (isNaN(levelId) || levelId < 1 || levelId > CLARITY_LEVELS.length) notFound()

  const level = CLARITY_LEVELS[levelId - 1]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check if this level is unlocked
  if (levelId > 1) {
    const { data: prevScores } = await supabase
      .from('xp_ledger')
      .select('score')
      .eq('user_id', user.id)
      .eq('world', 'clarity')
      .eq('level', levelId - 1)
      .limit(1)

    if (!prevScores?.length) redirect('/dashboard/clarity')
  }

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
    <div className="min-h-screen">
      {/* Nav bar */}
      <div className="max-w-xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#E8FF47]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/clarity"
            className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#E8FF47]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            All Levels
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {level.concept}
          </span>
          <span className="text-xs font-mono rounded-full px-3 py-1" style={{ background: 'rgba(232,255,71,0.1)', color: 'rgba(232,255,71,0.7)' }}>
            Level {String(levelId).padStart(2, '0')}
          </span>
        </div>
      </div>

      <WordBudget
        goal={level.goal}
        wordLimit={level.wordLimit}
        levelId={level.id}
        levelConfig={levelConfig}
        nextLevelUrl={nextLevelUrl}
      />
    </div>
  )
}
