'use client'

import Link from 'next/link'
import { PART_BY_ID, WORLD_ACCENT } from '@/src/lib/seedParts'

interface Props {
  unlockedPartIds: string[]
  onDismiss: () => void
}

export default function PartUnlockCelebration({ unlockedPartIds, onDismiss }: Props) {
  if (unlockedPartIds.length === 0) return null

  const parts = unlockedPartIds
    .map((id) => PART_BY_ID[id])
    .filter(Boolean)

  if (parts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes partUnlockSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          maxWidth: '320px',
          width: 'calc(100vw - 48px)',
          animation: 'partUnlockSlideIn 0.4s ease-out',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E8E8E8',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#1A1A1A',
              }}
            >
              🎉 New Part Unlocked!
            </span>
            <button
              onClick={onDismiss}
              aria-label="Dismiss part unlock notification"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#AAAAAA',
                fontSize: '18px',
                lineHeight: 1,
                padding: '0 2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Parts list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {parts.map((part) => {
              const accent = WORLD_ACCENT[part.world]
              const worldLabel = part.world.charAt(0).toUpperCase() + part.world.slice(1)
              return (
                <div
                  key={part.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <part.Icon color={accent} size={36} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        lineHeight: 1.2,
                      }}
                    >
                      {part.name}
                    </span>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: accent,
                        background: `${accent}18`,
                        border: `1px solid ${accent}30`,
                        borderRadius: '9999px',
                        padding: '1px 8px',
                        width: 'fit-content',
                      }}
                    >
                      {worldLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* View in Factory button */}
          <Link
            href="/profile?tab=parts"
            onClick={onDismiss}
            style={{
              display: 'block',
              background: '#1A1A1A',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            View in Factory →
          </Link>
        </div>
      </div>
    </>
  )
}
