'use client'

import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig, type RobotExpression } from '@/app/profile/_components/RobotSVG'

export type { RobotExpression }

const SPEECH: Record<RobotExpression, string> = {
  idle:    'What will you create?',
  typing:  'I see you thinking...',
  loading: 'Analyzing your prompt...',
  neutral: 'Getting warmer...',
  happy:   'Nice work, human!',
  excited: 'Impressive!',
  perfect: 'PERFECT. You are one of us.',
  sad:     'Keep practicing, human.',
}

const ANIM_CLASS: Record<RobotExpression, string> = {
  idle:    'robot-float',
  typing:  'robot-lean',
  loading: 'robot-float',
  neutral: 'robot-float',
  happy:   'robot-float',
  excited: 'robot-bounce',
  perfect: 'robot-bounce',
  sad:     'robot-float',
}

const ANTENNA_MODE: Record<RobotExpression, 'static' | 'blink' | 'spin'> = {
  idle:    'blink',
  typing:  'static',
  loading: 'spin',
  neutral: 'static',
  happy:   'static',
  excited: 'static',
  perfect: 'static',
  sad:     'static',
}

interface GameRobotProps {
  config?: RobotConfig
  expression?: RobotExpression
  size?: number
  showBubble?: boolean
  worldAccent?: string
}

export default function GameRobot({
  config = DEFAULT_ROBOT_CONFIG,
  expression = 'idle',
  size = 80,
  showBubble = true,
  worldAccent = '#4A90E2',
}: GameRobotProps) {
  const animClass   = ANIM_CLASS[expression]
  const antennaMode = ANTENNA_MODE[expression]
  const bubbleText  = SPEECH[expression]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Speech bubble */}
      {showBubble && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'relative',
              padding: '6px 10px',
              borderRadius: '12px',
              fontSize: '10px',
              fontFamily: 'var(--font-nunito)',
              fontWeight: 600,
              color: '#1A1A1A',
              background: 'rgba(255,255,255,0.96)',
              border: `1px solid ${worldAccent}40`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          >
            {bubbleText}
            {/* Tail */}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `5px solid ${worldAccent}40`,
            }} />
          </div>
        </div>
      )}

      {/* Robot */}
      <div className={animClass}>
        <RobotSVG
          config={config}
          size={size}
          expression={expression}
          antennaMode={antennaMode}
        />
      </div>
    </div>
  )
}
