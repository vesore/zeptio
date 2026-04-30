'use client'

import Link from 'next/link'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

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
const PLANET_R  = 28
const ROBOT_SIZE = 44
const ACCENT = '#4A90E2'

interface GalaxyMapProps {
  bestScores: Record<number, number>
  robotConfig?: RobotConfig
}

export default function GalaxyMap({ bestScores, robotConfig = DEFAULT_ROBOT_CONFIG }: GalaxyMapProps) {
  function avgRange(fromId: number, toId: number): number {
    let sum = 0
    const count = toId - fromId + 1
    for (let id = fromId; id <= toId; id++) sum += bestScores[id] ?? 0
    return sum / count
  }

  function isUnlocked(levelId: number): boolean {
    if (levelId === 1) return true
    const prevScore = bestScores[levelId - 1] ?? 0
    if (prevScore < 60) return false
    if (levelId >= 6 && levelId <= 8) return avgRange(1, 5) >= 70
    if (levelId >= 9) return avgRange(1, 8) >= 80
    return true
  }

  function isCompleted(levelId: number): boolean {
    return (bestScores[levelId] ?? 0) >= 60
  }

  const currentIdx = CLARITY_LEVELS.findIndex(l => isUnlocked(l.id) && !isCompleted(l.id))
  const robotIdx   = currentIdx === -1 ? CLARITY_LEVELS.length - 1 : currentIdx
  const robotPos   = PLANET_POS[robotIdx]

  return (
    <div style={{ position: 'relative', width: '100%', height: CONTAINER_HEIGHT + 'px' }}>

      {/* Connecting trail */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 100 ${CONTAINER_HEIGHT}`}
        preserveAspectRatio="none"
      >
        {CLARITY_LEVELS.map((level, i) => {
          if (i >= CLARITY_LEVELS.length - 1) return null
          const from = PLANET_POS[i]
          const to   = PLANET_POS[i + 1]
          const done = isCompleted(level.id)
          const open = isUnlocked(level.id)
          return (
            <line
              key={level.id}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke={done ? `${ACCENT}60` : open ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="0.7"
              strokeDasharray="3,4"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>

      {/* Robot companion */}
      <div
        className="robot-float"
        style={{
          position: 'absolute',
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

      {/* Level nodes */}
      {CLARITY_LEVELS.map((level, i) => {
        const pos       = PLANET_POS[i]
        const unlocked  = isUnlocked(level.id)
        const completed = isCompleted(level.id)
        const isCurrent = unlocked && !completed
        const best      = bestScores[level.id]

        let lockHint = ''
        if (!unlocked && level.id >= 9) lockHint = '80+ avg'
        else if (!unlocked && level.id >= 6) lockHint = '70+ avg'

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
            background:  ACCENT,
            border:      `2px solid ${ACCENT}`,
            color:       '#FFFFFF',
            boxShadow:   `0 4px 16px ${ACCENT}50`,
          } : isCurrent ? {
            background:  '#FFFFFF',
            border:      `2.5px solid ${ACCENT}`,
            color:       ACCENT,
            boxShadow:   `0 4px 16px ${ACCENT}30, 0 0 0 4px ${ACCENT}15`,
          } : {
            background:  '#F0F0F0',
            border:      '2px solid #DDDDDD',
            color:       '#BBBBBB',
            boxShadow:   '0 2px 6px rgba(0,0,0,0.06)',
          }),
        }

        const label = (
          <div style={{ textAlign: 'center', marginTop: '6px', width: '88px' }}>
            <p style={{
              fontSize:   '9px',
              fontFamily: 'var(--font-fredoka)',
              fontWeight: 700,
              lineHeight: 1.3,
              color: completed ? ACCENT : isCurrent ? '#1A1A1A' : '#BBBBBB',
            }}>
              {level.title}
            </p>
            {best !== undefined && (
              <p style={{
                fontSize:   '8.5px',
                fontFamily: 'var(--font-fredoka)',
                marginTop:  '2px',
                fontWeight: 700,
                color: best >= 80 ? '#4AE27A' : best >= 60 ? ACCENT : '#E24A4A',
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
          position:   'absolute',
          left:       pos.x + '%',
          top:        pos.y + 'px',
          transform:  'translate(-50%, -50%)',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity:    unlocked ? 1 : 0.45,
          textDecoration: 'none',
        }

        if (unlocked) {
          return (
            <Link
              key={level.id}
              href={`/dashboard/clarity/${level.id}`}
              style={wrapperStyle}
              className="group"
            >
              <div style={nodeStyle} className="group-hover:scale-110 group-hover:shadow-lg">
                {completed ? '✓' : level.id}
              </div>
              {label}
            </Link>
          )
        }

        return (
          <div key={level.id} style={wrapperStyle}>
            <div style={nodeStyle}>{level.id}</div>
            {label}
          </div>
        )
      })}
    </div>
  )
}
