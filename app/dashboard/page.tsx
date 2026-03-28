import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { CLARITY_LEVELS }     from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS }   from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS }       from '@/src/lib/game/debug-levels'

const CLARITY_COUNT     = CLARITY_LEVELS.length
const CONSTRAINTS_COUNT = CONSTRAINTS_LEVELS.length
const STRUCTURE_COUNT   = STRUCTURE_LEVELS.length
const DEBUG_COUNT       = DEBUG_LEVELS.length

/** XP thresholds for robot part unlocks */
const PART_THRESHOLDS = [100, 300, 500, 700, 1000] as const

function partsUnlocked(totalXp: number): number {
  return PART_THRESHOLDS.filter(t => totalXp >= t).length
}

function nextPartThreshold(totalXp: number): number {
  return PART_THRESHOLDS.find(t => t > totalXp) ?? 1000
}

function buildBestMap(rows: Array<{ level: number; score: number }> | null): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of rows ?? []) {
    const cur = map.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) map.set(row.level, row.score)
  }
  return map
}

function worldTotalXp(best: Map<number, number>): number {
  return Array.from(best.values()).reduce((s, v) => s + v, 0)
}

function worldAvg(best: Map<number, number>, count: number): number {
  if (best.size < count) return 0
  return Array.from(best.values()).reduce((a, b) => a + b, 0) / count
}

// Deterministic particles (SSR-safe)
const particles = Array.from({ length: 20 }, (_, i) => ({
  left:     `${(i * 127 + 43) % 97}%`,
  top:      `${(i * 83  + 17) % 93}%`,
  delay:    `${((i * 53) % 40) / 10}s`,
  duration: `${4 + ((i * 37) % 40) / 10}s`,
  size:     ((i * 29) % 3) + 1,
}))

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: xpRows },
    { data: streakRow },
    { data: clarityRows },
    { data: constraintsRows },
    { data: structureRows },
    { data: debugRows },
    { data: profile },
  ] = await Promise.all([
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'structure'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'debug'),
    supabase.from('profiles').select('name, robot_config').eq('id', user.id).maybeSingle(),
  ])

  const displayName = profile?.name ?? user.email ?? ''
  const firstName   = displayName.split(' ')[0]

  const rawRobotConfig = (profile as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobotConfig && typeof rawRobotConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobotConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  // Total XP (all worlds, deduplicated by best per level)
  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalXp = Array.from(bestPerLevel.values()).reduce((s, v) => s + v, 0)
  const streak  = streakRow?.current_streak ?? 0

  // Per-world best score maps
  const clarityBest     = buildBestMap(clarityRows)
  const constraintsBest = buildBestMap(constraintsRows)
  const structureBest   = buildBestMap(structureRows)
  const debugBest       = buildBestMap(debugRows)

  // Unlock chain — each world needs prev world completed at avg 80+
  const clarityAvg          = worldAvg(clarityBest, CLARITY_COUNT)
  const constraintsUnlocked = clarityBest.size === CLARITY_COUNT && clarityAvg >= 80

  const constraintsAvg     = worldAvg(constraintsBest, CONSTRAINTS_COUNT)
  const structureUnlocked  = constraintsBest.size === CONSTRAINTS_COUNT && constraintsAvg >= 80

  const structureAvg   = worldAvg(structureBest, STRUCTURE_COUNT)
  const debugUnlocked  = structureBest.size === STRUCTURE_COUNT && structureAvg >= 80

  // World completion checks (all 60+)
  const clarityAllComplete     = clarityBest.size >= CLARITY_COUNT && Array.from(clarityBest.values()).every(s => s >= 60)
  const constraintsAllComplete = constraintsBest.size >= CONSTRAINTS_COUNT && Array.from(constraintsBest.values()).every(s => s >= 60)
  const structureAllComplete   = structureBest.size >= STRUCTURE_COUNT && Array.from(structureBest.values()).every(s => s >= 60)
  const debugAllComplete       = debugBest.size >= DEBUG_COUNT && Array.from(debugBest.values()).every(s => s >= 60)

  // Per-world total XP → robot parts
  const clarityXp     = worldTotalXp(clarityBest)
  const constraintsXp = worldTotalXp(constraintsBest)
  const structureXp   = worldTotalXp(structureBest)
  const debugXp       = worldTotalXp(debugBest)

  const brainParts = partsUnlocked(clarityXp)
  const gearParts  = partsUnlocked(constraintsXp)
  const armParts   = partsUnlocked(structureXp)
  const eyeParts   = partsUnlocked(debugXp)

  const allWorldsComplete = clarityAllComplete && constraintsAllComplete && structureAllComplete && debugAllComplete

  // Active world
  const activeWorld =
    debugUnlocked && debugBest.size > 0       ? 'debug'
    : structureUnlocked && structureBest.size > 0 ? 'structure'
    : constraintsUnlocked && constraintsBest.size > 0 ? 'constraints'
    : 'clarity'

  type WorldDef = {
    id: string; name: string; subtitle: string; emoji: string; levelCount: number;
    accent: string; accentRgb: string; href?: string; locked: boolean;
    completed: boolean; lockMessage: string; parts: number; totalXp: number;
    partLabel: string;
  }

  const WORLDS: WorldDef[] = [
    {
      id: 'clarity', name: 'CLARITY', subtitle: 'The Brain', emoji: '🧠',
      levelCount: CLARITY_COUNT, accent: '#00FF88', accentRgb: '0,255,136',
      href: '/dashboard/clarity', locked: false, completed: clarityAllComplete,
      lockMessage: '', parts: brainParts, totalXp: clarityXp, partLabel: 'Brain Parts',
    },
    {
      id: 'constraints', name: 'CONSTRAINTS', subtitle: 'The Gears', emoji: '⚙️',
      levelCount: CONSTRAINTS_COUNT, accent: '#B87333', accentRgb: '184,115,51',
      href: constraintsUnlocked ? '/dashboard/constraints' : undefined,
      locked: !constraintsUnlocked, completed: constraintsAllComplete,
      lockMessage: 'Complete Clarity 80+ avg',
      parts: gearParts, totalXp: constraintsXp, partLabel: 'Gear Parts',
    },
    {
      id: 'structure', name: 'STRUCTURE', subtitle: 'The Arms', emoji: '🦾',
      levelCount: STRUCTURE_COUNT, accent: '#8B8FA8', accentRgb: '139,143,168',
      href: structureUnlocked ? '/dashboard/structure' : undefined,
      locked: !structureUnlocked, completed: structureAllComplete,
      lockMessage: 'Complete Constraints 80+ avg',
      parts: armParts, totalXp: structureXp, partLabel: 'Arm Parts',
    },
    {
      id: 'debug', name: 'DEBUG', subtitle: 'The Eyes', emoji: '👁️',
      levelCount: DEBUG_COUNT, accent: '#C84B1F', accentRgb: '200,75,31',
      href: debugUnlocked ? '/dashboard/debug' : undefined,
      locked: !debugUnlocked, completed: debugAllComplete,
      lockMessage: 'Complete Structure 80+ avg',
      parts: eyeParts, totalXp: debugXp, partLabel: 'Eye Parts',
    },
  ]

  return (
    <main
      className="text-white overflow-hidden flex flex-col relative"
      style={{ background: '#0F0F0F', height: '100dvh' }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes holoFlicker {
          0%,94%,100% { opacity:1; }
          95% { opacity:0.65; }
          96% { opacity:1; }
          97% { opacity:0.8; }
          98% { opacity:1; }
        }
        .holo-flicker { animation: holoFlicker 7s ease-in-out infinite; }

        @keyframes masteryPulse {
          0%,100% { box-shadow:0 0 0 1.5px rgba(255,0,68,0.4),0 0 16px rgba(255,0,68,0.15); }
          50%      { box-shadow:0 0 0 1.5px rgba(255,0,68,0.9),0 0 32px rgba(255,0,68,0.4); }
        }
        .mastery-pulse { animation: masteryPulse 2.4s ease-in-out infinite; }

        .world-card-clarity:hover     { box-shadow:0 0 0 1.5px #00FF88,0 0 24px rgba(0,255,136,0.35); }
        .world-card-constraints:hover { box-shadow:0 0 0 1.5px #B87333,0 0 24px rgba(184,115,51,0.35); }
        .world-card-structure:hover   { box-shadow:0 0 0 1.5px #8B8FA8,0 0 24px rgba(139,143,168,0.25); }
        .world-card-debug:hover       { box-shadow:0 0 0 1.5px #C84B1F,0 0 24px rgba(200,75,31,0.35); }
      `}</style>

      {/* Scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)' }}
        aria-hidden="true"
      />

      {/* Holographic grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,200,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.03) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} className="pointer-events-none absolute rounded-full" style={{
          left: p.left, top: p.top, width: p.size, height: p.size,
          background: '#00FF88',
          animation: `particleDrift ${p.duration} ${p.delay} ease-in-out infinite`,
          opacity: 0,
        }} aria-hidden="true" />
      ))}

      {/* ── TOP BAR ──────────────────────────────── */}
      <div className="relative z-10 shrink-0 grid grid-cols-3 items-center px-4 pt-4 pb-1">
        <div className="w-12 h-12" />
        <div className="flex justify-center">
          <span
            className="holo-flicker font-mono font-black tracking-widest text-3xl sm:text-4xl uppercase"
            style={{ color: '#00FF88', textShadow: '0 0 20px rgba(0,255,136,0.8),0 0 60px rgba(0,255,136,0.35)' }}
            aria-label="Zeptio"
          >
            Zeptio
          </span>
        </div>
        <div className="flex justify-end">
          <Link
            href="/profile"
            aria-label="View your profile"
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1.5px solid rgba(0,255,136,0.3)' }}
          >
            <RobotSVG config={robotConfig} size={48} headOnly />
          </Link>
        </div>
      </div>

      {/* ── STATS PILLS ──────────────────────────── */}
      <div className="relative z-10 shrink-0 flex flex-row items-center justify-center gap-3 sm:gap-6 px-4 py-2" aria-label="Your stats">
        <div className="inline-flex items-center justify-center rounded-full text-base font-bold whitespace-nowrap px-8 py-3"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', boxShadow: '0 0 20px rgba(0,255,136,0.08)' }}>
          <span className="text-white">Score</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#00FF88] tabular-nums">{totalXp}</span>
        </div>
        <div className="inline-flex items-center justify-center rounded-full text-base font-bold whitespace-nowrap px-8 py-3"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', boxShadow: '0 0 20px rgba(0,255,136,0.08)' }}>
          <span className="text-white">🔥 Streak</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#00FF88] tabular-nums">{streak}</span>
        </div>
      </div>

      {/* ── ROBOT SILHOUETTE ─────────────────────── */}
      <div className="relative z-10 shrink-0 flex justify-center py-1" aria-label="Robot build progress" aria-hidden="true">
        <svg width="90" height="78" viewBox="0 0 90 78" aria-hidden="true">
          {/* Head — Clarity (🧠 Brain) */}
          <rect x="28" y="2" width="34" height="26" rx="7"
            fill={brainParts > 0 ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)'}
            stroke={brainParts > 0 ? '#00FF88' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1.5"
          />
          {/* Eyes — Debug (👁️ Eyes) */}
          <circle cx="37" cy="13" r="4"
            fill={eyeParts > 0 ? '#00FF88' : 'rgba(255,255,255,0.06)'}
            opacity={eyeParts > 0 ? 0.9 : 1}
          />
          <circle cx="53" cy="13" r="4"
            fill={eyeParts > 0 ? '#00FF88' : 'rgba(255,255,255,0.06)'}
            opacity={eyeParts > 0 ? 0.9 : 1}
          />
          {/* Eye pupils */}
          {eyeParts > 0 && <>
            <circle cx="37" cy="13" r="2" fill="#0F0F0F" />
            <circle cx="53" cy="13" r="2" fill="#0F0F0F" />
          </>}
          {/* Neck */}
          <rect x="40" y="28" width="10" height="7" rx="2"
            fill={brainParts > 0 ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)'}
            stroke={brainParts > 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}
            strokeWidth="1"
          />
          {/* Torso — Constraints (⚙️ Gears) */}
          <rect x="18" y="35" width="54" height="34" rx="6"
            fill={gearParts > 0 ? 'rgba(184,115,51,0.12)' : 'rgba(255,255,255,0.03)'}
            stroke={gearParts > 0 ? '#B87333' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1.5"
          />
          {/* Gear dots on torso */}
          {gearParts > 0 && <>
            <circle cx="35" cy="50" r="5" fill="none" stroke="#B87333" strokeWidth="1.2" opacity="0.6" />
            <circle cx="45" cy="50" r="3" fill="none" stroke="#B87333" strokeWidth="1.2" opacity="0.4" />
            <circle cx="55" cy="50" r="5" fill="none" stroke="#B87333" strokeWidth="1.2" opacity="0.6" />
          </>}
          {/* Left arm — Structure (🦾 Arms) */}
          <rect x="4" y="37" width="13" height="28" rx="4"
            fill={armParts > 0 ? 'rgba(139,143,168,0.15)' : 'rgba(255,255,255,0.03)'}
            stroke={armParts > 0 ? '#8B8FA8' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1.5"
          />
          {/* Right arm — Structure (🦾 Arms) */}
          <rect x="73" y="37" width="13" height="28" rx="4"
            fill={armParts > 0 ? 'rgba(139,143,168,0.15)' : 'rgba(255,255,255,0.03)'}
            stroke={armParts > 0 ? '#8B8FA8' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1.5"
          />
          {/* Arm highlights */}
          {armParts > 0 && <>
            <rect x="8"  y="48" width="5" height="2" rx="1" fill="#8B8FA8" opacity="0.5" />
            <rect x="77" y="48" width="5" height="2" rx="1" fill="#8B8FA8" opacity="0.5" />
          </>}
          {/* Part count dots */}
          {([
            { parts: brainParts, x: 37, y: 22, color: '#00FF88' },
            { parts: eyeParts,   x: 53, y: 22, color: '#C84B1F' },
            { parts: gearParts,  x: 45, y: 61, color: '#B87333' },
            { parts: armParts,   x: 10, y: 58, color: '#8B8FA8' },
          ] as Array<{ parts: number; x: number; y: number; color: string }>).map(({ parts: p, x, y, color }) =>
            p > 0 ? (
              <text key={`${x}-${y}`} x={x} y={y} textAnchor="middle" fontSize="5" fontFamily="monospace" fill={color} opacity="0.8">
                {p}/5
              </text>
            ) : null
          )}
        </svg>
      </div>

      {/* ── WORLD GRID + MASTERY ─────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 px-3 sm:px-6 py-2 flex flex-col gap-2 sm:gap-3">

        <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorld
            const nextThreshold = nextPartThreshold(world.totalXp)

            const cardContent = (
              <>
                {/* Top edge accent gradient */}
                <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
                  height: '2px',
                  background: `linear-gradient(90deg,transparent,${world.accent},transparent)`,
                  opacity: world.locked ? 0.12 : 0.65,
                }} aria-hidden="true" />

                {/* Holographic inner glow */}
                {!world.locked && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                    boxShadow: `0 0 20px rgba(${world.accentRgb},0.15),inset 0 0 12px rgba(${world.accentRgb},0.04)`,
                  }} aria-hidden="true" />
                )}

                <div className="absolute inset-0 flex flex-col items-center p-2.5 sm:p-3 z-10">
                  {/* Emoji */}
                  <div className="relative flex items-center justify-center mt-0.5" aria-hidden="true">
                    <span className="text-2xl sm:text-3xl leading-none"
                      style={world.locked ? { filter: 'grayscale(1)', opacity: 0.2 } : undefined}>
                      {world.emoji}
                    </span>
                    {world.locked && (
                      <span className="absolute -bottom-1 -right-1 text-[10px] leading-none"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(200,75,31,0.6))' }}>🔒</span>
                    )}
                  </div>

                  {/* Name + subtitle */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-0.5 mt-1">
                    {world.completed && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black mb-0.5"
                        style={{ background: `rgba(${world.accentRgb},0.2)`, color: world.accent }}>✓</span>
                    )}
                    {isActive && !world.locked && (
                      <div className="robot-float mb-0.5" aria-hidden="true">
                        <RobotSVG config={robotConfig} size={20} headOnly />
                      </div>
                    )}
                    <h2 className="text-[10px] sm:text-xs font-black tracking-widest leading-none text-center"
                      style={{ color: world.locked ? 'rgba(232,232,232,0.15)' : '#E8E8E8' }}>
                      {world.name}
                    </h2>
                    <p className="text-[9px] sm:text-[10px] font-mono tracking-wide text-center"
                      style={{ color: world.locked ? 'rgba(184,115,51,0.15)' : '#B87333' }}>
                      {world.subtitle}
                    </p>
                  </div>

                  {/* Parts + XP progress */}
                  <div className="w-full flex flex-col items-center gap-0.5 mt-1">
                    <p className="text-[8px] font-mono text-center"
                      style={{ color: world.locked ? 'rgba(139,143,168,0.15)' : '#8B8FA8' }}>
                      {world.locked ? `${world.levelCount} Levels` : `${world.partLabel}: ${world.parts}/5`}
                    </p>
                    {!world.locked && (
                      <>
                        {/* Parts progress bar */}
                        <div className="w-full h-0.5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(world.totalXp / 1000) * 100}%`,
                              background: world.accent,
                              opacity: 0.7,
                            }} />
                        </div>
                        <p className="text-[7px] font-mono tabular-nums"
                          style={{ color: 'rgba(139,143,168,0.5)' }}>
                          {world.parts < 5 ? `${world.totalXp}/${nextThreshold} pts` : 'Complete'}
                        </p>
                      </>
                    )}
                    {world.locked && world.lockMessage && (
                      <p className="text-[7px] font-mono text-center" style={{ color: 'rgba(139,143,168,0.3)' }}>
                        {world.lockMessage}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )

            const cardStyle = {
              background: world.locked
                ? '#1A1A1A'
                : `linear-gradient(160deg,rgba(${world.accentRgb},0.06) 0%,rgba(26,26,26,0.95) 55%)`,
              border: `1.5px solid ${world.locked ? '#252525' : `rgba(${world.accentRgb},0.3)`}`,
              backdropFilter: 'blur(4px)',
              opacity: world.locked ? 0.55 : 1,
            }

            const baseClass = `relative rounded-2xl overflow-hidden transition-all duration-300 h-full world-card-${world.id}`

            return world.href ? (
              <Link key={world.id} href={world.href}
                className={`${baseClass} hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]`}
                style={cardStyle} role="listitem"
                aria-label={`${world.name} — ${world.levelCount} levels, ${world.parts}/5 parts`}>
                {cardContent}
              </Link>
            ) : (
              <div key={world.id} className={`${baseClass} cursor-not-allowed`}
                style={cardStyle} role="listitem" aria-disabled="true"
                aria-label={`${world.name} — ${world.lockMessage}`}>
                {cardContent}
              </div>
            )
          })}
        </div>

        {/* ── MASTERY TEASER ── */}
        <div className="mastery-pulse relative rounded-2xl overflow-hidden shrink-0"
          style={{
            background: allWorldsComplete
              ? 'linear-gradient(90deg,rgba(255,0,68,0.15) 0%,rgba(26,26,26,0.95) 50%,rgba(255,0,68,0.15) 100%)'
              : 'linear-gradient(90deg,rgba(255,0,68,0.05) 0%,#1A1A1A 50%,rgba(255,0,68,0.05) 100%)',
            border: '1.5px solid rgba(255,0,68,0.2)',
            height: '60px',
            opacity: allWorldsComplete ? 1 : 0.65,
          }}
          role="listitem" aria-disabled={!allWorldsComplete}
          aria-label="Mastery — Complete all worlds to unlock">
          <div className="absolute top-0 left-0 right-0 h-0.5 pointer-events-none"
            style={{ background: 'linear-gradient(90deg,transparent,#FF0044,transparent)', opacity: 0.4 }} aria-hidden="true" />
          <div className="absolute inset-0 flex flex-row items-center justify-center gap-3 px-4 z-10">
            <div className="relative flex items-center justify-center" aria-hidden="true">
              <span className="text-xl leading-none" style={allWorldsComplete ? undefined : { filter: 'grayscale(1)', opacity: 0.25 }}>❤️</span>
              {!allWorldsComplete && (
                <span className="absolute -bottom-1 -right-1 text-[9px] leading-none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(200,75,31,0.6))' }}>🔒</span>
              )}
            </div>
            <div className="flex flex-col items-start gap-0">
              <h2 className="text-[10px] font-black tracking-widest" style={{ color: allWorldsComplete ? '#E8E8E8' : 'rgba(232,232,232,0.18)' }}>
                MASTERY
              </h2>
              <p className="text-[9px] font-mono" style={{ color: allWorldsComplete ? 'rgba(255,0,68,0.7)' : 'rgba(255,0,68,0.3)' }}>The Core</p>
            </div>
            <p className="ml-auto text-[8px] font-mono text-right leading-snug"
              style={{ color: 'rgba(139,143,168,0.3)', maxWidth: '90px' }}>
              {allWorldsComplete ? 'All worlds complete!' : 'Complete all worlds to unlock'}
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────── */}
      <div className="relative z-10 shrink-0 flex items-center justify-center gap-0 text-xs py-2 px-4"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        <a href="/privacy" className="hover:text-[#00FF88] transition-colors duration-200 px-3">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms"   className="hover:text-[#00FF88] transition-colors duration-200 px-3">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/support" className="hover:text-[#00FF88] transition-colors duration-200 px-3">Support</a>
        {user.email === 'vesorestyle@gmail.com' && (
          <>
            <span aria-hidden="true">·</span>
            <a href="/admin" className="hover:text-[#00FF88] transition-colors duration-200 px-3">Admin</a>
          </>
        )}
      </div>

    </main>
  )
}
