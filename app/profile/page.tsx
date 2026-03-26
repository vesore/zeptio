import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import EditNameForm from './_components/EditNameForm'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: xpRows },
    { data: streakRow },
    { data: clarityScoreRows },
  ] = await Promise.all([
    supabase.from('profiles').select('name, created_at').eq('id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
  ])

  // Total score: best per level
  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalScore = Array.from(bestPerLevel.values()).reduce((s, v) => s + v, 0)

  const streak = streakRow?.current_streak ?? 0

  // Clarity best scores per level
  const clarityBest = new Map<number, number>()
  for (const row of clarityScoreRows ?? []) {
    const cur = clarityBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) clarityBest.set(row.level, row.score)
  }
  const completedCount = CLARITY_LEVELS.filter(l => (clarityBest.get(l.id) ?? 0) >= 60).length

  const displayName = profile?.name ?? user.email ?? ''

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between backdrop-blur-sm" style={{ background: 'rgba(31,43,107,0.6)' }}>
        <Link
          href="/dashboard"
          className="text-sm font-mono transition-colors duration-200 hover:text-[#E86A4A]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Dashboard
        </Link>
        <span className="text-[#E86A4A] font-mono font-bold tracking-widest text-sm uppercase">
          Zeptio
        </span>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Name + meta */}
        <div className="mb-10">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#E86A4A' }}>
            Profile
          </p>
          <EditNameForm initialName={displayName} />
          <p className="mt-2 text-sm font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {user.email}
          </p>
          {memberSince && (
            <p className="mt-1 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Member since {memberSince}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div
            className="flex-1 flex items-center justify-between rounded-2xl px-5 py-4 glass"
            style={{ border: '1px solid rgba(232,106,74,0.2)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Score</span>
            <span
              className="rounded-full px-4 py-1 text-sm font-black tabular-nums"
              style={{ background: 'rgba(232,106,74,0.12)', color: '#E86A4A', border: '1px solid rgba(232,106,74,0.25)' }}
            >
              {totalScore}
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-between rounded-2xl px-5 py-4 glass"
            style={{ border: '1px solid rgba(232,106,74,0.2)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>🔥 Streak</span>
            <span
              className="rounded-full px-4 py-1 text-sm font-black tabular-nums"
              style={{ background: 'rgba(232,106,74,0.12)', color: '#E86A4A', border: '1px solid rgba(232,106,74,0.25)' }}
            >
              {streak} day{streak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Clarity Progress */}
        <div className="rounded-3xl glass p-6 sm:p-7 mb-8" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-1" style={{ color: '#E86A4A' }}>
                Clarity World
              </p>
              <p className="text-lg font-black text-white">
                Level {completedCount} of {CLARITY_LEVELS.length} complete
              </p>
            </div>
            <span
              className="text-sm font-black tabular-nums rounded-full px-3 py-1 shrink-0"
              style={{ background: 'rgba(232,106,74,0.1)', color: 'rgba(232,106,74,0.8)' }}
            >
              {completedCount}/{CLARITY_LEVELS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CLARITY_LEVELS.length) * 100)}%`,
                background: 'linear-gradient(90deg, #E86A4A, #ff9a7a)',
              }}
            />
          </div>

          {/* Level list */}
          <div className="flex flex-col gap-2">
            {CLARITY_LEVELS.map(level => {
              const best = clarityBest.get(level.id)
              const played = best !== undefined
              const passed = (best ?? 0) >= 60

              return (
                <div
                  key={level.id}
                  className="flex items-center justify-between py-2.5 px-1"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0"
                      style={{
                        backgroundColor: passed ? '#E86A4A' : played ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.06)',
                        color: passed ? '#1F2B6B' : played ? '#facc15' : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {passed ? '✓' : level.id}
                    </span>
                    <span className="text-sm font-medium" style={{ color: played ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}>
                      {level.title}
                    </span>
                  </div>
                  {played ? (
                    <span
                      className="text-xs font-black tabular-nums font-mono"
                      style={{ color: (best ?? 0) >= 80 ? '#E86A4A' : (best ?? 0) >= 60 ? '#facc15' : '#f87171' }}
                    >
                      {best}/100
                    </span>
                  ) : (
                    <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A4A] border border-red-400/30 text-red-400/60 hover:border-red-400 hover:text-red-400"
          >
            Sign Out
          </button>
        </form>

      </div>
    </main>
  )
}
