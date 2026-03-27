import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import EditNameForm from './_components/EditNameForm'
import RobotCustomizer from './_components/RobotCustomizer'
import ProfileExtrasForm from './_components/ProfileExtrasForm'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from './_components/RobotSVG'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// ─── Badge definitions ────────────────────────────────────────────────────────
interface BadgeDef {
  id: string
  icon: string
  name: string
  description: string
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_step',     icon: '🎯', name: 'First Step',     description: 'Complete your first level'      },
  { id: 'getting_warm',   icon: '🔥', name: 'Getting Warm',   description: 'Score 60+ on any level'         },
  { id: 'sharp_mind',     icon: '🧠', name: 'Sharp Mind',     description: 'Score 80+ on any level'         },
  { id: 'perfect',        icon: '⭐', name: 'Perfect',        description: 'Score 100 on any level'         },
  { id: 'on_a_roll',      icon: '🎮', name: 'On a Roll',      description: '3 consecutive levels at 60+'    },
  { id: 'clarity_master', icon: '🏆', name: 'Clarity Master', description: 'Complete all 10 Clarity levels' },
]

function computeEarnedBadges(clarityBest: Map<number, number>, completedCount: number): Set<string> {
  const earned = new Set<string>()
  const scores = Array.from(clarityBest.values())

  if (completedCount >= 1)                        earned.add('first_step')
  if (scores.some(s => s >= 60))                  earned.add('getting_warm')
  if (scores.some(s => s >= 80))                  earned.add('sharp_mind')
  if (scores.some(s => s >= 100))                 earned.add('perfect')
  if (completedCount === CLARITY_LEVELS.length)   earned.add('clarity_master')

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
    supabase.from('profiles').select('name, created_at, bio, favorite_world, robot_config').eq('id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
  ])

  const streak = streakRow?.current_streak ?? 0

  // Clarity best scores
  const clarityBest = new Map<number, number>()
  for (const row of clarityScoreRows ?? []) {
    const cur = clarityBest.get(row.level) ?? 0
    if ((row.score ?? 0) > cur) clarityBest.set(row.level, row.score)
  }

  const completedCount = CLARITY_LEVELS.filter(l => (clarityBest.get(l.id) ?? 0) >= 60).length
  const earnedBadges   = computeEarnedBadges(clarityBest, completedCount)

  // Robot part unlock conditions
  const unlockedParts = {
    antenna:     (clarityBest.get(3) ?? 0) >= 60,
    glowingEyes: streak >= 7,
    goldBody:    (xpRows ?? []).some(r => (r.amount ?? 0) >= 80),
    crown:       completedCount === CLARITY_LEVELS.length,
  }

  // Parse saved robot config — merge with defaults so missing keys are safe
  const rawConfig = (profile as { robot_config?: unknown })?.robot_config
  const robotConfig: RobotConfig = rawConfig && typeof rawConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const displayName = (profile as { name?: string })?.name ?? user.email ?? ''
  const memberSince = (profile as { created_at?: string })?.created_at
    ? new Date((profile as { created_at: string }).created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const initialBio          = (profile as { bio?: string })?.bio          ?? ''
  const initialFavoriteWorld = (profile as { favorite_world?: string })?.favorite_world ?? ''

  return (
    <main className="min-h-screen w-full max-w-full text-white overflow-hidden">

      {/* Header */}
      <header
        className="border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-sm"
        style={{ background: 'rgba(26,29,43,0.6)' }}
      >
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

      <div className="w-full max-w-full sm:max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-10 flex flex-col gap-6 sm:gap-8 overflow-hidden">

        {/* ── ROBOT AVATAR ──────────────────────────────────── */}
        <section>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-4" style={{ color: '#B0E020' }}>
            Your Robot
          </p>
          <RobotCustomizer initialConfig={robotConfig} unlockedParts={unlockedParts} />
        </section>

        {/* ── PROFILE ───────────────────────────────────────── */}
        <section className="rounded-3xl glass p-5 sm:p-6 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-4" style={{ color: '#B0E020' }}>
            Profile
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <EditNameForm initialName={displayName} />
              <p className="mt-1 text-sm font-mono truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user.email}
              </p>
              {memberSince && (
                <p className="mt-0.5 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Member since {memberSince}
                </p>
              )}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
              <ProfileExtrasForm
                initialBio={initialBio}
                initialFavoriteWorld={initialFavoriteWorld}
              />
            </div>
          </div>
        </section>

        {/* ── BADGES ────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-4" style={{ color: '#B0E020' }}>
            Badges
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {BADGE_DEFS.map(badge => {
              const earned = earnedBadges.has(badge.id)
              return (
                <div
                  key={badge.id}
                  className="rounded-2xl p-3 flex flex-col gap-1.5"
                  style={{
                    background: earned ? 'rgba(176,224,32,0.07)' : 'rgba(255,255,255,0.03)',
                    border:     earned ? '1px solid rgba(176,224,32,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    boxShadow:  earned ? '0 0 14px rgba(176,224,32,0.08)' : 'none',
                    opacity:    earned ? 1 : 0.4,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xl" role="img" aria-label={badge.name}>
                      {earned ? badge.icon : '🔒'}
                    </span>
                    {earned && (
                      <span
                        className="text-[9px] font-bold font-mono rounded-full px-1.5 py-0.5 uppercase tracking-wider shrink-0"
                        style={{ background: 'rgba(176,224,32,0.15)', color: '#B0E020' }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{badge.name}</p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── SIGN OUT ──────────────────────────────────────── */}
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
