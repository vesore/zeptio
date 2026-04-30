import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

export default async function BottomBar({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [{ data: xpRows }, { data: streakRow }, { data: profile }] = await Promise.all([
    supabase.from('xp_ledger').select('level_id, amount').eq('user_id', userId),
    supabase.from('streaks').select('current_streak').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('robot_config').eq('id', userId).maybeSingle(),
  ])

  const bestPerLevel = new Map<number, number>()
  for (const row of xpRows ?? []) {
    const cur = bestPerLevel.get(row.level_id) ?? 0
    if ((row.amount ?? 0) > cur) bestPerLevel.set(row.level_id, row.amount ?? 0)
  }
  const totalXp = Array.from(bestPerLevel.values()).reduce((s, v) => s + v, 0)
  const streak  = streakRow?.current_streak ?? 0

  const rawConfig = (profile as { robot_config?: unknown } | null)?.robot_config
  const robotConfig: RobotConfig = rawConfig && typeof rawConfig === 'object'
    ? { ...DEFAULT_ROBOT_CONFIG, ...(rawConfig as Partial<RobotConfig>) }
    : DEFAULT_ROBOT_CONFIG

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08), 0 -1px 0 rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 gap-2">

        {/* Left: Zeptio wordmark */}
        <Link href="/dashboard" className="shrink-0">
          <span className="fredoka font-black text-xl" style={{ color: '#1A1A1A' }}>
            Zeptio
          </span>
        </Link>

        {/* Center: Score + Streak */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap"
            style={{ background: '#F5F5F5', border: '1px solid #E8E8E8' }}
          >
            <span style={{ color: '#999999' }}>Score</span>
            <span className="tabular-nums" style={{ color: '#1A1A1A' }}>{totalXp}</span>
          </div>
          <div
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap"
            style={{ background: '#F5F5F5', border: '1px solid #E8E8E8' }}
          >
            <span>🔥</span>
            <span className="tabular-nums" style={{ color: '#1A1A1A' }}>{streak}</span>
          </div>
        </div>

        {/* Right: Profile avatar */}
        <Link
          href="/profile"
          aria-label="View your profile"
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] shrink-0"
          style={{ background: '#F5F5F5', border: '1.5px solid #E0E0E0' }}
        >
          <RobotSVG config={robotConfig} size={36} headOnly />
        </Link>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center text-xs pb-3" style={{ color: '#CCCCCC' }}>
        <a href="/privacy" className="transition-colors hover:text-[#1A1A1A] px-2">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms"   className="transition-colors hover:text-[#1A1A1A] px-2">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="/support" className="transition-colors hover:text-[#1A1A1A] px-2">Support</a>
      </div>
    </div>
  )
}
