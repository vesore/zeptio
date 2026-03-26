import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Best score per level from xp_ledger
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

  // Level N is unlocked if N === 1 OR level N-1 has a best score >= 60
  function isUnlocked(levelId: number): boolean {
    if (levelId === 1) return true
    return (bestScores.get(levelId - 1) ?? 0) >= 60
  }

  function isCompleted(levelId: number): boolean {
    return (bestScores.get(levelId) ?? 0) >= 60
  }

  const completedCount = CLARITY_LEVELS.filter((l) => isCompleted(l.id)).length

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: '#1a1a2e' }}>
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
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ backgroundColor: '#12122a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span aria-hidden="true" style={{ color: '#E8FF47', fontFamily: 'monospace', fontSize: 18 }}>◎</span>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#E8FF47' }}>
                  Clarity World
                </p>
              </div>
              <h1 className="text-xl font-bold text-white mb-0.5">Master clear AI prompts.</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Score 60+ on each level to unlock the next.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums shrink-0 mt-1" style={{ color: '#9ca3af' }}>
              {completedCount}/{CLARITY_LEVELS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CLARITY_LEVELS.length) * 100)}%`,
                backgroundColor: '#E8FF47',
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
                  className="group rounded-2xl p-5 transition-all duration-200 hover:border-[#E8FF47]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
                  style={{
                    backgroundColor: completed ? 'rgba(232,255,71,0.04)' : 'rgba(232,255,71,0.02)',
                    border: `1px solid ${completed ? 'rgba(232,255,71,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black font-mono shrink-0"
                        style={{ backgroundColor: '#E8FF47', color: '#1a1a2e' }}
                      >
                        {completed ? '✓' : level.id}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#E8FF47] transition-colors duration-200">
                          {level.title}
                        </p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(232,255,71,0.6)' }}>
                          {level.concept}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {completed && best !== undefined && (
                        <span
                          className="text-sm font-black tabular-nums font-mono"
                          style={{ color: best >= 80 ? '#E8FF47' : best >= 60 ? '#facc15' : '#f87171' }}
                        >
                          {best}
                        </span>
                      )}
                      <span className="text-sm font-mono transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={level.id}
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: 0.4,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black font-mono shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}
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
                    className="text-xs font-mono tracking-widest uppercase rounded-md px-2 py-0.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}
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
