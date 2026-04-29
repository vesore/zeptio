import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { CLARITY_LEVELS }     from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS }   from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS }       from '@/src/lib/game/debug-levels'
import DailySuggestion from '@/src/components/dashboard/DailySuggestion'
import SoundToggle from '@/src/components/SoundToggle'

const CLARITY_COUNT     = CLARITY_LEVELS.length
const CONSTRAINTS_COUNT = CONSTRAINTS_LEVELS.length
const STRUCTURE_COUNT   = STRUCTURE_LEVELS.length
const DEBUG_COUNT       = DEBUG_LEVELS.length

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

function worldAvgOf(best: Map<number, number>, count: number): number {
  if (best.size < count) return 0
  return Array.from(best.values()).reduce((a, b) => a + b, 0) / count
}

function completedLevels(best: Map<number, number>): number {
  return Array.from(best.values()).filter(s => s >= 60).length
}

/** Compute SVG polygon points for a gear centered at (cx, cy) */
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
    supabase.from('profiles').select('name, robot_config').eq('id', user.id).maybeSingle(),
  ])

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

  const clarityAllComplete     = clarityBest.size >= CLARITY_COUNT && Array.from(clarityBest.values()).every(s => s >= 60)
  const constraintsAllComplete = constraintsBest.size >= CONSTRAINTS_COUNT && Array.from(constraintsBest.values()).every(s => s >= 60)
  const structureAllComplete   = structureBest.size >= STRUCTURE_COUNT && Array.from(structureBest.values()).every(s => s >= 60)
  const debugAllComplete       = debugBest.size >= DEBUG_COUNT && Array.from(debugBest.values()).every(s => s >= 60)

  const clarityXp     = worldTotalXp(clarityBest)
  const constraintsXp = worldTotalXp(constraintsBest)
  const structureXp   = worldTotalXp(structureBest)
  const debugXp       = worldTotalXp(debugBest)

  const brainParts = partsUnlocked(clarityXp)
  const gearParts  = partsUnlocked(constraintsXp)
  const armParts   = partsUnlocked(structureXp)
  const eyeParts   = partsUnlocked(debugXp)

  const masteryUnlocked =
    (clarityBest.get(1) ?? 0) >= 80 &&
    (constraintsBest.get(11) ?? 0) >= 80 &&
    (structureBest.get(21) ?? 0) >= 80 &&
    (debugBest.get(31) ?? 0) >= 80

  const activeWorld =
    debugBest.size > 0         ? 'debug'
    : structureBest.size > 0   ? 'structure'
    : constraintsBest.size > 0 ? 'constraints'
    : 'clarity'

  const worldAvgs = [
    { id: 'clarity',     name: 'Clarity',     href: '/dashboard/clarity',     accent: '#4A90E2', avg: worldAvgOf(clarityBest, CLARITY_COUNT) },
    { id: 'constraints', name: 'Constraints', href: '/dashboard/constraints', accent: '#E2A04A', avg: worldAvgOf(constraintsBest, CONSTRAINTS_COUNT) },
    { id: 'structure',   name: 'Structure',   href: '/dashboard/structure',   accent: '#4AE27A', avg: worldAvgOf(structureBest, STRUCTURE_COUNT) },
    { id: 'debug',       name: 'Debug',       href: '/dashboard/debug',       accent: '#E24A4A', avg: worldAvgOf(debugBest, DEBUG_COUNT) },
  ]
  const worldsAttempted = worldAvgs.filter(w => w.avg > 0)
  const weakestWorld = worldsAttempted.length > 0
    ? worldsAttempted.reduce((a, b) => a.avg < b.avg ? a : b)
    : null

  type WorldDef = {
    id: string; name: string; subtitle: string; emoji: string; levelCount: number;
    accent: string; accentRgb: string; href: string; completed: boolean;
    parts: number; totalXp: number; partLabel: string; levelsComplete: number;
  }

  const WORLDS: WorldDef[] = [
    {
      id: 'clarity', name: 'CLARITY', subtitle: 'The Brain', emoji: '🧠',
      levelCount: CLARITY_COUNT, accent: '#4A90E2', accentRgb: '74,144,226',
      href: '/dashboard/clarity', completed: clarityAllComplete,
      parts: brainParts, totalXp: clarityXp, partLabel: 'Brain Parts',
      levelsComplete: completedLevels(clarityBest),
    },
    {
      id: 'constraints', name: 'CONSTRAINTS', subtitle: 'The Gears', emoji: '⚙️',
      levelCount: CONSTRAINTS_COUNT, accent: '#E2A04A', accentRgb: '226,160,74',
      href: '/dashboard/constraints', completed: constraintsAllComplete,
      parts: gearParts, totalXp: constraintsXp, partLabel: 'Gear Parts',
      levelsComplete: completedLevels(constraintsBest),
    },
    {
      id: 'structure', name: 'STRUCTURE', subtitle: 'The Arms', emoji: '🦾',
      levelCount: STRUCTURE_COUNT, accent: '#4AE27A', accentRgb: '74,226,122',
      href: '/dashboard/structure', completed: structureAllComplete,
      parts: armParts, totalXp: structureXp, partLabel: 'Arm Parts',
      levelsComplete: completedLevels(structureBest),
    },
    {
      id: 'debug', name: 'DEBUG', subtitle: 'The Eyes', emoji: '👁️',
      levelCount: DEBUG_COUNT, accent: '#E24A4A', accentRgb: '226,74,74',
      href: '/dashboard/debug', completed: debugAllComplete,
      parts: eyeParts, totalXp: debugXp, partLabel: 'Eye Parts',
      levelsComplete: completedLevels(debugBest),
    },
  ]

  // Pre-compute belt parts gear polygon points (server-side)
  const leftGear  = gearPoints(28, 44, 15, 10, 8)
  const rightGear = gearPoints(332, 44, 15, 10, 8)

  return (
    <main
      className="overflow-hidden flex flex-col relative"
      style={{ background: '#FFFFFF', height: '100dvh', color: '#1A1A1A' }}
    >
      <style>{`
        @keyframes masteryCardPulse {
          0%,100% { box-shadow: 0 0 0 1.5px rgba(155,74,226,0.3), 0 4px 16px rgba(155,74,226,0.08); }
          50%      { box-shadow: 0 0 0 1.5px rgba(155,74,226,0.7), 0 8px 28px rgba(155,74,226,0.2); }
        }
        .mastery-card-pulse { animation: masteryCardPulse 2.4s ease-in-out infinite; }

        .world-card-clarity:hover     { box-shadow: 0 6px 24px rgba(74,144,226,0.18); border-color: #4A90E2 !important; }
        .world-card-constraints:hover { box-shadow: 0 6px 24px rgba(226,160,74,0.18); border-color: #E2A04A !important; }
        .world-card-structure:hover   { box-shadow: 0 6px 24px rgba(74,226,122,0.18); border-color: #4AE27A !important; }
        .world-card-debug:hover       { box-shadow: 0 6px 24px rgba(226,74,74,0.18); border-color: #E24A4A !important; }

        @keyframes partGlow1 { 0%,100%{filter:drop-shadow(0 0 4px #4A90E2);} 50%{filter:drop-shadow(0 0 10px #4A90E2);} }
        @keyframes partGlow2 { 0%,100%{filter:drop-shadow(0 0 4px #E2A04A);} 50%{filter:drop-shadow(0 0 10px #E2A04A);} }
        @keyframes partGlow3 { 0%,100%{filter:drop-shadow(0 0 4px #4AE27A);} 50%{filter:drop-shadow(0 0 10px #4AE27A);} }
        @keyframes partGlow4 { 0%,100%{filter:drop-shadow(0 0 4px #E24A4A);} 50%{filter:drop-shadow(0 0 10px #E24A4A);} }
        @keyframes partGlow5 { 0%,100%{filter:drop-shadow(0 0 4px #9B4AE2);} 50%{filter:drop-shadow(0 0 10px #9B4AE2);} }

        .part-glow-1 { animation: partBob1 2.1s ease-in-out infinite, partGlow1 1.8s ease-in-out infinite; }
        .part-glow-2 { animation: partBob2 1.9s ease-in-out infinite, partGlow2 2.2s ease-in-out infinite; }
        .part-glow-3 { animation: partBob3 2.4s ease-in-out infinite, partGlow3 1.9s ease-in-out infinite; }
        .part-glow-4 { animation: partBob4 2.0s ease-in-out infinite, partGlow4 2.1s ease-in-out infinite; }
        .part-glow-5 { animation: partBob5 2.2s ease-in-out infinite, partGlow5 2.0s ease-in-out infinite; }

        .part-grey { animation: partBob1 2.5s ease-in-out infinite; filter: grayscale(1); opacity: 0.3; }
      `}</style>

      {/* ── TOP BAR ──────────────────────────────── */}
      <div className="relative z-10 shrink-0 grid grid-cols-3 items-center px-4 pt-3 pb-1">
        <div className="flex justify-start">
          <Link
            href="/journal"
            className="text-xs font-mono transition-colors duration-200"
            style={{ color: '#AAAAAA' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#1A1A1A')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#AAAAAA')}
            aria-label="Learning Journal"
          >
            Journal
          </Link>
        </div>

        <div className="flex justify-center">
          <span
            className="font-black tracking-widest text-2xl sm:text-3xl uppercase"
            style={{ color: '#1A1A1A', fontFamily: 'Arial, sans-serif', letterSpacing: '0.15em' }}
            aria-label="Zeptio"
          >
            Zeptio
          </span>
        </div>

        <div className="flex justify-end items-center gap-2">
          <SoundToggle />
          <Link
            href="/profile"
            aria-label="View your profile"
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2"
            style={{ background: '#F5F5F5', border: '1.5px solid #E0E0E0' }}
          >
            <RobotSVG config={robotConfig} size={40} headOnly />
          </Link>
        </div>
      </div>

      {/* ── STATS PILLS ──────────────────────────── */}
      <div className="relative z-10 shrink-0 flex flex-row items-center justify-center gap-3 px-4 py-1.5" aria-label="Your stats">
        <div className="inline-flex items-center justify-center rounded-full text-sm font-bold whitespace-nowrap px-5 py-2"
          style={{ background: '#F5F5F5', border: '1.5px solid #E0E0E0' }}>
          <span style={{ color: '#666666' }}>Score</span>
          <span>&nbsp;&nbsp;</span>
          <span className="tabular-nums" style={{ color: '#1A1A1A' }}>{totalXp}</span>
        </div>
        <div className="inline-flex items-center justify-center rounded-full text-sm font-bold whitespace-nowrap px-5 py-2"
          style={{ background: '#F5F5F5', border: '1.5px solid #E0E0E0' }}>
          <span style={{ color: '#666666' }}>🔥 Streak</span>
          <span>&nbsp;&nbsp;</span>
          <span className="tabular-nums" style={{ color: '#1A1A1A' }}>{streak}</span>
        </div>
      </div>

      {/* ── WORLD GRID + MASTERY + SUGGESTION ─── */}
      <div className="relative z-10 flex-1 min-h-0 px-3 sm:px-5 py-1.5 flex flex-col gap-2">

        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorld
            const nextThreshold = nextPartThreshold(world.totalXp)

            return (
              <Link
                key={world.id}
                href={world.href}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col world-card-${world.id} hover:scale-[1.02] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid #E8E8E8`,
                  borderLeft: `4px solid ${world.accent}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  minHeight: 0,
                  padding: '10px 12px 10px 10px',
                }}
                role="listitem"
                aria-label={`${world.name} — ${world.levelsComplete}/${world.levelCount} levels, ${world.parts}/5 parts`}
              >
                {/* Active world robot indicator */}
                {isActive && (
                  <div className="robot-float absolute top-1 right-1" aria-hidden="true">
                    <RobotSVG config={robotConfig} size={16} headOnly />
                  </div>
                )}

                {/* Emoji + Name row */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl leading-none" aria-hidden="true">{world.emoji}</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="text-[10px] font-black tracking-widest leading-none truncate"
                        style={{ color: '#1A1A1A' }}>
                        {world.name}
                      </h2>
                      {world.completed && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-black flex-shrink-0"
                          style={{ background: `rgba(${world.accentRgb},0.15)`, color: world.accent }}>✓</span>
                      )}
                    </div>
                    <p className="text-[9px] font-medium" style={{ color: '#888888' }}>
                      {world.subtitle}
                    </p>
                  </div>
                </div>

                {/* Progress fraction */}
                <p className="text-[10px] font-bold tabular-nums" style={{ color: world.accent }}>
                  {world.levelsComplete}/{world.levelCount} levels
                </p>

                {/* XP bar */}
                <div className="w-full h-1 rounded-full overflow-hidden mt-1.5"
                  style={{ background: '#F0F0F0' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min((world.totalXp / 1000) * 100, 100)}%`,
                      background: world.accent,
                      opacity: 0.8,
                    }} />
                </div>
                <p className="text-[7px] font-mono tabular-nums mt-0.5" style={{ color: '#BBBBBB' }}>
                  {world.parts < 5 ? `${world.totalXp}/${nextThreshold} xp` : 'All parts ✓'}
                </p>
              </Link>
            )
          })}
        </div>

        {/* ── MASTERY ROW ── */}
        {masteryUnlocked ? (
          <Link
            href="/dashboard/mastery"
            className="mastery-card-pulse relative rounded-xl overflow-hidden shrink-0 hover:scale-[1.01] transition-transform duration-300 flex items-center gap-3 px-4"
            style={{
              background: 'rgba(155,74,226,0.06)',
              border: '1.5px solid rgba(155,74,226,0.35)',
              borderLeft: '4px solid #9B4AE2',
              height: '52px',
            }}
            role="listitem"
            aria-label="Mastery — Enter the Mastery world"
          >
            <span className="text-xl leading-none">❤️</span>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black tracking-widest" style={{ color: '#1A1A1A' }}>MASTERY</h2>
              <p className="text-[9px] font-medium" style={{ color: '#9B4AE2' }}>The Core · Double XP</p>
            </div>
          </Link>
        ) : (
          <div
            className="mastery-card-pulse relative rounded-xl overflow-hidden shrink-0 flex items-center gap-3 px-4"
            style={{
              background: '#FAFAFA',
              border: '1.5px solid #EEEEEE',
              borderLeft: '4px solid #DDDDDD',
              height: '52px',
              opacity: 0.7,
            }}
            role="listitem" aria-disabled="true"
            aria-label="Mastery locked — Score 80+ on Level 1 of all worlds"
          >
            <span className="text-xl leading-none" style={{ filter: 'grayscale(1)', opacity: 0.3 }}>❤️</span>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black tracking-widest" style={{ color: '#BBBBBB' }}>MASTERY</h2>
              <p className="text-[9px] font-medium" style={{ color: '#CCCCCC' }}>Score 80+ on Level 1 of all worlds 🔒</p>
            </div>
          </div>
        )}

        {/* ── DAILY SUGGESTION ── */}
        {weakestWorld && (
          <DailySuggestion
            worldName={weakestWorld.name}
            worldHref={weakestWorld.href}
            worldAccent={weakestWorld.accent}
          />
        )}
      </div>

      {/* ── ROBOT ASSEMBLY AREA ──────────────────── */}
      <div className="relative z-10 shrink-0 flex flex-col items-center" style={{ height: '88px' }}
        aria-label="Robot assembly progress" aria-hidden="true">
        <p className="text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: '#CCCCCC' }}>
          Assembly
        </p>
        <svg width="130" height="76" viewBox="0 0 130 76" aria-hidden="true">
          {/* Platform */}
          <ellipse cx="65" cy="74" rx="48" ry="4" fill="#F0F0F0" />

          {/* Head — Clarity/Brain */}
          <rect x="37" y="4" width="52" height="32" rx="10"
            fill={brainParts > 0 ? '#4A90E2' : 'none'}
            stroke={brainParts > 0 ? '#4A90E2' : '#DDDDDD'}
            strokeWidth="2"
            opacity={brainParts > 0 ? 0.85 : 1}
          />

          {/* Eyes — Debug */}
          <circle cx="51" cy="20" r="7"
            fill={eyeParts > 0 ? '#E24A4A' : 'none'}
            stroke={eyeParts > 0 ? '#E24A4A' : '#DDDDDD'}
            strokeWidth="1.5"
            opacity={eyeParts > 0 ? 0.9 : 1}
          />
          <circle cx="79" cy="20" r="7"
            fill={eyeParts > 0 ? '#E24A4A' : 'none'}
            stroke={eyeParts > 0 ? '#E24A4A' : '#DDDDDD'}
            strokeWidth="1.5"
            opacity={eyeParts > 0 ? 0.9 : 1}
          />
          {eyeParts > 0 && <>
            <circle cx="51" cy="20" r="3" fill="white" opacity="0.6" />
            <circle cx="79" cy="20" r="3" fill="white" opacity="0.6" />
          </>}

          {/* Neck */}
          <rect x="56" y="36" width="18" height="8" rx="3"
            fill={brainParts > 0 ? 'rgba(74,144,226,0.15)' : 'none'}
            stroke={brainParts > 0 ? 'rgba(74,144,226,0.4)' : '#EEEEEE'}
            strokeWidth="1"
          />

          {/* Torso — Constraints/Gears */}
          <rect x="22" y="44" width="86" height="26" rx="8"
            fill={gearParts > 0 ? '#E2A04A' : 'none'}
            stroke={gearParts > 0 ? '#E2A04A' : '#DDDDDD'}
            strokeWidth="2"
            opacity={gearParts > 0 ? 0.85 : 1}
          />
          {gearParts > 0 && <>
            <circle cx="48" cy="57" r="5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
            <circle cx="65" cy="57" r="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
            <circle cx="82" cy="57" r="5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
          </>}

          {/* Core heart — Mastery */}
          {masteryUnlocked && (
            <circle cx="65" cy="57" r="5" fill="#9B4AE2" opacity="0.95" />
          )}

          {/* Left arm — Structure */}
          <rect x="4" y="46" width="16" height="20" rx="5"
            fill={armParts > 0 ? '#4AE27A' : 'none'}
            stroke={armParts > 0 ? '#4AE27A' : '#DDDDDD'}
            strokeWidth="2"
            opacity={armParts > 0 ? 0.85 : 1}
          />

          {/* Right arm — Structure */}
          <rect x="110" y="46" width="16" height="20" rx="5"
            fill={armParts > 0 ? '#4AE27A' : 'none'}
            stroke={armParts > 0 ? '#4AE27A' : '#DDDDDD'}
            strokeWidth="2"
            opacity={armParts > 0 ? 0.85 : 1}
          />
        </svg>
      </div>

      {/* ── CONVEYOR BELT ────────────────────────── */}
      <div className="relative z-10 shrink-0" style={{ height: '76px' }} aria-hidden="true">
        <svg width="100%" height="76" viewBox="0 0 360 76" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="beltClip">
              <rect x="30" y="46" width="300" height="22" />
            </clipPath>
          </defs>

          {/* Belt shadow */}
          <rect x="30" y="52" width="300" height="18" rx="4" fill="rgba(0,0,0,0.07)" />

          {/* Belt base */}
          <rect x="30" y="46" width="300" height="22" rx="4" fill="#D4D4D4" />

          {/* Scrolling belt ridges */}
          <g clipPath="url(#beltClip)">
            <g style={{ animation: 'beltScroll 0.9s linear infinite' }}>
              {Array.from({ length: 22 }, (_, i) => (
                <rect key={i} x={i * 20 - 20} y="48" width="13" height="18" rx="2.5" fill="#C4C4C4" />
              ))}
            </g>
          </g>

          {/* Belt top highlight */}
          <rect x="30" y="46" width="300" height="3" rx="2" fill="rgba(255,255,255,0.4)" />

          {/* Left gear */}
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from="0 28 57" to="360 28 57" dur="2s" repeatCount="indefinite" />
            <polygon points={leftGear} fill="#B8B8B8" stroke="#A0A0A0" strokeWidth="1" />
            <circle cx="28" cy="57" r="5" fill="#909090" />
            <circle cx="28" cy="57" r="2" fill="#787878" />
          </g>

          {/* Right gear */}
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from="0 332 57" to="-360 332 57" dur="2s" repeatCount="indefinite" />
            <polygon points={rightGear} fill="#B8B8B8" stroke="#A0A0A0" strokeWidth="1" />
            <circle cx="332" cy="57" r="5" fill="#909090" />
            <circle cx="332" cy="57" r="2" fill="#787878" />
          </g>

          {/* Parts on belt */}
          {/* Brain — Clarity */}
          <text x="72" y="42" textAnchor="middle" fontSize="22"
            className={brainParts > 0 ? 'part-glow-1' : 'part-grey'}
            style={{ transformOrigin: '72px 38px' }}
          >🧠</text>

          {/* Gears — Constraints */}
          <text x="134" y="42" textAnchor="middle" fontSize="22"
            className={gearParts > 0 ? 'part-glow-2' : 'part-grey'}
            style={{ transformOrigin: '134px 38px' }}
          >⚙️</text>

          {/* Arms — Structure */}
          <text x="196" y="42" textAnchor="middle" fontSize="22"
            className={armParts > 0 ? 'part-glow-3' : 'part-grey'}
            style={{ transformOrigin: '196px 38px' }}
          >🦾</text>

          {/* Eyes — Debug */}
          <text x="258" y="42" textAnchor="middle" fontSize="22"
            className={eyeParts > 0 ? 'part-glow-4' : 'part-grey'}
            style={{ transformOrigin: '258px 38px' }}
          >👁️</text>

          {/* Core — Mastery */}
          <text x="316" y="42" textAnchor="middle" fontSize="22"
            className={masteryUnlocked ? 'part-glow-5' : 'part-grey'}
            style={{ transformOrigin: '316px 38px' }}
          >❤️</text>
        </svg>
      </div>

      {/* ── FOOTER ──────────────────────────────── */}
      <div className="relative z-10 shrink-0 flex items-center justify-center gap-0 text-xs py-1.5 px-4"
        style={{ color: '#BBBBBB' }}>
        <a href="/privacy" className="transition-colors duration-200 px-3 hover:text-[#1A1A1A]">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms"   className="transition-colors duration-200 px-3 hover:text-[#1A1A1A]">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/support" className="transition-colors duration-200 px-3 hover:text-[#1A1A1A]">Support</a>
        {user.email === 'vesorestyle@gmail.com' && (
          <>
            <span aria-hidden="true">·</span>
            <a href="/admin" className="transition-colors duration-200 px-3 hover:text-[#1A1A1A]">Admin</a>
          </>
        )}
      </div>

    </main>
  )
}
