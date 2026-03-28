import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const CLARITY_LEVEL_COUNT     = 10
const CONSTRAINTS_LEVEL_COUNT = 10

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: xpRows },
    { data: streakRow },
    { data: clarityScoreRows },
    { data: constraintsScoreRows },
    { data: profile },
  ] = await Promise.all([
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'constraints'),
    supabase.from('profiles').select('name, robot_config').eq('id', user.id).maybeSingle(),
  ])

  const displayName = profile?.name ?? user.email ?? ''
  const firstName   = displayName.split(' ')[0]

  const rawRobotConfig = (profile as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobotConfig && typeof rawRobotConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobotConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  // Total XP
  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalXp = Array.from(bestPerLevel.values()).reduce((sum, v) => sum + v, 0)
  const streak  = streakRow?.current_streak ?? 0

  // Clarity progress
  const clarityBest = new Map<number, number>()
  for (const row of clarityScoreRows ?? []) {
    const cur = clarityBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) clarityBest.set(row.level, row.score)
  }
  const clarityCompleted   = clarityBest.size === CLARITY_LEVEL_COUNT
  const clarityAvg         = clarityCompleted
    ? Array.from(clarityBest.values()).reduce((a, b) => a + b, 0) / CLARITY_LEVEL_COUNT : 0
  const clarityAllComplete = clarityCompleted && Array.from(clarityBest.values()).every(s => s >= 60)
  const constraintsUnlocked = clarityCompleted && clarityAvg >= 80

  // Constraints progress
  const constraintsBest = new Map<number, number>()
  for (const row of constraintsScoreRows ?? []) {
    const cur = constraintsBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) constraintsBest.set(row.level, row.score)
  }
  const constraintsAllComplete = constraintsBest.size >= CONSTRAINTS_LEVEL_COUNT &&
    Array.from(constraintsBest.values()).every(s => s >= 60)

  // Active world = most advanced world the user has started
  const activeWorld = (constraintsUnlocked && constraintsBest.size > 0) ? 'constraints' : 'clarity'

  const WORLDS = [
    {
      id:         'clarity',
      name:       'CLARITY',
      subtitle:   'The Brain',
      emoji:      '🧠',
      levelCount: CLARITY_LEVEL_COUNT,
      accent:     '#00FF88',
      accentRgb:  '0,255,136',
      href:       '/dashboard/clarity',
      locked:     false,
      completed:  clarityAllComplete,
      lockMessage: '',
    },
    {
      id:         'constraints',
      name:       'CONSTRAINTS',
      subtitle:   'The Gears',
      emoji:      '⚙️',
      levelCount: CONSTRAINTS_LEVEL_COUNT,
      accent:     '#B87333',
      accentRgb:  '184,115,51',
      href:       constraintsUnlocked ? '/dashboard/constraints' : undefined,
      locked:     !constraintsUnlocked,
      completed:  constraintsAllComplete,
      lockMessage: 'Complete Clarity 80+ avg',
    },
    {
      id:         'structure',
      name:       'STRUCTURE',
      subtitle:   'The Arms',
      emoji:      '🦾',
      levelCount: 10,
      accent:     '#8B8FA8',
      accentRgb:  '139,143,168',
      href:       undefined,
      locked:     true,
      completed:  false,
      lockMessage: 'Coming soon',
    },
    {
      id:         'debug',
      name:       'DEBUG',
      subtitle:   'The Eyes',
      emoji:      '👁️',
      levelCount: 10,
      accent:     '#C84B1F',
      accentRgb:  '200,75,31',
      href:       undefined,
      locked:     true,
      completed:  false,
      lockMessage: 'Coming soon',
    },
  ]

  // Deterministic particles (SSR-safe, no hydration mismatch)
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left:     `${(i * 127 + 43) % 97}%`,
    top:      `${(i * 83 + 17) % 93}%`,
    delay:    `${((i * 53) % 40) / 10}s`,
    duration: `${4 + ((i * 37) % 40) / 10}s`,
    size:     ((i * 29) % 3) + 1,
  }))

  return (
    <main
      className="text-white overflow-hidden flex flex-col relative"
      style={{ background: '#0F0F0F', height: '100dvh' }}
    >
      {/* Scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        }}
        aria-hidden="true"
      />

      {/* Neon grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: '#00FF88',
            animation: `particleDrift ${p.duration} ${p.delay} ease-in-out infinite`,
            opacity: 0,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ── TOP BAR ─────────────────────────────── */}
      {/* Three-column grid: spacer | logo | avatar — keeps logo truly centered */}
      <div className="relative z-10 shrink-0 grid grid-cols-3 items-center px-4 pt-4 pb-1">
        {/* Left: empty spacer (mirrors avatar width) */}
        <div className="w-12 h-12" />

        {/* Center: ZEPTIO logo */}
        <div className="flex justify-center">
          <span
            className="font-mono font-black tracking-widest text-3xl sm:text-4xl uppercase"
            style={{
              color: '#00FF88',
              textShadow: '0 0 20px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.35)',
            }}
            aria-label="Zeptio"
          >
            Zeptio
          </span>
        </div>

        {/* Right: avatar */}
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

      {/* ── PILLS ───────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex flex-row items-center justify-center gap-3 sm:gap-6 px-4 py-2"
        aria-label="Your stats"
      >
        <div
          className="inline-flex items-center justify-center rounded-full text-base font-bold whitespace-nowrap px-8 py-3"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}
        >
          <span className="text-white">Score</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#00FF88] tabular-nums">{totalXp}</span>
        </div>
        <div
          className="inline-flex items-center justify-center rounded-full text-base font-bold whitespace-nowrap px-8 py-3"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}
        >
          <span className="text-white">🔥 Streak</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#00FF88] tabular-nums">{streak}</span>
        </div>
      </div>

      {/* ── WORLD GRID ──────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 px-3 sm:px-6 py-3 flex flex-col gap-3 sm:gap-4">

        {/* Per-world hover glow styles */}
        <style>{`
          .world-card-clarity:hover  { box-shadow: 0 0 0 1.5px #00FF88, 0 0 24px rgba(0,255,136,0.35); }
          .world-card-constraints:hover { box-shadow: 0 0 0 1.5px #B87333, 0 0 24px rgba(184,115,51,0.35); }
          .world-card-structure:hover { box-shadow: 0 0 0 1.5px #8B8FA8, 0 0 24px rgba(139,143,168,0.25); }
          .world-card-debug:hover    { box-shadow: 0 0 0 1.5px #C84B1F, 0 0 24px rgba(200,75,31,0.35); }
          @keyframes masteryPulse {
            0%, 100% { box-shadow: 0 0 0 1.5px rgba(255,0,68,0.4), 0 0 20px rgba(255,0,68,0.2); }
            50%       { box-shadow: 0 0 0 1.5px rgba(255,0,68,0.9), 0 0 40px rgba(255,0,68,0.5); }
          }
          .world-card-mastery { animation: masteryPulse 2.4s ease-in-out infinite; }
        `}</style>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorld

            const cardContent = (
              <>
                {/* Top edge accent gradient */}
                <div
                  className="absolute top-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: '3px',
                    background: `linear-gradient(90deg, transparent, ${world.accent}, transparent)`,
                    opacity: world.locked ? 0.15 : 0.7,
                  }}
                  aria-hidden="true"
                />

                {/* Card content: emoji top, name+subtitle center, levels bottom */}
                <div className="absolute inset-0 flex flex-col items-center p-3 sm:p-4 z-10">

                  {/* Emoji area — top */}
                  <div className="relative flex items-center justify-center mt-1" aria-hidden="true">
                    <span
                      className="text-3xl sm:text-4xl leading-none"
                      style={world.locked ? { filter: 'grayscale(1)', opacity: 0.25 } : undefined}
                    >
                      {world.emoji}
                    </span>
                    {/* Padlock overlay on locked worlds */}
                    {world.locked && (
                      <span
                        className="absolute -bottom-1 -right-1 text-xs leading-none"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(200,75,31,0.6))' }}
                      >
                        🔒
                      </span>
                    )}
                  </div>

                  {/* Name + subtitle — center (flex-1 to push level count down) */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                    {/* Completed check badge */}
                    {world.completed && (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black mb-0.5"
                        style={{ background: `rgba(${world.accentRgb},0.2)`, color: world.accent }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}

                    {/* Active robot badge */}
                    {isActive && !world.locked && (
                      <div className="robot-float mb-0.5" aria-hidden="true">
                        <RobotSVG config={robotConfig} size={24} headOnly />
                      </div>
                    )}

                    {/* World name */}
                    <h2
                      className="text-sm sm:text-base font-black tracking-widest leading-none text-center"
                      style={{ color: world.locked ? 'rgba(232,232,232,0.2)' : '#E8E8E8' }}
                    >
                      {world.name}
                    </h2>

                    {/* Body part subtitle */}
                    <p
                      className="text-[10px] sm:text-[11px] font-mono tracking-wide text-center mt-0.5"
                      style={{ color: world.locked ? 'rgba(184,115,51,0.2)' : '#B87333' }}
                    >
                      {world.subtitle}
                    </p>
                  </div>

                  {/* Level count — bottom */}
                  <p
                    className="text-[9px] sm:text-[10px] font-mono text-center mb-0.5"
                    style={{ color: world.locked ? 'rgba(139,143,168,0.2)' : '#8B8FA8' }}
                  >
                    {world.levelCount} Levels
                  </p>
                </div>
              </>
            )

            const cardStyle = {
              background: world.locked
                ? '#1A1A1A'
                : `linear-gradient(160deg, rgba(${world.accentRgb},0.08) 0%, #1A1A1A 55%)`,
              border: `1.5px solid ${world.locked ? '#2A2A2A' : `rgba(${world.accentRgb},0.3)`}`,
              opacity: world.locked ? 0.6 : 1,
            }

            const baseClass = `relative rounded-2xl overflow-hidden transition-all duration-300 h-full world-card-${world.id}`

            return world.href ? (
              <Link
                key={world.id}
                href={world.href}
                className={`${baseClass} hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]`}
                style={cardStyle}
                role="listitem"
                aria-label={`${world.name} — ${world.levelCount} levels`}
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={world.id}
                className={`${baseClass} cursor-not-allowed`}
                style={cardStyle}
                role="listitem"
                aria-disabled="true"
                aria-label={`${world.name} — ${world.lockMessage}`}
              >
                {cardContent}
              </div>
            )
          })}
        </div>

        {/* ── MASTERY TEASER (full-width locked) ── */}
        <div
          className="relative rounded-2xl overflow-hidden world-card-mastery shrink-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,0,68,0.06) 0%, #1A1A1A 50%, rgba(255,0,68,0.06) 100%)',
            border: '1.5px solid rgba(255,0,68,0.25)',
            opacity: 0.7,
            height: '72px',
          }}
          role="listitem"
          aria-disabled="true"
          aria-label="Mastery — Complete all worlds to unlock"
        >
          {/* Top edge pulse */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #FF0044, transparent)',
              opacity: 0.5,
            }}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex flex-row items-center justify-center gap-3 px-5 z-10">
            {/* Emoji + padlock */}
            <div className="relative flex items-center justify-center" aria-hidden="true">
              <span className="text-2xl leading-none" style={{ filter: 'grayscale(1)', opacity: 0.3 }}>❤️</span>
              <span className="absolute -bottom-1 -right-1 text-[10px] leading-none" style={{ filter: 'drop-shadow(0 0 4px rgba(200,75,31,0.6))' }}>🔒</span>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <h2
                className="text-sm font-black tracking-widest leading-none"
                style={{ color: 'rgba(232,232,232,0.2)' }}
              >
                MASTERY
              </h2>
              <p className="text-[10px] font-mono tracking-wide" style={{ color: 'rgba(255,0,68,0.35)' }}>The Core</p>
            </div>

            <p
              className="ml-auto text-[9px] font-mono text-right leading-snug"
              style={{ color: 'rgba(139,143,168,0.3)', maxWidth: '100px' }}
            >
              Complete all worlds to unlock
            </p>
          </div>
        </div>

      </div>

      {/* ── FOOTER ──────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 flex items-center justify-center gap-0 text-xs py-3 px-4"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
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
