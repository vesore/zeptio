'use client'

import Link from 'next/link'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

// Snaking planet layout — same positions for all worlds
const PLANET_POS = [
  { x: 22, y: 90  },
  { x: 48, y: 175 },
  { x: 72, y: 265 },
  { x: 55, y: 350 },
  { x: 26, y: 430 },
  { x: 50, y: 508 },
  { x: 76, y: 585 },
  { x: 56, y: 660 },
  { x: 28, y: 735 },
  { x: 54, y: 815 },
]

const CONTAINER_HEIGHT = 880
const PLANET_R         = 28
const ROBOT_SIZE       = 44

// Deterministic stars — no hydration mismatch
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x:        ((i * 127 + 43) % 97) + 1.5,
  y:        ((i * 73  + 19) % 97) + 1.5,
  delay:    parseFloat(((i * 0.37) % 4).toFixed(2)),
  size:     ((i * 7) % 3) + 1,
  duration: parseFloat((((i * 0.23) % 2) + 1.8).toFixed(2)),
}))

export interface WorldLevel {
  id: number
  title: string
}

interface WorldGalaxyMapProps {
  levels:       WorldLevel[]
  bestScores:   Record<number, number>
  robotConfig?: RobotConfig
  /** Hex accent color for completed planets, e.g. '#B87333' */
  accent:       string
  /** Base URL for level pages, e.g. `/dashboard/structure` */
  baseLevelHref: string
  /**
   * Optional override for unlock status (one boolean per level, 0-indexed).
   * When provided, this replaces the default unlock logic entirely.
   */
  unlockedOverride?: boolean[]
}

export default function WorldGalaxyMap({
  levels,
  bestScores,
  robotConfig = DEFAULT_ROBOT_CONFIG,
  accent,
  baseLevelHref,
  unlockedOverride,
}: WorldGalaxyMapProps) {
  /** Compute average score for levels[fromIdx..toIdx] (inclusive) */
  function avgRange(fromIdx: number, toIdx: number): number {
    const slice = levels.slice(fromIdx, toIdx + 1)
    if (slice.length === 0) return 0
    return slice.reduce((sum, l) => sum + (bestScores[l.id] ?? 0), 0) / slice.length
  }

  /**
   * New unlock rules (0-indexed):
   *  idx 0         — always unlocked (Level 1)
   *  idx 1–4       — prev level scored 60+
   *  idx 5–7       — prev level 60+ AND avg(0–4) ≥ 70
   *  idx 8–9       — prev level 60+ AND avg(0–7) ≥ 80
   *
   * If `unlockedOverride` is provided it takes full precedence.
   */
  function isUnlocked(idx: number): boolean {
    if (unlockedOverride) return unlockedOverride[idx] ?? false
    if (idx === 0) return true
    const prevScore = bestScores[levels[idx - 1].id] ?? 0
    if (prevScore < 60) return false
    if (idx >= 5 && idx <= 7) return avgRange(0, 4) >= 70
    if (idx >= 8) return avgRange(0, 7) >= 80
    return true
  }

  function isCompleted(idx: number): boolean {
    return (bestScores[levels[idx].id] ?? 0) >= 60
  }

  const currentIdx = levels.findIndex((_, i) => isUnlocked(i) && !isCompleted(i))
  const robotIdx   = currentIdx === -1 ? levels.length - 1 : currentIdx
  const robotPos   = PLANET_POS[robotIdx]

  return (
    <div style={{ position: 'relative', width: '100%', height: CONTAINER_HEIGHT + 'px' }}>

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.x + '%', top: s.y + '%',
          width: s.size + 'px', height: s.size + 'px',
          borderRadius: '50%', background: 'white',
          animationName: 'twinkle', animationDuration: s.duration + 's',
          animationDelay: s.delay + 's', animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
        }} aria-hidden="true" />
      ))}

      {/* Dotted trail connecting planets */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 100 ${CONTAINER_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {levels.map((level, i) => {
          if (i >= levels.length - 1) return null
          const from = PLANET_POS[i]
          const to   = PLANET_POS[i + 1]
          const done = isCompleted(i)
          const open = isUnlocked(i)
          return (
            <line
              key={level.id}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke={done ? accent : open ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)'}
              strokeOpacity={done ? 0.55 : 1}
              strokeWidth="0.6"
              strokeDasharray="3,5"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>

      {/* Robot companion — floats above current planet */}
      <div
        className="robot-float"
        style={{
          position:  'absolute',
          left:      robotPos.x + '%',
          top:       (robotPos.y - PLANET_R - ROBOT_SIZE - 6) + 'px',
          transform: 'translateX(-50%)',
          zIndex:    20,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <RobotSVG config={robotConfig} size={ROBOT_SIZE} headOnly expression="idle" antennaMode="blink" />
      </div>

      {/* Planet nodes */}
      {levels.map((level, i) => {
        const pos       = PLANET_POS[i]
        const unlocked  = isUnlocked(i)
        const completed = isCompleted(i)
        const isCurrent = unlocked && !completed
        const best      = bestScores[level.id]

        // Unlock hint for locked levels
        let lockHint = ''
        if (!unlocked && i >= 8) lockHint = '80+ avg req'
        else if (!unlocked && i >= 5) lockHint = '70+ avg req'

        const planet = (
          <div
            className={completed ? 'planet-completed' : isCurrent ? 'planet-current' : ''}
            style={{
              width:  PLANET_R * 2 + 'px',
              height: PLANET_R * 2 + 'px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: completed ? accent : isCurrent ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
              border: `2px solid ${completed ? accent : isCurrent ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.06)'}`,
              fontSize: '15px', fontWeight: 900, fontFamily: 'monospace',
              color: completed ? '#0F0F0F' : isCurrent ? 'white' : 'rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          >
            {completed ? '✓' : i + 1}
          </div>
        )

        const label = (
          <div style={{ textAlign: 'center', marginTop: '5px', width: '84px' }}>
            <p style={{
              fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 600, lineHeight: 1.3,
              color: completed ? accent : isCurrent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
            }}>
              {level.title}
            </p>
            {best !== undefined && (
              <p style={{ fontSize: '8px', fontFamily: 'monospace', marginTop: '2px',
                color: best >= 80 ? '#00FF88' : best >= 60 ? '#B87333' : '#C84B1F' }}>
                {best}/100
              </p>
            )}
            {!unlocked && (
              <p style={{ fontSize: '9px', marginTop: '1px', opacity: 0.5 }}>
                {lockHint || '🔒'}
              </p>
            )}
          </div>
        )

        const wrapperStyle: React.CSSProperties = {
          position:  'absolute',
          left:      pos.x + '%',
          top:       pos.y + 'px',
          transform: 'translate(-50%, -50%)',
          display:   'flex', flexDirection: 'column', alignItems: 'center',
          opacity:   unlocked ? 1 : 0.38,
          textDecoration: 'none',
        }

        if (unlocked) {
          return (
            <Link
              key={level.id}
              href={`${baseLevelHref}/${i + 1}`}
              style={{ ...wrapperStyle, cursor: 'pointer' }}
              aria-label={`Level ${i + 1}: ${level.title}${best !== undefined ? `, best score ${best}/100` : ''}`}
            >
              {planet}
              {label}
            </Link>
          )
        }
        return (
          <div key={level.id} style={{ ...wrapperStyle, cursor: 'default' }} aria-hidden="true">
            {planet}
            {label}
          </div>
        )
      })}
    </div>
  )
}
