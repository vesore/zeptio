import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

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
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])

  const displayName = profile?.name ?? user.email ?? ''
  const firstName = displayName.split(' ')[0]

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
    <main className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-[#E8FF47] font-mono font-bold tracking-widest text-sm uppercase" aria-label="Zeptio — home">
          Zeptio
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono" style={{ color: '#9ca3af' }} aria-label={`Signed in as ${user.email}`}>{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out of your account"
              className="rounded-lg border border-[#E8FF47]/40 px-3 py-1.5 text-xs font-mono tracking-widest uppercase transition-colors duration-200 hover:border-[#E8FF47] hover:text-[#E8FF47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
              style={{ color: '#9ca3af' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Welcome */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Welcome back, <span style={{ color: '#E8FF47' }}>{firstName}</span>!
          </h1>
          <p className="mt-3 mb-6" style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
            Choose a world to enter.
          </p>

          {/* Stats */}
          <div
            className="inline-flex items-center gap-6 rounded-2xl px-6 py-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Your stats"
          >
            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: '#9ca3af' }}>
                Total XP
              </p>
              <p
                className="text-2xl font-bold tabular-nums leading-none"
                style={{ color: '#E8FF47' }}
                aria-label={`${totalXp.toLocaleString()} total XP`}
              >
                {totalXp.toLocaleString()}
              </p>
            </div>

            <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: '#9ca3af' }}>
                Streak
              </p>
              <p
                className="text-2xl font-bold tabular-nums leading-none text-white"
                aria-label={`${streak} day streak`}
              >
                {streak} 🔥
              </p>
            </div>
          </div>
        </div>

        {/* 2×2 World Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Game worlds">
          {WORLDS.map((world) => {
            const active = !!world.href
            const cardClass = [
              'group relative text-left rounded-2xl border border-white/10 bg-white/5 p-7 transition-all duration-200',
              active
                ? 'hover:border-[#E8FF47]/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]'
                : 'opacity-50 cursor-not-allowed',
            ].join(' ')

            const inner = (
              <>
                <span aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-[#E8FF47]/0 via-[#E8FF47]/60 to-[#E8FF47]/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p aria-hidden="true" className="font-mono text-2xl text-[#E8FF47] leading-none">
                        {world.icon}
                      </p>
                      {world.locked && (
                        <span className="text-xs font-mono tracking-widest uppercase rounded-md px-2 py-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                          {world.lockMessage}
                        </span>
                      )}
                    </div>
                    <h2 className={`text-xl font-semibold mt-3 mb-2 transition-colors duration-200 ${active ? 'group-hover:text-[#E8FF47]' : ''}`}>
                      {world.name}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
                      {world.description}
                    </p>
                  </div>
                  {active && (
                    <span aria-hidden="true" className="mt-1 text-white/20 group-hover:text-[#E8FF47] transition-colors duration-200 text-lg shrink-0">
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
      </div>
    </main>
  )
}
