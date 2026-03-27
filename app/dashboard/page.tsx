import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

const CLARITY_LEVEL_COUNT = 10

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: xpRows }, { data: streakRow }, { data: clarityScoreRows }, { data: profile }] = await Promise.all([
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('profiles').select('name, robot_config').eq('id', user.id).maybeSingle(),
  ])

  const displayName = profile?.name ?? user.email ?? ''
  const firstName = displayName.split(' ')[0]

  const rawRobotConfig = (profile as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawRobotConfig && typeof rawRobotConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawRobotConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  // Sum of best score (amount) per level
  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalXp = Array.from(bestPerLevel.values()).reduce((sum, v) => sum + v, 0)

  const streak  = streakRow?.current_streak ?? 0

  // Best score per clarity level
  const clarityBest = new Map<number, number>()
  for (const row of clarityScoreRows ?? []) {
    const cur = clarityBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) clarityBest.set(row.level, row.score)
  }

  // Constraints unlocks when all 10 clarity levels have an average best score >= 80
  const clarityCompleted = clarityBest.size === CLARITY_LEVEL_COUNT
  const clarityAvg = clarityCompleted
    ? Array.from(clarityBest.values()).reduce((a, b) => a + b, 0) / CLARITY_LEVEL_COUNT
    : 0
  const constraintsUnlocked = clarityCompleted && clarityAvg >= 80

  const WORLDS = [
    {
      id: 'clarity',
      name: 'Clarity',
      description: 'Cut through ambiguity. Define the problem before you solve it.',
      icon: '◎',
      href: '/dashboard/clarity',
      locked: false,
      lockMessage: '',
    },
    {
      id: 'constraints',
      name: 'Constraints',
      description: 'Work within limits. Great solutions thrive under pressure.',
      icon: '⬡',
      href: constraintsUnlocked ? '/dashboard/constraints' : undefined,
      locked: !constraintsUnlocked,
      lockMessage: 'Complete Clarity with 80+ avg to unlock',
    },
    {
      id: 'structure',
      name: 'Structure',
      description: 'Build with intention. Organize thinking into lasting systems.',
      icon: '▦',
      href: undefined,
      locked: true,
      lockMessage: 'Coming soon',
    },
    {
      id: 'debug',
      name: 'Debug',
      description: 'Find the break. Trace errors back to their root cause.',
      icon: '⟁',
      href: undefined,
      locked: true,
      lockMessage: 'Coming soon',
    },
  ]

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 backdrop-blur-sm" style={{ background: 'rgba(26,29,43,0.6)' }}>
        <span className="text-[#B0E020] font-mono font-bold tracking-widest text-sm uppercase shrink-0" aria-label="Zeptio — home">
          Zeptio
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-sm font-mono truncate max-w-[200px]" style={{ color: 'rgba(255,255,255,0.4)' }} aria-label={`Signed in as ${user.email}`}>{user.email}</span>
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

      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 lg:py-16 lime-radial-glow">
        {/* Welcome */}
        <div className="mb-6 sm:mb-14">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-4">
            Welcome back,{' '}
            <span style={{ color: '#B0E020' }}>{firstName}</span>!
          </h1>
          <p className="mb-4 sm:mb-8 text-sm sm:text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Choose a world to enter.
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-3" aria-label="Your stats">
            <div className="flex items-center gap-4 rounded-full bg-white/10 border border-white/20 px-5 py-3 flex-shrink-0">
              <span className="text-white text-base sm:text-lg font-bold whitespace-nowrap">Score</span>
              <span className="text-[#B0E020] text-base sm:text-lg font-bold tabular-nums">{totalXp}</span>
            </div>
            <div className="flex items-center gap-4 rounded-full bg-white/10 border border-white/20 px-5 py-3 flex-shrink-0">
              <span className="text-white text-base sm:text-lg font-bold whitespace-nowrap">🔥 Streak</span>
              <span className="text-[#B0E020] text-base sm:text-lg font-bold tabular-nums">{streak}</span>
            </div>
          </div>
        </div>

        {/* 2×2 World Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const active = !!world.href
            const cardClass = [
              'group relative text-left rounded-3xl p-5 sm:p-7 transition-all duration-300 glass',
              active
                ? 'hover:border-[#B0E020]/40 lime-glow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
                : 'opacity-40 cursor-not-allowed',
            ].join(' ')

            const inner = (
              <>
                {/* Top shimmer line on hover */}
                <span aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-[#B0E020]/0 via-[#B0E020]/50 to-[#B0E020]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* Radial glow behind active cards */}
                {active && (
                  <span aria-hidden="true" className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(176,224,32,0.06) 0%, transparent 60%)' }} />
                )}
                <div className="flex items-start justify-between gap-4 relative">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        aria-hidden="true"
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-mono"
                        style={{ background: active ? 'rgba(176,224,32,0.12)' : 'rgba(255,255,255,0.05)', color: active ? '#B0E020' : 'rgba(255,255,255,0.3)' }}
                      >
                        {world.icon}
                      </span>
                      {world.locked && (
                        <span className="text-xs font-mono tracking-widest uppercase rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                          {world.lockMessage}
                        </span>
                      )}
                    </div>
                    <h2 className={`text-2xl font-black tracking-tight mb-2 transition-colors duration-200 ${active ? 'group-hover:text-[#B0E020]' : 'text-white/40'}`}>
                      {world.name}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {world.description}
                    </p>
                  </div>
                  {active && (
                    <span aria-hidden="true" className="mt-1 transition-all duration-200 text-xl shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                      →
                    </span>
                  )}
                </div>
              </>
            )

            return active ? (
              <Link
                key={world.id}
                href={world.href!}
                className={cardClass}
                role="listitem"
                aria-label={`Enter the ${world.name} world — ${world.description}`}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={world.id}
                className={cardClass}
                role="listitem"
                aria-label={`${world.name} world — ${world.lockMessage}. ${world.description}`}
                aria-disabled="true"
              >
                {inner}
              </div>
            )
          })}
        </div>
        {/* Footer */}
        <div className="mt-10 sm:mt-20 pt-6 flex gap-5 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}>
          <a href="/privacy" className="hover:text-[#B0E020] transition-colors duration-200">Privacy</a>
          <a href="/terms" className="hover:text-[#B0E020] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#B0E020] transition-colors duration-200">Support</a>
          {user.email === 'vesorestyle@gmail.com' && (
            <a href="/admin" className="hover:text-[#B0E020] transition-colors duration-200">Admin</a>
          )}
        </div>
      </div>
    </main>
  )
}
