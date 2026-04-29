'use client'

import Link from 'next/link'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

// Deterministic star positions — avoids hydration mismatch
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: ((i * 127 + 43) % 97) + 1.5,
  y: ((i * 73 + 19) % 97) + 1.5,
  delay: parseFloat(((i * 0.37) % 4).toFixed(2)),
  size: ((i * 7) % 3) + 1,
  duration: parseFloat((((i * 0.23) % 2) + 1.8).toFixed(2)),
}))

// Snaking planet layout — x as %, y as px within CONTAINER_HEIGHT
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
const PLANET_R = 28
const ROBOT_SIZE = 44

interface GalaxyMapProps {
  bestScores: Record<number, number>
  robotConfig?: RobotConfig
}

export default function GalaxyMap({ bestScores, robotConfig = DEFAULT_ROBOT_CONFIG }: GalaxyMapProps) {
  /** Average score for levelIds [fromId..toId] inclusive (1-indexed) */
  function avgRange(fromId: number, toId: number): number {
    let sum = 0
    const count = toId - fromId + 1
    for (let id = fromId; id <= toId; id++) sum += bestScores[id] ?? 0
    return sum / count
  }

  /**
   * New unlock rules (levelId is 1-indexed, matching CLARITY_LEVELS ids 1-10):
   *  levelId 1     — always unlocked
   *  levelId 2–5   — prev level scored 60+
   *  levelId 6–8   — prev level 60+ AND avg(1–5) ≥ 70
   *  levelId 9–10  — prev level 60+ AND avg(1–8) ≥ 80
   */
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

  // Find the current active planet (first unlocked + not completed), else last planet
  const currentIdx = CLARITY_LEVELS.findIndex(l => isUnlocked(l.id) && !isCompleted(l.id))
  const robotIdx   = currentIdx === -1 ? CLARITY_LEVELS.length - 1 : currentIdx
  const robotPos   = PLANET_POS[robotIdx]

  return (
    <div style={{ position: 'relative', width: '100%', height: CONTAINER_HEIGHT + 'px' }}>

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x + '%',
            top: s.y + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            borderRadius: '50%',
            background: 'white',
            animationName: 'twinkle',
            animationDuration: s.duration + 's',
            animationDelay: s.delay + 's',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }}
        />
      ))}

      {/* Dotted trail connecting planets — SVG overlay */}
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
              stroke={done ? 'rgba(74,144,226,0.45)' : open ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)'}
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
          position: 'absolute',
          left:      robotPos.x + '%',
          top:       (robotPos.y - PLANET_R - ROBOT_SIZE - 6) + 'px',
          transform: 'translateX(-50%)',
          zIndex:    20,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <RobotSVG
          config={robotConfig}
          size={ROBOT_SIZE}
          headOnly
          expression="idle"
          antennaMode="blink"
        />
      </div>

      {/* Planet nodes */}
      {CLARITY_LEVELS.map((level, i) => {
        const pos       = PLANET_POS[i]
        const unlocked  = isUnlocked(level.id)
        const completed = isCompleted(level.id)
        const isCurrent = unlocked && !completed
        const best      = bestScores[level.id]

        let lockHint = ''
        if (!unlocked && level.id >= 9) lockHint = '80+ avg req'
        else if (!unlocked && level.id >= 6) lockHint = '70+ avg req'

        const planetCircle = (
          <div
            className={completed ? 'planet-completed' : isCurrent ? 'planet-current' : ''}
            style={{
              width:        PLANET_R * 2 + 'px',
              height:       PLANET_R * 2 + 'px',
              borderRadius: '50%',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              background: completed
                ? '#00FF88'
                : isCurrent
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(0,0,0,0.03)',
              border: `2px solid ${completed ? '#00FF88' : isCurrent ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.06)'}`,
              fontSize:   '15px',
              fontWeight: 900,
              fontFamily: 'var(--font-fredoka)',
              color: completed ? '#0F0F0F' : isCurrent ? 'white' : 'rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          >
            {completed ? '✓' : level.id}
          </div>
        )

        const label = (
          <div style={{ textAlign: 'center', marginTop: '5px', width: '84px' }}>
            <p style={{
              fontSize: '8.5px',
              fontFamily: 'var(--font-fredoka)',
              fontWeight: 600,
              lineHeight: 1.3,
              color: completed
                ? '#00FF88'
                : isCurrent
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(255,255,255,0.2)',
            }}>
              {level.title}
            </p>
            {best !== undefined && (
              <p style={{
                fontSize: '8px',
                fontFamily: 'var(--font-fredoka)',
                marginTop: '2px',
                color: best >= 80 ? '#00FF88' : best >= 60 ? '#B87333' : '#C84B1F',
              }}>
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
          display:   'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity:   unlocked ? 1 : 0.38,
          textDecoration: 'none',
        }

        if (unlocked) {
          return (
            <Link
              key={level.id}
              href={`/dashboard/clarity/${level.id}`}
              style={{ ...wrapperStyle, cursor: 'pointer' }}
            >
              {planetCircle}
              {label}
            </Link>
          )
        }

        return (
          <div key={level.id} style={{ ...wrapperStyle, cursor: 'default' }}>
            {planetCircle}
            {label}
          </div>
        )
      })}
    </div>
  )
}
