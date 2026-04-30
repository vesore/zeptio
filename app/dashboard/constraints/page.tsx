import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import WorldGalaxyMap from '@/app/dashboard/_components/WorldGalaxyMap'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import GameStylePicker from '@/src/components/game/GameStylePicker'
import { WORLD_GAME_POOLS } from '@/src/lib/levelGenerator'
import type { GameType } from '@/src/lib/gameRandomizer'

const ACCENT = '#F5A623'

export default async function ConstraintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, { data: profileData }] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('profiles').select('robot_config, game_preferences').eq('id', user.id).maybeSingle(),
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

  const gamePrefs = (profileData as { game_preferences?: Record<string, string> } | null)?.game_preferences ?? {}
  const preferredType = (gamePrefs['constraints'] as GameType | undefined) ?? null
  const availableTypes = WORLD_GAME_POOLS['constraints'] ?? []

  const allComplete = completedCount === CONSTRAINTS_LEVELS.length
  const nextInfiniteLevel = CONSTRAINTS_LEVELS.length + 1

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden pb-24" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6">

        {/* Top nav */}
        <div className="pt-5 pb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm transition-colors duration-200 hover:text-[#F5A623]"
            style={{ color: '#999999' }}
          >
            ← Home
          </Link>
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(245,166,35,0.12)', color: ACCENT }}
          >
            {completedCount}/{CONSTRAINTS_LEVELS.length} complete
          </span>
        </div>

        {/* Title */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: `${ACCENT}99` }}>
            ◎ World Two
          </p>
          <h1
            className="fredoka text-4xl sm:text-5xl font-black uppercase"
            style={{ color: ACCENT, letterSpacing: '0.06em' }}
          >
            Constraints
          </h1>
          <p className="mt-2 text-xs" style={{ color: '#999999' }}>
            Score 60+ on each level to unlock the next
          </p>
        </div>

        {/* Progress bar */}
        <div className="my-5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CONSTRAINTS_LEVELS.length) * 100)}%`,
                background: ACCENT,
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

        {/* Game Style Picker */}
        <div className="mt-8 mb-2">
          <GameStylePicker
            world="constraints"
            accent={ACCENT}
            availableTypes={availableTypes}
            initialPreferred={preferredType}
          />
        </div>

        {/* Infinite Zone */}
        {allComplete && (
          <div className="mt-6 mb-4">
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: '#FFFFFF', border: `1.5px solid ${ACCENT}26`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: `${ACCENT}80` }}>
                ∞ Infinite Zone
              </span>
              <p className="text-sm" style={{ color: '#666666' }}>
                All 10 levels complete. AI-generated challenges unlock forever.
              </p>
              <Link
                href={`/dashboard/constraints/${nextInfiniteLevel}`}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: ACCENT, color: '#FFFFFF', alignSelf: 'flex-start' }}
              >
                Play Level {nextInfiniteLevel} →
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
