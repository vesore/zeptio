import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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
          <div className="flex items-center gap-2 mb-1">
            <span aria-hidden="true" style={{ color: '#E8FF47', fontFamily: 'monospace', fontSize: 18 }}>◎</span>
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#E8FF47' }}>
              Clarity World
            </p>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Master clear AI prompts.</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>10 levels · Complete each to unlock the next.</p>
        </div>

        {/* Level list */}
        <div className="flex flex-col gap-3">
          {CLARITY_LEVELS.map((level) => {
            const isFirst = level.id === 1

            if (isFirst) {
              return (
                <Link
                  key={level.id}
                  href="/dashboard/clarity/1"
                  className="group rounded-2xl p-5 transition-all duration-200 hover:border-[#E8FF47]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
                  style={{
                    backgroundColor: 'rgba(232,255,71,0.04)',
                    border: '1px solid rgba(232,255,71,0.25)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black font-mono shrink-0"
                        style={{ backgroundColor: '#E8FF47', color: '#1a1a2e' }}
                      >
                        {level.id}
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
                    <span className="text-sm font-mono" style={{ color: '#E8FF47' }}>Play →</span>
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
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: 0.5,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black font-mono shrink-0"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {level.id}
                    </span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {level.title}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {level.concept}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono tracking-widest uppercase rounded-md px-2 py-0.5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}
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
