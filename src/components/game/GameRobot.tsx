'use client'

export type RobotExpression = 'idle' | 'loading' | 'happy' | 'excited' | 'sad' | 'neutral' | 'perfect'

export default function GameRobot({ expression }: { expression: RobotExpression }) {
  const isHappy   = expression === 'happy' || expression === 'excited' || expression === 'perfect'
  const isSad     = expression === 'sad'
  const isLoading = expression === 'loading'
  const isPerfect = expression === 'perfect'
  const isExcited = expression === 'excited' || expression === 'perfect'

  const animClass = isExcited ? 'robot-bounce' : 'robot-float'

  return (
    <div className={animClass} style={{ display: 'inline-block' }}>
      <svg viewBox="0 0 80 112" width={72} height={101} aria-hidden="true">

        {/* Crown (perfect only) — rendered before antenna so it's behind */}
        {isPerfect && (
          <g>
            <rect x="18" y="9" width="44" height="8" rx="2.5" fill="#f59e0b"/>
            <polygon points="20,9 25,1 30,9" fill="#f59e0b"/>
            <polygon points="37,9 40,-1 43,9" fill="#f59e0b"/>
            <polygon points="50,9 55,1 60,9" fill="#f59e0b"/>
            <circle cx="25" cy="3" r="2" fill="#fef08a"/>
            <circle cx="40" cy="-1" r="2" fill="#fef08a"/>
            <circle cx="55" cy="3" r="2" fill="#fef08a"/>
          </g>
        )}

        {/* Antenna */}
        <line x1="40" y1="9" x2="40" y2="19" stroke="#B0E020" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="40" cy="7" r="3.5" fill="#2D3148" stroke="#B0E020" strokeWidth="1.5"/>
        <circle cx="40" cy="7" r="1.5" fill="#B0E020"/>

        {/* Head */}
        <rect x="12" y="19" width="56" height="40" rx="10" fill="#2D3148" stroke="#B0E020" strokeWidth="1.5"/>

        {/* Loading eyes — spinning arcs */}
        {isLoading && (
          <>
            <circle cx="28" cy="37" r="7" fill="none" stroke="#B0E020" strokeWidth="2"
              strokeDasharray="11 5" strokeLinecap="round" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate"
                from="0 28 37" to="360 28 37" dur="0.9s" repeatCount="indefinite"/>
            </circle>
            <circle cx="52" cy="37" r="7" fill="none" stroke="#B0E020" strokeWidth="2"
              strokeDasharray="11 5" strokeLinecap="round" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate"
                from="0 52 37" to="360 52 37" dur="0.9s" repeatCount="indefinite"/>
            </circle>
          </>
        )}

        {/* Happy eyes — ^^ arcs */}
        {isHappy && (
          <>
            <path d="M20 41 Q28 31 36 41" stroke="#B0E020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M44 41 Q52 31 60 41" stroke="#B0E020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}

        {/* Sad eyes — vv arcs */}
        {isSad && (
          <>
            <path d="M20 34 Q28 43 36 34" stroke="#B0E020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M44 34 Q52 43 60 34" stroke="#B0E020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}

        {/* Neutral/idle eyes — circle pupils */}
        {!isLoading && !isHappy && !isSad && (
          <>
            <circle cx="28" cy="37" r="6.5" fill="#B0E020"/>
            <circle cx="28" cy="37" r="2.8" fill="#1A1D2B"/>
            <circle cx="52" cy="37" r="6.5" fill="#B0E020"/>
            <circle cx="52" cy="37" r="2.8" fill="#1A1D2B"/>
          </>
        )}

        {/* Mouth */}
        {isHappy
          ? <path d="M26 51 Q40 62 54 51" stroke="#B0E020" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85"/>
          : isSad
            ? <path d="M26 56 Q40 47 54 56" stroke="#B0E020" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85"/>
            : <rect x="26" y="52" width="28" height="3" rx="1.5" fill="#B0E020" opacity="0.4"/>
        }

        {/* Neck */}
        <rect x="36" y="59" width="8" height="8" fill="#2D3148" stroke="#B0E020" strokeWidth="1.5"/>

        {/* Body */}
        <rect x="12" y="67" width="56" height="42" rx="9" fill="#2D3148" stroke="#B0E020" strokeWidth="1.5"/>

        {/* Central LED */}
        <circle cx="40" cy="86" r="5.5" fill="#2D3148" stroke="#B0E020" strokeWidth="1.5"/>
        <circle cx="40" cy="86" r="2.5" fill="#B0E020" opacity={isHappy ? 1 : 0.5}/>

        {/* Vent bars */}
        <rect x="17" y="99" width="10" height="3" rx="1.5" fill="#B0E020" opacity="0.28"/>
        <rect x="34" y="99" width="12" height="3" rx="1.5" fill="#B0E020" opacity="0.28"/>
        <rect x="53" y="99" width="10" height="3" rx="1.5" fill="#B0E020" opacity="0.28"/>

        {/* Stars for excited/perfect */}
        {isExcited && (
          <>
            <text x="1" y="17" fontSize="9" fill="#facc15" opacity="0.85">✦</text>
            <text x="69" y="19" fontSize="7" fill="#facc15" opacity="0.7">★</text>
          </>
        )}
      </svg>
    </div>
  )
}
