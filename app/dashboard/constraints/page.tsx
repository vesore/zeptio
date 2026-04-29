import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import WorldGalaxyMap from '@/app/dashboard/_components/WorldGalaxyMap'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const ACCENT = '#B87333'

export default async function ConstraintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, { data: profileData }] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  const bestScoresMap = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScoresMap.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScoresMap.set(row.level, row.score)
  }

  const bestScores: Record<number, number> = {}
  for (const [k, v] of bestScoresMap) bestScores[k] = v

  const completedCount = CONSTRAINTS_LEVELS.filter(l => (bestScores[l.id] ?? 0) >= 60).length

  const rawRobot = (profileData as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden pb-24" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6">

        {/* Top nav */}
        <div className="pt-5 pb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-mono transition-colors duration-200 hover:text-[#B87333]"
            style={{ color: '#999999' }}
          >
            ← Home
          </Link>
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(226,160,74,0.1)', color: 'rgba(226,160,74,0.7)' }}
          >
            {completedCount}/{CONSTRAINTS_LEVELS.length} complete
          </span>
        </div>

        {/* Neon title */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(226,160,74,0.5)' }}>
            ◎ World Two
          </p>
          <h1
            className="text-4xl sm:text-5xl font-black tracking-wider uppercase"
            style={{
              color: ACCENT,
              textShadow: '0 0 20px rgba(226,160,74,0.5), 0 0 60px rgba(226,160,74,0.2)',
              letterSpacing: '0.12em',
            }}
          >
            Constraints
          </h1>
          <p className="mt-2 text-xs font-mono" style={{ color: '#999999' }}>
            Score 60+ on each level to unlock the next
          </p>
        </div>

        {/* Progress bar */}
        <div className="my-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <div
              className="h-1 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CONSTRAINTS_LEVELS.length) * 100)}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #d4923a)`,
                boxShadow: `0 0 8px rgba(226,160,74,0.6)`,
              }}
            />
          </div>
        </div>

        {/* Galaxy map */}
        <WorldGalaxyMap
          levels={CONSTRAINTS_LEVELS}
          bestScores={bestScores}
          robotConfig={robotConfig}
          accent={ACCENT}
          baseLevelHref="/dashboard/constraints"
        />

      </div>
    </main>
  )
}
