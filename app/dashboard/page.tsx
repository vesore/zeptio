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

  return (
    <main className="min-h-screen text-white overflow-x-hidden">

      {/* ── Header ────────────────────────────────── */}
      <header
        className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-sm"
        style={{ background: 'rgba(26,29,43,0.6)' }}
      >
        {/* 1. ZEPTIO LOGO — text-2xl font-black */}
        <span
          className="text-[#B0E020] font-mono font-black tracking-widest text-2xl uppercase shrink-0"
          aria-label="Zeptio"
        >
          Zeptio
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="hidden sm:block text-sm font-mono truncate max-w-[200px]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {user.email}
          </span>
          <Link
            href="/profile"
            aria-label="View your profile"
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ background: 'rgba(176,224,32,0.1)', border: '2px solid rgba(176,224,32,0.35)' }}
          >
            <RobotSVG config={robotConfig} size={56} headOnly />
          </Link>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 lime-radial-glow">

        {/* Welcome */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-3">
            Welcome back,{' '}
            <span style={{ color: '#B0E020' }}>{firstName}</span>!
          </h1>
          <p className="mb-5 sm:mb-7 text-sm sm:text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Choose a world to enter.
          </p>

          {/* 1. PILLS — inline-flex centered */}
          <div className="flex flex-wrap gap-3" aria-label="Your stats">
            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-5 py-3 flex-shrink-0 text-base sm:text-lg font-bold whitespace-nowrap">
              <span className="text-white">Score</span>
              <span>&nbsp;&nbsp;</span>
              <span className="text-[#B0E020] tabular-nums">{totalXp}</span>
            </div>
            <div className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-5 py-3 flex-shrink-0 text-base sm:text-lg font-bold whitespace-nowrap">
              <span className="text-white">🔥 Streak</span>
              <span>&nbsp;&nbsp;</span>
              <span className="text-[#B0E020] tabular-nums">{streak}</span>
            </div>
          </div>
        </div>

        {/* 4. WORLD GRID — bold 2×2 square cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorld

            const cardContent = (
              <>
                {/* Animated glow overlay */}
                {!world.locked && (
                  <div
                    className="card-glow absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      boxShadow: `0 0 40px rgba(${world.accentRgb},0.28), inset 0 0 28px rgba(${world.accentRgb},0.07)`,
                    }}
                  />
                )}

                {/* Top-left status badge */}
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

                {/* Top-right: robot floats on active world */}
                {isActive && !world.locked && (
                  <div className="absolute top-2 right-2 z-10 robot-float" aria-hidden="true">
                    <RobotSVG config={robotConfig} size={38} headOnly />
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
                  {world.locked && (
                    <p
                      className="text-[10px] sm:text-xs font-mono mb-1 truncate"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      {world.lockMessage}
                    </p>
                  )}
                  <h2
                    className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-none"
                    style={{ color: world.locked ? 'rgba(255,255,255,0.22)' : world.accent }}
                  >
                    {world.name}
                  </h2>
                  <p
                    className="text-xs sm:text-sm font-mono mt-1"
                    style={{ color: world.locked ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.38)' }}
                  >
                    {world.levelCount} levels
                  </p>
                </div>
              </>
            )

            const cardStyle = {
              background: world.locked
                ? 'rgba(255,255,255,0.02)'
                : `linear-gradient(145deg, rgba(${world.accentRgb},0.08) 0%, rgba(26,29,43,0.95) 60%)`,
              border: `1.5px solid ${world.locked ? 'rgba(255,255,255,0.06)' : `rgba(${world.accentRgb},0.28)`}`,
              opacity: world.locked ? 0.55 : 1,
            }

            const baseClass = 'relative aspect-square rounded-3xl overflow-hidden transition-all duration-300'

            return world.href ? (
              <Link
                key={world.id}
                href={world.href}
                className={`${baseClass} hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
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

        {/* 3. FOOTER — gap-8 for breathing room */}
        <div
          className="mt-10 sm:mt-20 pt-6 flex gap-8 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}
        >
          <a href="/privacy" className="hover:text-[#B0E020] transition-colors duration-200">Privacy</a>
          <a href="/terms"   className="hover:text-[#B0E020] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#B0E020] transition-colors duration-200">Support</a>
          {user.email === 'vesorestyle@gmail.com' && (
            <a href="/admin" className="hover:text-[#B0E020] transition-colors duration-200">Admin</a>
          )}
        </div>

      </div>
    </main>
  )
}
