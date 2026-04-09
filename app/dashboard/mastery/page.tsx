import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { MASTERY_LEVELS } from '@/src/lib/game/mastery-levels'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS } from '@/src/lib/game/debug-levels'
import WorldGalaxyMap from '@/app/dashboard/_components/WorldGalaxyMap'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const ACCENT = '#FF0044'

function buildBestMap(rows: Array<{ level: number; score: number }> | null): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of rows ?? []) {
    const cur = map.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) map.set(row.level, row.score)
  }
  return map
}

/**
 * Mastery Level N unlocks when:
 * 1. User has scored 80+ on Level N of ALL 4 worlds
 * 2. User has scored 80+ on Mastery Level N-1 (for N > 1)
 *
 * Level IDs in xp_ledger:
 *   Clarity level N  = N       (1-10)
 *   Constraints N    = N+10    (11-20)
 *   Structure N      = N+20    (21-30)
 *   Debug N          = N+30    (31-40)
 *   Mastery N        = N+40    (41-50)
 */
function isMasteryUnlocked(
  levelIndex: number, // 1-based
  clarityBest: Map<number, number>,
  constraintsBest: Map<number, number>,
  structureBest: Map<number, number>,
  debugBest: Map<number, number>,
  masteryBest: Map<number, number>,
): boolean {
  // All 4 world level N must be 80+
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

  // Previous mastery level must score 80+
  const prevMasteryId = MASTERY_LEVELS[levelIndex - 2].id
  return (masteryBest.get(prevMasteryId) ?? 0) >= 80
}

export default async function MasteryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: clarityRows },
    { data: constraintsRows },
    { data: structureRows },
    { data: debugRows },
    { data: masteryRows },
    { data: profileData },
  ] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'structure'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'debug'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'mastery'),
    supabase.from('profiles').select('robot_config').eq('id', user.id).maybeSingle(),
  ])

  const clarityBest     = buildBestMap(clarityRows)
  const constraintsBest = buildBestMap(constraintsRows)
  const structureBest   = buildBestMap(structureRows)
  const debugBest       = buildBestMap(debugRows)
  const masteryBest     = buildBestMap(masteryRows)

  // Verify at least mastery level 1 is unlocked (otherwise redirect to dashboard)
  const level1Unlocked = isMasteryUnlocked(1, clarityBest, constraintsBest, structureBest, debugBest, masteryBest)
  if (!level1Unlocked) redirect('/dashboard')

  // Build bestScores for WorldGalaxyMap (keyed by mastery level ID 41-50)
  const bestScores: Record<number, number> = {}
  for (const [k, v] of masteryBest) bestScores[k] = v

  const completedCount = MASTERY_LEVELS.filter(l => (bestScores[l.id] ?? 0) >= 60).length


  const rawRobot = (profileData as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobot && typeof rawRobot === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobot as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  // Precompute unlock status for each mastery level (0-indexed boolean array)
  const unlockedOverride: boolean[] = MASTERY_LEVELS.map((_, i) =>
    isMasteryUnlocked(i + 1, clarityBest, constraintsBest, structureBest, debugBest, masteryBest)
  )

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden pb-24" style={{ background: '#0F0F0F' }}>
      <style>{`
        @keyframes masteryGlow {
          0%,100% { text-shadow: 0 0 20px rgba(255,0,68,0.6), 0 0 60px rgba(255,0,68,0.25); }
          50%      { text-shadow: 0 0 30px rgba(255,0,68,0.9), 0 0 80px rgba(255,0,68,0.4); }
        }
        .mastery-title-glow { animation: masteryGlow 3s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-lg mx-auto px-4 sm:px-6">

        {/* Top nav */}
        <div className="pt-5 pb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-mono transition-colors duration-200 hover:text-[#FF0044]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            ← Home
          </Link>
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(255,0,68,0.1)', color: 'rgba(255,0,68,0.7)' }}
          >
            {completedCount}/{MASTERY_LEVELS.length} complete
          </span>
        </div>

        {/* Neon title */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(255,0,68,0.5)' }}>
            ◎ The Core
          </p>
          <h1
            className="mastery-title-glow text-4xl sm:text-5xl font-black tracking-wider uppercase"
            style={{
              color: ACCENT,
              letterSpacing: '0.12em',
            }}
          >
            Mastery
          </h1>
          <p className="mt-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Double XP · Score 80+ to advance · Combines all 4 worlds
          </p>
        </div>

        {/* Progress bar */}
        <div className="my-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-1 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / MASTERY_LEVELS.length) * 100)}%`,
                background: `linear-gradient(90deg, ${ACCENT}, #ff4477)`,
                boxShadow: `0 0 8px rgba(255,0,68,0.6)`,
              }}
            />
          </div>
        </div>

        {/* Galaxy map — unlock computed server-side via unlockedOverride */}
        <WorldGalaxyMap
          levels={MASTERY_LEVELS}
          bestScores={bestScores}
          robotConfig={robotConfig}
          accent={ACCENT}
          baseLevelHref="/dashboard/mastery"
          unlockedOverride={unlockedOverride}
        />

      </div>
    </main>
  )
}
