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

// ─── Badge definitions ───────────────────────────────────────────────────────
interface BadgeDef {
  id: string
  icon: string
  name: string
  description: string
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_step',      icon: '🎯', name: 'First Step',      description: 'Complete your first level'       },
  { id: 'getting_warm',    icon: '🔥', name: 'Getting Warm',    description: 'Score 60+ on any level'          },
  { id: 'sharp_mind',      icon: '🧠', name: 'Sharp Mind',      description: 'Score 80+ on any level'          },
  { id: 'perfect',         icon: '⭐', name: 'Perfect',         description: 'Score 100 on any level'          },
  { id: 'on_a_roll',       icon: '🎮', name: 'On a Roll',       description: 'Complete 3 levels in a row'      },
  { id: 'clarity_master',  icon: '🏆', name: 'Clarity Master',  description: 'Complete all 10 Clarity levels'  },
]

function computeEarnedBadges(
  clarityBest: Map<number, number>,
  completedCount: number,
): Set<string> {
  const earned = new Set<string>()
  const scores = Array.from(clarityBest.values())

  if (completedCount >= 1)                          earned.add('first_step')
  if (scores.some(s => s >= 60))                    earned.add('getting_warm')
  if (scores.some(s => s >= 80))                    earned.add('sharp_mind')
  if (scores.some(s => s >= 100))                   earned.add('perfect')
  if (completedCount === CLARITY_LEVELS.length)     earned.add('clarity_master')

  // "On a Roll" — any 3 consecutive levels all completed (score >= 60)
  for (let i = 1; i <= CLARITY_LEVELS.length - 2; i++) {
    if (
      (clarityBest.get(i)     ?? 0) >= 60 &&
      (clarityBest.get(i + 1) ?? 0) >= 60 &&
      (clarityBest.get(i + 2) ?? 0) >= 60
    ) {
      earned.add('on_a_roll')
      break
    }
  }

  return earned
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
  const completedScores = CLARITY_LEVELS
    .filter(l => (clarityBest.get(l.id) ?? 0) >= 60)
    .map(l => clarityBest.get(l.id)!)
  const avgScore = completedScores.length > 0
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
    : null

  const earnedBadges = computeEarnedBadges(clarityBest, completedCount)

  const displayName = profile?.name ?? user.email ?? ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between backdrop-blur-sm" style={{ background: 'rgba(26,29,43,0.6)' }}>
        <Link
          href="/dashboard"
          className="text-sm font-mono transition-colors duration-200 hover:text-[#B0E020]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Dashboard
        </Link>
        <span className="text-[#B0E020] font-mono font-bold tracking-widest text-sm uppercase">
          Zeptio
        </span>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 flex flex-col gap-6 sm:gap-8">

        {/* Name + meta */}
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#B0E020' }}>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex-1 flex items-center justify-between rounded-2xl px-5 py-4 glass"
            style={{ border: '1px solid rgba(176,224,32,0.2)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Score</span>
            <span
              className="rounded-full px-4 py-1 text-sm font-black tabular-nums"
              style={{ background: 'rgba(176,224,32,0.12)', color: '#B0E020', border: '1px solid rgba(176,224,32,0.25)' }}
            >
              {totalScore}
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-between rounded-2xl px-5 py-4 glass"
            style={{ border: '1px solid rgba(176,224,32,0.2)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>🔥 Streak</span>
            <span
              className="rounded-full px-4 py-1 text-sm font-black tabular-nums"
              style={{ background: 'rgba(176,224,32,0.12)', color: '#B0E020', border: '1px solid rgba(176,224,32,0.25)' }}
            >
              {streak} day{streak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Clarity Progress */}
        <div className="rounded-3xl glass p-6 sm:p-7" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#B0E020' }}>
              Clarity World
            </p>
            {avgScore !== null && (
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Avg {avgScore}/100
              </span>
            )}
          </div>
          <p className="text-lg font-black text-white mb-5">
            {completedCount}/{CLARITY_LEVELS.length} Levels Complete
          </p>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CLARITY_LEVELS.length) * 100)}%`,
                background: 'linear-gradient(90deg, #B0E020, #ff9a7a)',
              }}
            />
          </div>

          {/* Level circles */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
            {CLARITY_LEVELS.map(level => {
              const best = clarityBest.get(level.id)
              const passed = (best ?? 0) >= 60
              const played = best !== undefined

              return (
                <div key={level.id} className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black font-mono transition-all duration-200"
                    style={{
                      background: passed
                        ? '#B0E020'
                        : played
                          ? 'rgba(250,204,21,0.12)'
                          : 'rgba(255,255,255,0.05)',
                      border: passed
                        ? '2px solid #B0E020'
                        : played
                          ? '2px solid rgba(250,204,21,0.4)'
                          : '2px solid rgba(255,255,255,0.12)',
                      color: passed ? '#1A1D2B' : played ? '#facc15' : 'rgba(255,255,255,0.25)',
                      boxShadow: passed ? '0 0 10px rgba(176,224,32,0.35)' : 'none',
                    }}
                  >
                    {passed ? '✓' : level.id}
                  </div>
                  {played && (
                    <span className="text-[10px] font-mono tabular-nums" style={{ color: passed ? 'rgba(176,224,32,0.7)' : 'rgba(250,204,21,0.6)' }}>
                      {best}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Level detail list */}
          <div className="flex flex-col gap-0">
            {CLARITY_LEVELS.map((level, i) => {
              const best = clarityBest.get(level.id)
              const played = best !== undefined
              const passed = (best ?? 0) >= 60

              return (
                <div
                  key={level.id}
                  className="flex items-center justify-between py-2.5 px-1"
                  style={{ borderBottom: i < CLARITY_LEVELS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black font-mono shrink-0"
                      style={{
                        backgroundColor: passed ? '#B0E020' : played ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.06)',
                        color: passed ? '#1A1D2B' : played ? '#facc15' : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {passed ? '✓' : level.id}
                    </span>
                    <span className="text-sm font-medium truncate" style={{ color: played ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
                      {level.title}
                    </span>
                  </div>
                  {played ? (
                    <span
                      className="text-xs font-black tabular-nums font-mono shrink-0 ml-3"
                      style={{ color: (best ?? 0) >= 80 ? '#B0E020' : (best ?? 0) >= 60 ? '#facc15' : '#f87171' }}
                    >
                      {best}/100
                    </span>
                  ) : (
                    <span className="text-xs font-mono shrink-0 ml-3" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-4" style={{ color: '#B0E020' }}>
            Badges
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGE_DEFS.map(badge => {
              const earned = earnedBadges.has(badge.id)
              return (
                <div
                  key={badge.id}
                  className="rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200"
                  style={{
                    background: earned ? 'rgba(176,224,32,0.07)' : 'rgba(255,255,255,0.03)',
                    border: earned ? '1px solid rgba(176,224,32,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: earned ? '0 0 16px rgba(176,224,32,0.08)' : 'none',
                    opacity: earned ? 1 : 0.45,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" role="img" aria-label={badge.name}>
                      {earned ? badge.icon : '🔒'}
                    </span>
                    {earned && (
                      <span
                        className="text-[10px] font-bold font-mono rounded-full px-2 py-0.5 uppercase tracking-wider"
                        style={{ background: 'rgba(176,224,32,0.15)', color: '#B0E020' }}
                      >
                        Earned
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{badge.name}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] border border-red-400/30 text-red-400/60 hover:border-red-400 hover:text-red-400"
          >
            Sign Out
          </button>
        </form>

      </div>
    </main>
  )
}
