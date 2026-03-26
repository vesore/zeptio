import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: scoreRows } = await supabase
    .from('xp_ledger')
    .select('level, score')
    .eq('user_id', user.id)
    .eq('world', 'clarity')

  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScores.set(row.level, row.score)
  }

  function isUnlocked(levelId: number): boolean {
    if (levelId === 1) return true
    return (bestScores.get(levelId - 1) ?? 0) >= 60
  }

  function isCompleted(levelId: number): boolean {
    return (bestScores.get(levelId) ?? 0) >= 60
  }

  const completedCount = CLARITY_LEVELS.filter((l) => isCompleted(l.id)).length

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-lg mx-auto px-6 pt-8">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#E8FF47] mb-8"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Dashboard
        </Link>

        {/* World header */}
        <div className="rounded-3xl p-6 mb-8 glass lime-radial-glow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-mono"
                  style={{ background: 'rgba(232,255,71,0.12)', color: '#E8FF47' }}
                  aria-hidden="true"
                >
                  ◎
                </span>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#E8FF47' }}>
                  Clarity World
                </p>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">Master clear AI prompts.</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Score 60+ on each level to unlock the next.
              </p>
            </div>
            <span
              className="text-sm font-black tabular-nums rounded-full px-3 py-1 shrink-0 mt-1"
              style={{ background: 'rgba(232,255,71,0.1)', color: 'rgba(232,255,71,0.7)' }}
            >
              {completedCount}/{CLARITY_LEVELS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CLARITY_LEVELS.length) * 100)}%`,
                background: 'linear-gradient(90deg, #E8FF47, #b8ff00)',
              }}
            />
          </div>
        </div>

        {/* Level list */}
        <div className="flex flex-col gap-3">
          {CLARITY_LEVELS.map((level) => {
            const unlocked = isUnlocked(level.id)
            const completed = isCompleted(level.id)
            const best = bestScores.get(level.id)

            if (unlocked) {
              return (
                <Link
                  key={level.id}
                  href={`/dashboard/clarity/${level.id}`}
                  className="group rounded-3xl p-5 transition-all duration-200 hover:border-[#E8FF47]/40 lime-glow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent glass"
                  style={{
                    border: `1px solid ${completed ? 'rgba(232,255,71,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    background: completed ? 'rgba(232,255,71,0.04)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black font-mono shrink-0"
                        style={{ backgroundColor: completed ? '#E8FF47' : 'rgba(232,255,71,0.12)', color: completed ? '#0d0d1a' : '#E8FF47' }}
                      >
                        {completed ? '✓' : level.id}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#E8FF47] transition-colors duration-200">
                          {level.title}
                        </p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(232,255,71,0.5)' }}>
                          {level.concept}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {best !== undefined ? (
                        <span
                          className="text-sm font-black tabular-nums font-mono"
                          style={{ color: best >= 80 ? '#E8FF47' : best >= 60 ? '#facc15' : '#f87171' }}
                        >
                          Best: {best}/100
                        </span>
                      ) : (
                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Not played yet
                        </span>
                      )}
                      <span className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={level.id}
                className="rounded-3xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: 0.35,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black font-mono shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}
                    >
                      {level.id}
                    </span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {level.title}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {level.concept}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono tracking-widest uppercase rounded-full px-3 py-1"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}
                  >
                    Locked
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
