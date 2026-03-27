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
      accent:     '#B0E020',
      accentRgb:  '176,224,32',
      href:       '/dashboard/clarity',
      locked:     false,
      completed:  clarityAllComplete,
      lockMessage: '',
    },
    {
      id:         'constraints',
      name:       'Constraints',
      levelCount: CONSTRAINTS_LEVEL_COUNT,
      accent:     '#00D4FF',
      accentRgb:  '0,212,255',
      href:       constraintsUnlocked ? '/dashboard/constraints' : undefined,
      locked:     !constraintsUnlocked,
      completed:  constraintsAllComplete,
      lockMessage: 'Complete Clarity 80+ avg',
    },
    {
      id:         'structure',
      name:       'Structure',
      levelCount: 10,
      accent:     '#9B59FF',
      accentRgb:  '155,89,255',
      href:       undefined,
      locked:     true,
      completed:  false,
      lockMessage: 'Coming soon',
    },
    {
      id:         'debug',
      name:       'Debug',
      levelCount: 10,
      accent:     '#FF6B35',
      accentRgb:  '255,107,53',
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
      style={{ background: '#000', height: '100dvh' }}
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
          backgroundImage: 'linear-gradient(rgba(176,224,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(176,224,32,0.04) 1px, transparent 1px)',
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
            background: '#B0E020',
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
              color: '#B0E020',
              textShadow: '0 0 20px rgba(176,224,32,0.8), 0 0 60px rgba(176,224,32,0.35)',
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
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ background: 'rgba(176,224,32,0.08)', border: '1.5px solid rgba(176,224,32,0.3)' }}
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
          style={{ background: 'rgba(176,224,32,0.06)', border: '1px solid rgba(176,224,32,0.2)' }}
        >
          <span className="text-white">Score</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#B0E020] tabular-nums">{totalXp}</span>
        </div>
        <div
          className="inline-flex items-center justify-center rounded-full text-base font-bold whitespace-nowrap px-8 py-3"
          style={{ background: 'rgba(176,224,32,0.06)', border: '1px solid rgba(176,224,32,0.2)' }}
        >
          <span className="text-white">🔥 Streak</span>
          <span>&nbsp;&nbsp;</span>
          <span className="text-[#B0E020] tabular-nums">{streak}</span>
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
                      boxShadow: `0 0 32px rgba(${world.accentRgb},0.25), inset 0 0 20px rgba(${world.accentRgb},0.06)`,
                    }}
                  />
                )}

                {/* Status badge — top left */}
                <div className="absolute top-3 left-3 z-10">
                  {world.completed ? (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-black"
                      style={{ background: `rgba(${world.accentRgb},0.2)`, color: world.accent }}
                    >
                      ✓
                    </span>
                  ) : world.locked ? (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                    >
                      🔒
                    </span>
                  ) : null}
                </div>

                {/* Robot — bottom right of active world */}
                {isActive && !world.locked && (
                  <div className="absolute bottom-10 right-3 z-10 robot-float" aria-hidden="true">
                    <RobotSVG config={robotConfig} size={36} headOnly />
                  </div>
                )}

                {/* Label — bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                  {world.locked && (
                    <p
                      className="text-[10px] font-mono mb-1 truncate"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      {world.lockMessage}
                    </p>
                  )}
                  <h2
                    className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight leading-none"
                    style={{ color: world.locked ? 'rgba(255,255,255,0.22)' : world.accent }}
                  >
                    {world.name}
                  </h2>
                  <p
                    className="text-[10px] sm:text-xs font-mono mt-1"
                    style={{ color: world.locked ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.35)' }}
                  >
                    {world.levelCount} levels
                  </p>
                </div>
              </>
            )

            const cardStyle = {
              background: world.locked
                ? 'rgba(255,255,255,0.02)'
                : `linear-gradient(145deg, rgba(${world.accentRgb},0.09) 0%, rgba(0,0,0,0.9) 65%)`,
              border: `1.5px solid ${world.locked ? 'rgba(255,255,255,0.06)' : `rgba(${world.accentRgb},0.3)`}`,
              opacity: world.locked ? 0.5 : 1,
            }

            const baseClass = 'relative rounded-2xl overflow-hidden transition-all duration-300 h-full'

            return world.href ? (
              <Link
                key={world.id}
                href={world.href}
                className={`${baseClass} hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
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
        <a href="/privacy" className="hover:text-[#B0E020] transition-colors duration-200 px-3">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms"   className="hover:text-[#B0E020] transition-colors duration-200 px-3">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/support" className="hover:text-[#B0E020] transition-colors duration-200 px-3">Support</a>
        {user.email === 'vesorestyle@gmail.com' && (
          <>
            <span aria-hidden="true">·</span>
            <a href="/admin" className="hover:text-[#B0E020] transition-colors duration-200 px-3">Admin</a>
          </>
        )}
      </div>

    </main>
  )
}
