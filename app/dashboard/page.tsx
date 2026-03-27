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
      name:       'Clarity',
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
      name:       'Constraints',
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
      name:       'Structure',
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
      name:       'Debug',
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
      <div className="relative z-10 flex-1 min-h-0 px-3 sm:px-6 py-3">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 h-full" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorld

            const cardContent = (
              <>
                {/* Animated border glow */}
                {!world.locked && (
                  <div
                    className="card-glow absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `0 0 28px rgba(${world.accentRgb},0.15), inset 0 0 16px rgba(${world.accentRgb},0.04)`,
                    }}
                  />
                )}

                {/* Centered content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 sm:p-4 z-10">

                  {/* Robot floats above name on active world */}
                  {isActive && !world.locked && (
                    <div className="robot-float mb-1" aria-hidden="true">
                      <RobotSVG config={robotConfig} size={32} headOnly />
                    </div>
                  )}

                  {/* Rust padlock for locked */}
                  {world.locked && (
                    <span
                      className="text-2xl sm:text-3xl mb-1"
                      style={{ color: '#C84B1F', filter: 'drop-shadow(0 0 6px rgba(200,75,31,0.5))' }}
                      aria-hidden="true"
                    >
                      🔒
                    </span>
                  )}

                  {/* Completed check */}
                  {world.completed && (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-black mb-1"
                      style={{ background: `rgba(${world.accentRgb},0.2)`, color: world.accent }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}

                  {/* World name */}
                  <h2
                    className="text-lg sm:text-xl font-black tracking-tight leading-none text-center"
                    style={{ color: world.locked ? 'rgba(232,232,232,0.2)' : '#E8E8E8' }}
                  >
                    {world.name}
                  </h2>

                  {/* Subtitle */}
                  <p
                    className="text-[10px] sm:text-xs font-mono mt-0.5 text-center"
                    style={{ color: world.locked ? 'rgba(139,143,168,0.3)' : '#8B8FA8' }}
                  >
                    {world.levelCount} Levels
                  </p>

                  {/* Lock message */}
                  {world.locked && world.lockMessage && (
                    <p
                      className="text-[9px] font-mono mt-1 text-center"
                      style={{ color: 'rgba(139,143,168,0.4)' }}
                    >
                      {world.lockMessage}
                    </p>
                  )}
                </div>
              </>
            )

            const cardStyle = {
              background: world.locked
                ? '#1A1A1A'
                : `linear-gradient(145deg, rgba(${world.accentRgb},0.07) 0%, #1A1A1A 60%)`,
              border: `1.5px solid ${world.locked ? '#2A2A2A' : `rgba(${world.accentRgb},0.25)`}`,
              opacity: world.locked ? 0.5 : 1,
            }

            const baseClass = 'relative rounded-2xl overflow-hidden transition-all duration-300 h-full'

            return world.href ? (
              <Link
                key={world.id}
                href={world.href}
                className={`${baseClass} world-card-link hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]`}
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
