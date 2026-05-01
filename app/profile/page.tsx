import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from './_components/RobotSVG'
import ProfileTabs from './_components/ProfileTabs'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

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
    { data: worldPointsRows },
    { data: userPartsRows },
  ] = await Promise.all([
    supabase.from('profiles').select('name, created_at, bio, favorite_world, robot_config').eq('id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', user.id),
    supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('xp_ledger').select('level, score').eq('user_id', user.id).eq('world', 'clarity'),
    supabase.from('world_points').select('world, points').eq('user_id', user.id),
    supabase.from('user_parts').select('part_id, equipped').eq('user_id', user.id),
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
  const bodyUnlocked = completedCount >= 1
  const unlockedParts = {
    antenna:     (clarityBest.get(3) ?? 0) >= 60,
    glowingEyes: streak >= 7,
    goldBody:    (xpRows ?? []).some(r => (r.amount ?? 0) >= 80),
    crown:       completedCount === CLARITY_LEVELS.length,
  }

  // Parse saved robot config
  const rawConfig = (profile as { robot_config?: unknown })?.robot_config
  const robotConfig: RobotConfig = rawConfig && typeof rawConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  const displayName          = (profile as { name?: string })?.name ?? user.email ?? ''
  const memberSince          = (profile as { created_at?: string })?.created_at
    ? new Date((profile as { created_at: string }).created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const initialBio           = (profile as { bio?: string })?.bio          ?? ''
  const initialFavoriteWorld = (profile as { favorite_world?: string })?.favorite_world ?? ''

  // Parts tab data
  const worldPoints: Record<string, number> = {}
  for (const row of worldPointsRows ?? []) {
    if (row.world) worldPoints[row.world] = row.points ?? 0
  }

  const ownedPartIds    = (userPartsRows ?? []).map(r => r.part_id).filter(Boolean) as string[]
  const equippedPartIds = (userPartsRows ?? []).filter(r => r.equipped).map(r => r.part_id).filter(Boolean) as string[]

  return (
    <main className="min-h-screen w-full max-w-full overflow-hidden" style={{ background: '#EFEFEF' }}>

      {/* Header */}
      <header
        className="border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
        style={{ background: '#FFFFFF', borderColor: '#E0E0E0' }}
      >
        <Link
          href="/dashboard"
          className="text-base transition-colors duration-200 hover:text-[#4A90E2]"
          style={{ color: '#888888' }}
        >
          ← Dashboard
        </Link>
        <span className="fredoka font-bold text-lg uppercase text-[#4A90E2]">
          Zeptio
        </span>
      </header>

      <div className="w-full max-w-full sm:max-w-lg mx-auto px-3 sm:px-6 py-4 sm:py-10 overflow-hidden">

        <ProfileTabs
          displayName={displayName}
          userEmail={user.email ?? ''}
          memberSince={memberSince}
          initialBio={initialBio}
          initialFavoriteWorld={initialFavoriteWorld}
          robotConfig={robotConfig}
          unlockedParts={unlockedParts}
          bodyUnlocked={bodyUnlocked}
          earnedBadgeIds={Array.from(earnedBadges)}
          signOutAction={signOut}
          worldPoints={worldPoints}
          ownedPartIds={ownedPartIds}
          equippedPartIds={equippedPartIds}
        />

      </div>
    </main>
  )
}
