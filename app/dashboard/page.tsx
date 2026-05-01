import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { CLARITY_LEVELS }     from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS }   from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS }       from '@/src/lib/game/debug-levels'
import SoundToggle from '@/src/components/SoundToggle'

const CLARITY_COUNT     = CLARITY_LEVELS.length
const CONSTRAINTS_COUNT = CONSTRAINTS_LEVELS.length
const STRUCTURE_COUNT   = STRUCTURE_LEVELS.length
const DEBUG_COUNT       = DEBUG_LEVELS.length

const PART_THRESHOLDS = [100, 300, 500, 700, 1000] as const

function partsUnlocked(totalXp: number): number {
  return PART_THRESHOLDS.filter(t => totalXp >= t).length
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

function worldAvgOf(best: Map<number, number>, count: number): number {
  if (best.size < count) return 0
  return Array.from(best.values()).reduce((a, b) => a + b, 0) / count
}

function completedLevels(best: Map<number, number>): number {
  return Array.from(best.values()).filter(s => s >= 60).length
}

function gearPoints(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const pts: string[] = []
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`)
  }
  return pts.join(' ')
}

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
    supabase.from('profiles').select('name, robot_config, calibration_complete').eq('id', user.id).maybeSingle(),
  ])

  if (!(profile as { calibration_complete?: boolean } | null)?.calibration_complete) {
    redirect('/calibration')
  }

  const rawRobotConfig = (profile as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobotConfig && typeof rawRobotConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobotConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalXp = Array.from(bestPerLevel.values()).reduce((s, v) => s + v, 0)
  const streak  = streakRow?.current_streak ?? 0

  const clarityBest     = buildBestMap(clarityRows)
  const constraintsBest = buildBestMap(constraintsRows)
  const structureBest   = buildBestMap(structureRows)
  const debugBest       = buildBestMap(debugRows)

  const clarityAllComplete     = clarityBest.size >= CLARITY_COUNT     && Array.from(clarityBest.values()).every(s => s >= 60)
  const constraintsAllComplete = constraintsBest.size >= CONSTRAINTS_COUNT && Array.from(constraintsBest.values()).every(s => s >= 60)
  const structureAllComplete   = structureBest.size >= STRUCTURE_COUNT   && Array.from(structureBest.values()).every(s => s >= 60)
  const debugAllComplete       = debugBest.size >= DEBUG_COUNT           && Array.from(debugBest.values()).every(s => s >= 60)

  const clarityXp     = worldTotalXp(clarityBest)
  const constraintsXp = worldTotalXp(constraintsBest)
  const structureXp   = worldTotalXp(structureBest)
  const debugXp       = worldTotalXp(debugBest)

  const brainParts = partsUnlocked(clarityXp)
  const gearParts  = partsUnlocked(constraintsXp)
  const armParts   = partsUnlocked(structureXp)
  const eyeParts   = partsUnlocked(debugXp)

  const masteryUnlocked =
    (clarityBest.get(1)  ?? 0) >= 80 &&
    (constraintsBest.get(11) ?? 0) >= 80 &&
    (structureBest.get(21)   ?? 0) >= 80 &&
    (debugBest.get(31)       ?? 0) >= 80

  const activeWorld =
    debugBest.size > 0         ? 'debug'
    : structureBest.size > 0   ? 'structure'
    : constraintsBest.size > 0 ? 'constraints'
    : 'clarity'

  const worldAvgs = [
    { id: 'clarity',     href: '/dashboard/clarity',     accent: '#4A90E2', avg: worldAvgOf(clarityBest,     CLARITY_COUNT) },
    { id: 'constraints', href: '/dashboard/constraints', accent: '#F5A623', avg: worldAvgOf(constraintsBest, CONSTRAINTS_COUNT) },
    { id: 'structure',   href: '/dashboard/structure',   accent: '#4AE27A', avg: worldAvgOf(structureBest,   STRUCTURE_COUNT) },
    { id: 'debug',       href: '/dashboard/debug',       accent: '#E24A4A', avg: worldAvgOf(debugBest,       DEBUG_COUNT) },
  ]
  void worldAvgs // kept for future daily-suggestion use

  type WorldDef = {
    id: string; name: string; subtitle: string; emoji: string; levelCount: number;
    accent: string; gradientFrom: string; gradientTo: string;
    href: string; completed: boolean;
    parts: number; totalXp: number; levelsComplete: number;
  }

  const WORLDS: WorldDef[] = [
    {
      id: 'clarity', name: 'CLARITY', subtitle: 'The Brain', emoji: '🧠',
      levelCount: CLARITY_COUNT, accent: '#4A90E2',
      gradientFrom: '#5B9EE8', gradientTo: '#2E6DB4',
      href: '/dashboard/clarity', completed: clarityAllComplete,
      parts: brainParts, totalXp: clarityXp,
      levelsComplete: completedLevels(clarityBest),
    },
    {
      id: 'constraints', name: 'CONSTRAINTS', subtitle: 'The Gears', emoji: '⚙️',
      levelCount: CONSTRAINTS_COUNT, accent: '#F5A623',
      gradientFrom: '#F7B84A', gradientTo: '#D4871A',
      href: '/dashboard/constraints', completed: constraintsAllComplete,
      parts: gearParts, totalXp: constraintsXp,
      levelsComplete: completedLevels(constraintsBest),
    },
    {
      id: 'structure', name: 'STRUCTURE', subtitle: 'The Arms', emoji: '🦾',
      levelCount: STRUCTURE_COUNT, accent: '#4AE27A',
      gradientFrom: '#5AE884', gradientTo: '#2EBD5A',
      href: '/dashboard/structure', completed: structureAllComplete,
      parts: armParts, totalXp: structureXp,
      levelsComplete: completedLevels(structureBest),
    },
    {
      id: 'debug', name: 'DEBUG', subtitle: 'The Eyes', emoji: '👁️',
      levelCount: DEBUG_COUNT, accent: '#E24A4A',
      gradientFrom: '#E85B5B', gradientTo: '#BD2E2E',
      href: '/dashboard/debug', completed: debugAllComplete,
      parts: eyeParts, totalXp: debugXp,
      levelsComplete: completedLevels(debugBest),
    },
  ]

  // Belt: x=42 to x=318, center y=44 (rect y=32 + h=24/2)
  const leftGear  = gearPoints(28,  44, 14, 9, 8)
  const rightGear = gearPoints(332, 44, 14, 9, 8)

  return (
    <main
      className="overflow-hidden flex flex-col relative"
      style={{
        height: '100dvh',
        color: '#1A1A1A',
        backgroundColor: '#EFEFEF',
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.024) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.024) 1px, transparent 1px),
          radial-gradient(ellipse 110% 65% at 50% 10%, #F8F8F8 0%, #E4E4E4 100%)
        `,
        backgroundSize: '28px 28px, 28px 28px, 100% 100%',
      }}
    >
      <style>{`
        @keyframes partGlow1 { 0%,100%{filter:drop-shadow(0 0 5px #4A90E2);} 50%{filter:drop-shadow(0 0 12px #4A90E2);} }
        @keyframes partGlow2 { 0%,100%{filter:drop-shadow(0 0 5px #F5A623);} 50%{filter:drop-shadow(0 0 12px #F5A623);} }
        @keyframes partGlow3 { 0%,100%{filter:drop-shadow(0 0 5px #4AE27A);} 50%{filter:drop-shadow(0 0 12px #4AE27A);} }
        @keyframes partGlow4 { 0%,100%{filter:drop-shadow(0 0 5px #E24A4A);} 50%{filter:drop-shadow(0 0 12px #E24A4A);} }
        @keyframes partGlow5 { 0%,100%{filter:drop-shadow(0 0 5px #9B4AE2);} 50%{filter:drop-shadow(0 0 12px #9B4AE2);} }

        .part-glow-1 { animation: partBob1 2.1s ease-in-out infinite, partGlow1 1.8s ease-in-out infinite; }
        .part-glow-2 { animation: partBob2 1.9s ease-in-out infinite, partGlow2 2.2s ease-in-out infinite; }
        .part-glow-3 { animation: partBob3 2.4s ease-in-out infinite, partGlow3 1.9s ease-in-out infinite; }
        .part-glow-4 { animation: partBob4 2.0s ease-in-out infinite, partGlow4 2.1s ease-in-out infinite; }
        .part-glow-5 { animation: partBob5 2.2s ease-in-out infinite, partGlow5 2.0s ease-in-out infinite; }
        .part-grey   { animation: partBob1 2.5s ease-in-out infinite; filter: grayscale(1); opacity: 0.28; }

        .wii-tile {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
          display: flex;
        }
        .wii-tile:hover  { transform: scale(1.05) translateY(-2px); }
        .wii-tile:active { transform: scale(0.97) translateY(0px) !important; transition: transform 0.07s ease !important; }
      `}</style>

      {/* ── TOP NAV ──────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex items-center justify-between px-4 pt-3 pb-2"
      >
        {/* Left: Zeptio wordmark */}
        <span className="fredoka font-black text-2xl" style={{ color: '#1A1A1A' }}>
          Zeptio
        </span>

        {/* Right: score corner + streak + sound + journal + profile */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: '#F0F0F0', border: '1px solid #E0E0E0', color: '#1A1A1A' }}
          >
            <span style={{ color: '#AAAAAA' }}>XP</span>
            <span className="tabular-nums">{totalXp}</span>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: '#F0F0F0', border: '1px solid #E0E0E0', color: '#1A1A1A' }}
          >
            <span>🔥</span>
            <span className="tabular-nums">{streak}</span>
          </div>
          <SoundToggle />
          <Link
            href="/journal"
            className="text-sm font-semibold transition-colors duration-200"
            style={{ color: '#BBBBBB' }}
            aria-label="Learning Journal"
          >
            Journal
          </Link>
          <Link
            href="/profile"
            aria-label="View your profile"
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2"
            style={{ background: '#F5F5F5', border: '1.5px solid #E0E0E0' }}
          >
            <RobotSVG config={robotConfig} size={32} headOnly />
          </Link>
        </div>
      </div>

      {/* ── ROBOT ASSEMBLY ───────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex flex-col items-center pt-3 pb-0"
        aria-label="Robot assembly progress"
        aria-hidden="true"
      >
        <svg width="148" height="84" viewBox="0 0 148 84" fill="none" aria-hidden="true">
          {/* White pedestal */}
          <rect x="30" y="74" width="88" height="8" rx="4" fill="white" opacity="0.9" />
          <ellipse cx="74" cy="80" rx="38" ry="3.5" fill="rgba(0,0,0,0.07)" />

          {/* Head — Clarity */}
          <rect x="43" y="4" width="58" height="36" rx="12"
            fill={brainParts > 0 ? '#4A90E2' : 'none'}
            stroke={brainParts > 0 ? '#4A90E2' : '#C8C8C8'} strokeWidth="2.5"
            opacity={brainParts > 0 ? 0.92 : 1}
          />

          {/* Eyes — Debug */}
          <circle cx="59" cy="22" r="8"
            fill={eyeParts > 0 ? '#E24A4A' : 'none'}
            stroke={eyeParts > 0 ? '#E24A4A' : '#C8C8C8'} strokeWidth="2"
          />
          <circle cx="87" cy="22" r="8"
            fill={eyeParts > 0 ? '#E24A4A' : 'none'}
            stroke={eyeParts > 0 ? '#E24A4A' : '#C8C8C8'} strokeWidth="2"
          />
          {eyeParts > 0 && <>
            <circle cx="59" cy="22" r="3.5" fill="white" opacity="0.65" />
            <circle cx="87" cy="22" r="3.5" fill="white" opacity="0.65" />
          </>}

          {/* Neck */}
          <rect x="63" y="40" width="20" height="8" rx="4"
            fill={brainParts > 0 ? 'rgba(74,144,226,0.22)' : 'none'}
            stroke={brainParts > 0 ? 'rgba(74,144,226,0.55)' : '#DDDDDD'} strokeWidth="1.5"
          />

          {/* Torso — Constraints */}
          <rect x="24" y="48" width="98" height="26" rx="10"
            fill={gearParts > 0 ? '#F5A623' : 'none'}
            stroke={gearParts > 0 ? '#F5A623' : '#C8C8C8'} strokeWidth="2.5"
            opacity={gearParts > 0 ? 0.92 : 1}
          />
          {gearParts > 0 && <>
            <circle cx="50" cy="61" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <circle cx="74" cy="61" r="5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <circle cx="98" cy="61" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          </>}

          {/* Mastery core */}
          {masteryUnlocked && (
            <circle cx="74" cy="61" r="5.5" fill="#9B4AE2" opacity="0.95" />
          )}

          {/* Arms — Structure */}
          <rect x="4" y="50" width="18" height="22" rx="6"
            fill={armParts > 0 ? '#4AE27A' : 'none'}
            stroke={armParts > 0 ? '#4AE27A' : '#C8C8C8'} strokeWidth="2.5"
            opacity={armParts > 0 ? 0.92 : 1}
          />
          <rect x="124" y="50" width="18" height="22" rx="6"
            fill={armParts > 0 ? '#4AE27A' : 'none'}
            stroke={armParts > 0 ? '#4AE27A' : '#C8C8C8'} strokeWidth="2.5"
            opacity={armParts > 0 ? 0.92 : 1}
          />
        </svg>
      </div>

      {/* ── CONVEYOR BELT ────────────────────────── */}
      <div className="relative z-10 shrink-0" style={{ height: '60px' }} aria-hidden="true">
        <svg width="100%" height="60" viewBox="0 0 360 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="beltClip">
              <rect x="42" y="34" width="276" height="22" />
            </clipPath>
          </defs>

          {/* Belt shadow */}
          <rect x="42" y="38" width="276" height="18" rx="10" fill="rgba(0,0,0,0.07)" />

          {/* Belt body */}
          <rect x="42" y="32" width="276" height="24" rx="12" fill="#E8E8E8" />

          {/* Scrolling ridges */}
          <g clipPath="url(#beltClip)">
            <g style={{ animation: 'beltScroll 0.9s linear infinite' }}>
              {Array.from({ length: 20 }, (_, i) => (
                <rect key={i} x={i * 20 - 10} y="34" width="13" height="22" rx="3" fill="#DCDCDC" />
              ))}
            </g>
          </g>

          {/* Top highlight */}
          <rect x="42" y="32" width="276" height="3" rx="2" fill="rgba(255,255,255,0.75)" />

          {/* Left gear */}
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from="0 28 44" to="360 28 44" dur="2s" repeatCount="indefinite" />
            <polygon points={leftGear} fill="#D4D4D4" stroke="#BEBEBE" strokeWidth="1" />
            <circle cx="28" cy="44" r="5" fill="#C0C0C0" />
            <circle cx="28" cy="44" r="2" fill="#A8A8A8" />
          </g>

          {/* Right gear */}
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from="0 332 44" to="-360 332 44" dur="2s" repeatCount="indefinite" />
            <polygon points={rightGear} fill="#D4D4D4" stroke="#BEBEBE" strokeWidth="1" />
            <circle cx="332" cy="44" r="5" fill="#C0C0C0" />
            <circle cx="332" cy="44" r="2" fill="#A8A8A8" />
          </g>

          {/* Parts floating above belt */}
          <text x="84"  y="28" textAnchor="middle" fontSize="20"
            className={brainParts > 0 ? 'part-glow-1' : 'part-grey'}
            style={{ transformOrigin: '84px 18px' }}>🧠</text>

          <text x="150" y="28" textAnchor="middle" fontSize="20"
            className={gearParts > 0 ? 'part-glow-2' : 'part-grey'}
            style={{ transformOrigin: '150px 18px' }}>⚙️</text>

          <text x="210" y="28" textAnchor="middle" fontSize="20"
            className={armParts > 0 ? 'part-glow-3' : 'part-grey'}
            style={{ transformOrigin: '210px 18px' }}>🦾</text>

          <text x="276" y="28" textAnchor="middle" fontSize="20"
            className={eyeParts > 0 ? 'part-glow-4' : 'part-grey'}
            style={{ transformOrigin: '276px 18px' }}>👁️</text>

          <text x="332" y="28" textAnchor="middle" fontSize="20"
            className={masteryUnlocked ? 'part-glow-5' : 'part-grey'}
            style={{ transformOrigin: '332px 18px' }}>❤️</text>
        </svg>
      </div>

      {/* ── WORLD TILES ──────────────────────────── */}
      <div
        className="relative z-10 flex-1 min-h-0 px-4 py-2 grid grid-cols-2 grid-rows-2 gap-3"
        role="list"
        aria-label="Game worlds"
      >
        {WORLDS.map((world) => {
          const isActive = world.id === activeWorld
          const progressPct = world.levelCount > 0
            ? Math.min((world.levelsComplete / world.levelCount) * 100, 100)
            : 0

          return (
            <Link
              key={world.id}
              href={world.href}
              className="wii-tile relative rounded-3xl flex-col items-center justify-center p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(150deg, ${world.gradientFrom} 0%, ${world.gradientTo} 100%)`,
                boxShadow: `
                  inset 0 1.5px 0 rgba(255,255,255,0.4),
                  inset 0 -2.5px 0 rgba(0,0,0,0.18),
                  0 8px 28px ${world.accent}60,
                  0 2px 6px rgba(0,0,0,0.1)
                `,
              }}
              role="listitem"
              aria-label={`${world.name} — ${world.levelsComplete}/${world.levelCount} levels`}
            >
              {isActive && (
                <div className="robot-float absolute top-2.5 right-2.5" aria-hidden="true">
                  <RobotSVG config={robotConfig} size={20} headOnly />
                </div>
              )}

              {world.completed && (
                <span className="absolute top-2.5 left-2.5 text-lg leading-none" aria-hidden="true">⭐</span>
              )}

              <span className="text-5xl leading-none mb-2" role="img" aria-hidden="true">
                {world.emoji}
              </span>

              <h2 className="fredoka font-black text-xl text-white text-center leading-tight">
                {world.name}
              </h2>

              <p className="text-sm font-bold mt-1 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {world.levelsComplete}/{world.levelCount}
              </p>

              <div className="w-full mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.22)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.6)' }}
                />
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── MASTERY TILE ─────────────────────────── */}
      <div className="relative z-10 shrink-0 px-4 pb-2">
        {masteryUnlocked ? (
          <Link
            href="/dashboard/mastery"
            className="wii-tile items-center gap-4 rounded-3xl px-5 py-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
            style={{
              background: 'linear-gradient(135deg, #B06AE8 0%, #7B2EBD 100%)',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.3), inset 0 -2.5px 0 rgba(0,0,0,0.2), 0 6px 22px rgba(155,74,226,0.55)',
            }}
            role="listitem"
            aria-label="Mastery — Enter the Mastery world"
          >
            <span className="text-3xl leading-none">❤️</span>
            <div className="flex-1">
              <h2 className="fredoka text-xl font-black text-white">MASTERY</h2>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>The Core · Double XP</p>
            </div>
            <span className="text-3xl font-thin leading-none" style={{ color: 'rgba(255,255,255,0.45)' }}>›</span>
          </Link>
        ) : (
          <div
            className="flex items-center gap-4 rounded-3xl px-5 py-3"
            style={{
              background: 'linear-gradient(135deg, #C8C8C8 0%, #AAAAAA 100%)',
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)',
            }}
            role="listitem"
            aria-disabled="true"
            aria-label="Mastery locked — Score 80+ on Level 1 of all worlds"
          >
            <span className="text-3xl leading-none" style={{ opacity: 0.55 }}>🔒</span>
            <div className="flex-1">
              <h2 className="fredoka text-xl font-black text-white">MASTERY</h2>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Score 80+ on Level 1 of all worlds</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER LINKS ─────────────────────────── */}
      <div className="relative z-10 shrink-0 flex items-center justify-center text-xs pb-3 pt-1" style={{ color: '#CCCCCC' }}>
        <a href="/privacy" className="transition-colors hover:text-[#1A1A1A] px-2">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms"   className="transition-colors hover:text-[#1A1A1A] px-2">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/support" className="transition-colors hover:text-[#1A1A1A] px-2">Support</a>
        {user.email === 'vesorestyle@gmail.com' && (
          <>
            <span aria-hidden="true">·</span>
            <a href="/admin" className="transition-colors hover:text-[#1A1A1A] px-2">Admin</a>
          </>
        )}
      </div>

    </main>
  )
}
