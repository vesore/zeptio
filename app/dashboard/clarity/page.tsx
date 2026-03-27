import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import GalaxyMap from './_components/GalaxyMap'

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: scoreRows } = await supabase
    .from('xp_ledger')
    .select('level, score')
    .eq('user_id', user.id)
    .eq('world', 'clarity')

  const bestScoresMap = new Map<number, number>()
  for (const row of scoreRows ?? []) {
    const cur = bestScoresMap.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) bestScoresMap.set(row.level, row.score)
  }

  // Convert Map → plain object for client component prop (must be serializable)
  const bestScores: Record<number, number> = {}
  for (const [k, v] of bestScoresMap) bestScores[k] = v

  const completedCount = CLARITY_LEVELS.filter(l => (bestScores[l.id] ?? 0) >= 60).length

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden pb-24" style={{ background: '#000' }}>
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6">

        {/* ── Top nav ── */}
        <div className="pt-5 pb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-mono transition-colors duration-200 hover:text-[#B0E020]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            ← Home
          </Link>
          <span
            className="text-xs font-mono rounded-full px-3 py-1"
            style={{ background: 'rgba(176,224,32,0.08)', color: 'rgba(176,224,32,0.6)' }}
          >
            {completedCount}/{CLARITY_LEVELS.length} complete
          </span>
        </div>

        {/* ── Neon title ── */}
        <div className="pt-6 pb-2 text-center">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-2"
            style={{ color: 'rgba(176,224,32,0.45)' }}
          >
            ◎ World One
          </p>
          <h1
            className="text-4xl sm:text-5xl font-black tracking-wider uppercase"
            style={{
              color: '#B0E020',
              textShadow: '0 0 20px rgba(176,224,32,0.6), 0 0 60px rgba(176,224,32,0.25)',
              letterSpacing: '0.12em',
            }}
          >
            Clarity
          </h1>
          <p className="mt-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Score 60+ on each level to unlock the next
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div className="my-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-1 rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / CLARITY_LEVELS.length) * 100)}%`,
                background: 'linear-gradient(90deg, #B0E020, #d4ff3a)',
                boxShadow: '0 0 8px rgba(176,224,32,0.6)',
              }}
            />
          </div>
        </div>

        {/* ── Galaxy map ── */}
        <GalaxyMap bestScores={bestScores} />

      </div>
    </main>
  )
}
