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
              stroke={done ? `${accent}60` : open ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="0.7"
              strokeDasharray="3,4"
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
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
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

        const nodeStyle: React.CSSProperties = {
          width:          PLANET_R * 2 + 'px',
          height:         PLANET_R * 2 + 'px',
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '15px',
          fontWeight:     900,
          fontFamily:     'var(--font-fredoka)',
          flexShrink:     0,
          transition:     'transform 0.15s ease, box-shadow 0.15s ease',
          ...(completed ? {
            background: accent,
            border:     `2px solid ${accent}`,
            color:      '#FFFFFF',
            boxShadow:  `0 4px 16px ${accent}50`,
          } : isCurrent ? {
            background: '#FFFFFF',
            border:     `2.5px solid ${accent}`,
            color:      accent,
            boxShadow:  `0 4px 16px ${accent}30, 0 0 0 4px ${accent}15`,
          } : {
            background: '#F0F0F0',
            border:     '2px solid #DDDDDD',
            color:      '#BBBBBB',
            boxShadow:  '0 2px 6px rgba(0,0,0,0.06)',
          }),
        }

        const planet = (
          <div style={nodeStyle} className="group-hover:scale-110 group-hover:shadow-lg">
            {completed ? '✓' : i + 1}
          </div>
        )

        const label = (
          <div style={{ textAlign: 'center', marginTop: '6px', width: '88px' }}>
            <p style={{
              fontSize:   '9px',
              fontFamily: 'var(--font-fredoka)',
              fontWeight: 700,
              lineHeight: 1.3,
              color: completed ? accent : isCurrent ? '#1A1A1A' : '#BBBBBB',
            }}>
              {level.title}
            </p>
            {best !== undefined && (
              <p style={{
                fontSize:   '8.5px',
                fontFamily: 'var(--font-fredoka)',
                marginTop:  '2px',
                fontWeight: 700,
                color: best >= 80 ? '#4AE27A' : best >= 60 ? accent : '#E24A4A',
              }}>
                {best}/100
              </p>
            )}
            {!unlocked && (
              <p style={{ fontSize: '8px', marginTop: '2px', color: '#CCCCCC' }}>
                {lockHint || '🔒'}
              </p>
            )}
          </div>
        )

        const wrapperStyle: React.CSSProperties = {
          position:       'absolute',
          left:           pos.x + '%',
          top:            pos.y + 'px',
          transform:      'translate(-50%, -50%)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          opacity:        unlocked ? 1 : 0.45,
          textDecoration: 'none',
        }

        if (unlocked) {
          return (
            <Link
              key={level.id}
              href={`${baseLevelHref}/${i + 1}`}
              style={wrapperStyle}
              className="group"
              aria-label={`Level ${i + 1}: ${level.title}${best !== undefined ? `, best score ${best}/100` : ''}`}
            >
              {planet}
              {label}
            </Link>
          )
        }
        return (
          <div key={level.id} style={wrapperStyle}>
            {planet}
            {label}
          </div>
        )
      })}
    </div>
  )
}
