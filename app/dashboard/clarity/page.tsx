import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'

type NodeStatus = 'completed' | 'active' | 'locked'

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M4 11.5L9 16.5L18 6" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <rect x="2" y="9" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 9V6.5a4 4 0 0 1 8 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LevelNode({ status, levelId, isPrimary }: { status: NodeStatus; levelId: number; isPrimary: boolean }) {
  if (status === 'completed') {
    return (
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#E8FF47', boxShadow: '0 0 0 4px rgba(232,255,71,0.15)' }}
      >
        <CheckIcon />
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div
        className={isPrimary ? 'node-pulse' : ''}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: '#12122a',
          border: '2px solid #E8FF47',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {isPrimary && (
          <div
            className="node-ring-ping"
            style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '2px solid rgba(232,255,71,0.4)',
            }}
          />
        )}
        <span style={{ color: '#E8FF47', fontWeight: 800, fontSize: 20, fontFamily: 'monospace' }}>
          {levelId}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        width: 64, height: 64, borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>
        <LockIcon />
      </span>
    </div>
  )
}

function LevelCard({
  level,
  status,
  best,
  isRight,
}: {
  level: typeof CLARITY_LEVELS[0]
  status: NodeStatus
  best: number | undefined
  isRight: boolean
}) {
  const dim = status === 'locked'

  const inner = (
    <div
      className={[
        'rounded-2xl p-4 transition-all duration-200',
        status !== 'locked' ? 'group hover:border-[#E8FF47]/40' : '',
      ].join(' ')}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${status === 'active' ? 'rgba(232,255,71,0.3)' : 'rgba(255,255,255,0.08)'}`,
        opacity: dim ? 0.45 : 1,
        width: 176,
        textAlign: isRight ? 'left' : 'right',
      }}
    >
      <p className="text-xs font-mono mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Level {String(level.id).padStart(2, '0')}
      </p>
      <p
        className={`text-sm font-bold leading-tight mb-2 transition-colors duration-200 ${status !== 'locked' ? 'group-hover:text-[#E8FF47]' : ''}`}
        style={{ color: status === 'locked' ? 'rgba(255,255,255,0.4)' : 'white' }}
      >
        {level.title}
      </p>

      {/* Concept badge */}
      <span
        className="inline-block text-xs font-mono rounded px-1.5 py-0.5 mb-3"
        style={{
          backgroundColor: status === 'locked' ? 'rgba(255,255,255,0.05)' : 'rgba(232,255,71,0.1)',
          color: status === 'locked' ? 'rgba(255,255,255,0.25)' : 'rgba(232,255,71,0.7)',
        }}
      >
        {level.concept}
      </span>

      {/* Status row */}
      {status === 'completed' && best !== undefined && (
        <div className="flex items-center gap-1.5" style={{ justifyContent: isRight ? 'flex-start' : 'flex-end' }}>
          <span
            className="text-lg font-black tabular-nums leading-none"
            style={{ color: best >= 70 ? '#E8FF47' : best >= 50 ? '#facc15' : '#f87171' }}
          >
            {best}
          </span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
        </div>
      )}
      {status === 'active' && (
        <p className="text-xs font-mono font-bold" style={{ color: '#E8FF47' }}>
          Play →
        </p>
      )}
      {status === 'locked' && (
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Locked
        </p>
      )}
    </div>
  )

  if (status === 'locked') return inner

  return (
    <Link
      href={`/dashboard/clarity/${level.id}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e] rounded-2xl block"
    >
      {inner}
    </Link>
  )
}

function Trail({ completed }: { completed: boolean }) {
  return (
    <div className="flex justify-center" style={{ height: 64 }}>
      <div
        style={{
          width: 2,
          height: '100%',
          backgroundImage: completed
            ? 'repeating-linear-gradient(to bottom, #E8FF47 0px, #E8FF47 5px, transparent 5px, transparent 14px)'
            : 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 5px, transparent 5px, transparent 14px)',
        }}
      />
    </div>
  )
}

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: scoreRows }, { data: allXpRows }] = await Promise.all([
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('xp_ledger').select('xp_earned').eq('user_id', user.id).eq('world', 'clarity'),
  ])

  // Best score per level
  const bestScores = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScores.get(row.level) ?? 0
    if (row.score > cur) bestScores.set(row.level, row.score)
  }

  // Total XP earned in this world
  const totalXp = allXpRows?.reduce((sum, r) => sum + (r.xp_earned ?? 0), 0) ?? 0

  // The first unlocked-but-not-completed level
  let primaryActiveLevel = 1
  for (let i = 1; i <= CLARITY_LEVELS.length; i++) {
    if (!bestScores.has(i)) { primaryActiveLevel = i; break }
    if (i === CLARITY_LEVELS.length) primaryActiveLevel = CLARITY_LEVELS.length
  }

  function getStatus(levelId: number): NodeStatus {
    if (bestScores.has(levelId)) return 'completed'
    if (levelId === 1 || bestScores.has(levelId - 1)) return 'active'
    return 'locked'
  }

  const completedCount = bestScores.size
  const progressPct = Math.round((completedCount / CLARITY_LEVELS.length) * 100)

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: '#1a1a2e' }}>
      <style>{`
        @keyframes node-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(232,255,71,0.5), 0 0 0 4px rgba(232,255,71,0.15); }
          50%       { box-shadow: 0 0 28px rgba(232,255,71,0.8), 0 0 0 8px rgba(232,255,71,0.2); }
        }
        @keyframes ring-expand {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .node-pulse { animation: node-glow 2.2s ease-in-out infinite; }
        .node-ring-ping { animation: ring-expand 2s ease-out infinite; }
      `}</style>

      <div className="max-w-lg mx-auto px-6 pt-8">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-mono transition-colors duration-200 hover:text-[#E8FF47] mb-8"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Dashboard
        </Link>

        {/* World header card */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ backgroundColor: '#12122a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span aria-hidden="true" style={{ color: '#E8FF47', fontFamily: 'monospace', fontSize: 18 }}>◎</span>
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#E8FF47' }}>
                  Clarity World
                </p>
              </div>
              <h1 className="text-xl font-bold text-white">Master clear AI prompts.</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums leading-none" style={{ color: '#E8FF47' }}>
                {totalXp.toLocaleString()}
              </p>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>XP earned</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: '#E8FF47' }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums shrink-0" style={{ color: '#9ca3af' }}>
              {completedCount}/{CLARITY_LEVELS.length}
            </span>
          </div>
        </div>

        {/* Game trail */}
        <div>
          {CLARITY_LEVELS.map((level, i) => {
            const status   = getStatus(level.id)
            const best     = bestScores.get(level.id)
            const isRight  = i % 2 === 0
            const isPrimary = level.id === primaryActiveLevel && status === 'active'

            return (
              <div key={level.id}>
                {/* Level row */}
                <div className="flex items-center gap-4">
                  {/* Left slot */}
                  <div className="flex-1 flex justify-end">
                    {!isRight
                      ? <LevelCard level={level} status={status} best={best} isRight={false} />
                      : null
                    }
                  </div>

                  {/* Node */}
                  <LevelNode status={status} levelId={level.id} isPrimary={isPrimary} />

                  {/* Right slot */}
                  <div className="flex-1 flex justify-start">
                    {isRight
                      ? <LevelCard level={level} status={status} best={best} isRight={true} />
                      : null
                    }
                  </div>
                </div>

                {/* Trail connector */}
                {i < CLARITY_LEVELS.length - 1 && (
                  <Trail completed={status === 'completed'} />
                )}
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
