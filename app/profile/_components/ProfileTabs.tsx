'use client'

import Link from 'next/link'
import { useState } from 'react'
import EditNameForm from './EditNameForm'
import RobotCustomizer from './RobotCustomizer'
import ProfileExtrasForm from './ProfileExtrasForm'
import PartsFactory from './PartsFactory'
import { type RobotConfig } from './RobotSVG'

// ── Badge definitions (mirrored from page.tsx) ────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface UnlockedParts {
  antenna: boolean
  glowingEyes: boolean
  goldBody: boolean
  crown: boolean
}

export interface ProfileTabsProps {
  // Profile tab data
  displayName: string
  userEmail: string
  memberSince: string | null
  initialBio: string
  initialFavoriteWorld: string
  robotConfig: RobotConfig
  unlockedParts: UnlockedParts
  bodyUnlocked: boolean
  earnedBadgeIds: string[]
  signOutAction: () => Promise<void>
  // Parts tab data
  worldPoints: Record<string, number>
  ownedPartIds: string[]
  equippedPartIds: string[]
}

type ActiveTab = 'profile' | 'parts'

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileTabs({
  displayName,
  userEmail,
  memberSince,
  initialBio,
  initialFavoriteWorld,
  robotConfig,
  unlockedParts,
  bodyUnlocked,
  earnedBadgeIds,
  signOutAction,
  worldPoints,
  ownedPartIds,
  equippedPartIds,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const earnedBadges = new Set(earnedBadgeIds)

  return (
    <>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #E8E8E8',
          marginBottom: 24,
          background: '#FFFFFF',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Profile tab */}
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 0 10px',
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === 'profile' ? '#4A90E2' : '#999999',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid #4A90E2' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Profile
        </button>

        {/* Parts tab */}
        <button
          onClick={() => setActiveTab('parts')}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 0 10px',
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === 'parts' ? '#4A90E2' : '#999999',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'parts' ? '2px solid #4A90E2' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          🏭 Parts
        </button>

        {/* Journal tab — navigates away */}
        <Link
          href="/journal"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 0 10px',
            fontSize: 14,
            fontWeight: 700,
            color: '#999999',
            borderBottom: '2px solid transparent',
            textDecoration: 'none',
            display: 'block',
          }}
        >
          📖 Journal
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Robot Customizer */}
          <section>
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#4A90E2' }}>
              Your Robot
            </p>
            <RobotCustomizer
              initialConfig={robotConfig}
              unlockedParts={unlockedParts}
              bodyUnlocked={bodyUnlocked}
            />
          </section>

          {/* Profile form */}
          <section
            className="rounded-3xl p-5 sm:p-6 overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#4A90E2' }}>
              Profile
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <EditNameForm initialName={displayName} />
                <p className="mt-1 text-base truncate" style={{ color: '#888888' }}>
                  {userEmail}
                </p>
                {memberSince && (
                  <p className="mt-0.5 text-sm" style={{ color: '#999999' }}>
                    Member since {memberSince}
                  </p>
                )}
              </div>
              <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: '1rem' }}>
                <ProfileExtrasForm
                  initialBio={initialBio}
                  initialFavoriteWorld={initialFavoriteWorld}
                />
              </div>
            </div>
          </section>

          {/* Badges */}
          <section>
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#4A90E2' }}>
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
                      background: earned ? 'rgba(74,144,226,0.07)' : '#F5F5F5',
                      border:     earned ? '1px solid rgba(74,144,226,0.25)' : '1px solid #E8E8E8',
                      boxShadow:  earned ? '0 2px 12px rgba(74,144,226,0.1)' : 'none',
                      opacity:    earned ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xl" role="img" aria-label={badge.name}>
                        {earned ? badge.icon : '🔒'}
                      </span>
                      {earned && (
                        <span
                          className="text-[9px] font-bold rounded-full px-1.5 py-0.5 uppercase tracking-wider shrink-0"
                          style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2' }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">{badge.name}</p>
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: '#888888' }}>
                        {badge.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Sign out */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-full py-4 font-bold text-lg tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] border border-red-400/30 text-red-400/60 hover:border-red-400 hover:text-red-400"
            >
              Sign Out
            </button>
          </form>

        </div>
      )}

      {activeTab === 'parts' && (
        <PartsFactory
          worldPoints={worldPoints}
          ownedPartIds={ownedPartIds}
          equippedPartIds={equippedPartIds}
        />
      )}
    </>
  )
}
