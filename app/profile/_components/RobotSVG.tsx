export type RobotStyle = 0 | 1 | 2 | 3

export type RobotExpression =
  | 'idle' | 'typing' | 'loading'
  | 'happy' | 'excited' | 'perfect'
  | 'sad' | 'neutral'

export interface RobotConfig {
  style: RobotStyle
  glowingEyes: boolean
  antenna: boolean
  goldBody: boolean
  crown: boolean
  name: string
}

export const DEFAULT_ROBOT_CONFIG: RobotConfig = {
  style: 0,
  glowingEyes: false,
  antenna: false,
  goldBody: false,
  crown: false,
  name: '',
}

// Y coord of top edge of head for each style
const HEAD_TOP: Record<RobotStyle, number> = { 0: 38, 1: 33, 2: 30, 3: 28 }

// Eye center positions per style (used for expression overlays)
const EYE_POS: Record<RobotStyle, { lx: number; ly: number; rx: number; ry: number; r: number }> = {
  0: { lx: 47, ly: 65, rx: 73, ry: 65, r: 7 },
  1: { lx: 46, ly: 70, rx: 74, ry: 70, r: 8 },
  2: { lx: 44, ly: 59, rx: 76, ry: 59, r: 7 },
  3: { lx: 51, ly: 65, rx: 70, ry: 65, r: 5 },
}

function ExpressionEyes({ expression, style, eyeFill }: { expression: RobotExpression; style: RobotStyle; eyeFill: string }) {
  const { lx, ly, rx, ry, r } = EYE_POS[style]

  if (expression === 'loading') {
    return (
      <>
        <circle cx={lx} cy={ly} r={r} fill="none" stroke={eyeFill} strokeWidth="2"
          strokeDasharray={`${r * 1.6} ${r * 2.4}`} strokeLinecap="round" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${lx} ${ly}`} to={`360 ${lx} ${ly}`} dur="0.75s" repeatCount="indefinite" />
        </circle>
        <circle cx={rx} cy={ry} r={r} fill="none" stroke={eyeFill} strokeWidth="2"
          strokeDasharray={`${r * 1.6} ${r * 2.4}`} strokeLinecap="round" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${rx} ${ry}`} to={`360 ${rx} ${ry}`} dur="0.75s" repeatCount="indefinite" />
        </circle>
      </>
    )
  }

  if (expression === 'happy' || expression === 'excited' || expression === 'perfect') {
    return (
      <>
        <path d={`M ${lx - r} ${ly + 2} Q ${lx} ${ly - r * 1.35} ${lx + r} ${ly + 2}`}
          stroke={eyeFill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M ${rx - r} ${ry + 2} Q ${rx} ${ry - r * 1.35} ${rx + r} ${ry + 2}`}
          stroke={eyeFill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }

  if (expression === 'sad') {
    return (
      <>
        <path d={`M ${lx - r} ${ly - 2} Q ${lx} ${ly + r * 1.2} ${lx + r} ${ly - 2}`}
          stroke={eyeFill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M ${rx - r} ${ry - 2} Q ${rx} ${ry + r * 1.2} ${rx + r} ${ry - 2}`}
          stroke={eyeFill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  }

  if (expression === 'neutral') {
    return (
      <>
        <line x1={lx - r} y1={ly} x2={lx + r} y2={ly}
          stroke={eyeFill} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <line x1={rx - r} y1={ry} x2={rx + r} y2={ry}
          stroke={eyeFill} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </>
    )
  }

  return null
}

const showNormalEyes = (expr: RobotExpression) => expr === 'idle' || expr === 'typing'

export function RobotSVG({
  config,
  size = 140,
  headOnly = false,
  expression = 'idle',
  antennaMode = 'static',
}: {
  config: RobotConfig
  size?: number
  headOnly?: boolean
  expression?: RobotExpression
  antennaMode?: 'static' | 'blink' | 'spin'
}) {
  const accent   = config.goldBody ? '#f59e0b' : '#4A90E2'
  const headFill = '#F0F0F0'
  const bodyFill = config.goldBody ? '#78350f' : '#E8E8E8'
  const eyeFill  = config.goldBody ? '#f59e0b' : '#4A90E2'
  const pupilFill = '#FFFFFF'
  const ht       = HEAD_TOP[config.style]
  const height   = headOnly ? size : Math.round(size * 170 / 120)
  const viewBox  = headOnly ? '0 0 120 120' : '0 0 120 170'

  return (
    <svg viewBox={viewBox} width={size} height={height} aria-hidden="true">

      {/* ── ANTENNA ───────────────────────────────── */}
      {config.antenna && (
        <g>
          {antennaMode === 'spin' && (
            <animateTransform attributeName="transform" type="rotate"
              from={`0 38 ${ht}`} to={`360 38 ${ht}`} dur="0.45s" repeatCount="indefinite" />
          )}
          <line x1="38" y1={ht} x2="38" y2="11" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="38" cy="8" r="5.5" fill={headFill} stroke={accent} strokeWidth="2" />
          <circle
            cx="38" cy="8" r="2.5" fill={accent}
            className={antennaMode === 'blink' ? 'antenna-blink' : undefined}
          />
        </g>
      )}

      {/* ── CROWN ─────────────────────────────────── */}
      {config.crown && (
        <g>
          <rect x="33" y={ht - 9} width="54" height="9" rx="2.5" fill="#f59e0b" />
          <polygon points={`36,${ht - 9} 43,${ht - 29} 50,${ht - 9}`} fill="#f59e0b" />
          <polygon points={`54,${ht - 9} 60,${ht - 33} 66,${ht - 9}`} fill="#f59e0b" />
          <polygon points={`70,${ht - 9} 77,${ht - 29} 84,${ht - 9}`} fill="#f59e0b" />
          <circle cx="43" cy={ht - 25} r="3" fill="#fef08a" />
          <circle cx="60" cy={ht - 29} r="3" fill="#fef08a" />
          <circle cx="77" cy={ht - 25} r="3" fill="#fef08a" />
        </g>
      )}

      {/* ── HEAD: STYLE 0 — Classic ───────────────── */}
      {config.style === 0 && (
        <>
          <rect x="20" y="38" width="80" height="64" rx="10" fill={headFill} stroke={accent} strokeWidth="2" />
          <rect x="7"  y="52" width="14" height="25" rx="4" fill={headFill} stroke={accent} strokeWidth="1.5" />
          <rect x="99" y="52" width="14" height="25" rx="4" fill={headFill} stroke={accent} strokeWidth="1.5" />
          <rect x="44" y="87" width="32" height="5" rx="3" fill={accent} opacity="0.4" />
        </>
      )}

      {/* ── HEAD: STYLE 1 — Bubble ────────────────── */}
      {config.style === 1 && (
        <>
          <ellipse cx="60" cy="72" rx="40" ry="39" fill={headFill} stroke={accent} strokeWidth="2" />
          <circle cx="26" cy="82" r="9" fill={accent} opacity="0.1" />
          <circle cx="94" cy="82" r="9" fill={accent} opacity="0.1" />
          <path d="M 45 88 Q 60 100 75 88" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}

      {/* ── HEAD: STYLE 2 — Retro ─────────────────── */}
      {config.style === 2 && (
        <>
          <rect x="20" y="30" width="80" height="74" rx="4" fill={headFill} stroke={accent} strokeWidth="2" />
          <rect x="30" y="40" width="60" height="48" rx="3" fill="#FFFFFF" stroke={accent} strokeWidth="1" opacity="0.9" />
          {[38, 46, 54, 62, 70, 78, 86].map(x => (
            <circle key={x} cx={x} cy="79" r="1.5" fill={accent} opacity="0.4" />
          ))}
        </>
      )}

      {/* ── HEAD: STYLE 3 — Sleek ─────────────────── */}
      {config.style === 3 && (
        <>
          <ellipse cx="60" cy="70" rx="28" ry="42" fill={headFill} stroke={accent} strokeWidth="2" />
          <line x1="42" y1="100" x2="78" y2="100" stroke={accent} strokeWidth="1" opacity="0.2" />
        </>
      )}

      {/* ── GLOW HALO (behind eyes) ───────────────── */}
      {config.glowingEyes && config.style === 0 && (
        <><circle cx="47" cy="65" r="13" fill={eyeFill} opacity="0.18" /><circle cx="73" cy="65" r="13" fill={eyeFill} opacity="0.18" /></>
      )}
      {config.glowingEyes && config.style === 1 && (
        <><circle cx="46" cy="70" r="15" fill={eyeFill} opacity="0.15" /><circle cx="74" cy="70" r="15" fill={eyeFill} opacity="0.15" /></>
      )}
      {config.glowingEyes && config.style === 2 && (
        <><rect x="29" y="48" width="28" height="20" rx="5" fill={eyeFill} opacity="0.18" /><rect x="63" y="48" width="28" height="20" rx="5" fill={eyeFill} opacity="0.18" /></>
      )}
      {config.glowingEyes && config.style === 3 && (
        <><rect x="40" y="58" width="21" height="13" rx="5" fill={eyeFill} opacity="0.18" /><rect x="59" y="58" width="21" height="13" rx="5" fill={eyeFill} opacity="0.18" /></>
      )}

      {/* ── NORMAL EYES (idle / typing only) ──────── */}
      {showNormalEyes(expression) && config.style === 0 && (
        <>
          <circle cx="47" cy="65" r="7.5" fill={eyeFill} /><circle cx="47" cy="65" r="3.5" fill={pupilFill} />
          <circle cx="73" cy="65" r="7.5" fill={eyeFill} /><circle cx="73" cy="65" r="3.5" fill={pupilFill} />
        </>
      )}
      {showNormalEyes(expression) && config.style === 1 && (
        <>
          <circle cx="46" cy="70" r="9" fill={eyeFill} /><circle cx="46" cy="70" r="4" fill={pupilFill} />
          <circle cx="74" cy="70" r="9" fill={eyeFill} /><circle cx="74" cy="70" r="4" fill={pupilFill} />
          <circle cx="49" cy="67" r="2" fill="white" opacity="0.6" /><circle cx="77" cy="67" r="2" fill="white" opacity="0.6" />
        </>
      )}
      {showNormalEyes(expression) && config.style === 2 && (
        <>
          <rect x="33" y="52" width="22" height="14" rx="2" fill={eyeFill} />
          <rect x="65" y="52" width="22" height="14" rx="2" fill={eyeFill} />
          <rect x="33" y="57" width="22" height="2.5" fill="white" opacity="0.3" />
          <rect x="65" y="57" width="22" height="2.5" fill="white" opacity="0.3" />
        </>
      )}
      {showNormalEyes(expression) && config.style === 3 && (
        <>
          <rect x="44" y="63" width="13" height="5" rx="2.5" fill={eyeFill} />
          <rect x="63" y="63" width="13" height="5" rx="2.5" fill={eyeFill} />
        </>
      )}

      {/* ── EXPRESSION EYES (non-idle states) ─────── */}
      {!showNormalEyes(expression) && (
        <ExpressionEyes expression={expression} style={config.style} eyeFill={eyeFill} />
      )}

      {/* ── NECK + BODY (hidden when headOnly) ────── */}
      {!headOnly && config.style === 0 && <rect x="52" y="104" width="16" height="14" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 1 && <rect x="54" y="113" width="12" height="11" rx="2" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 2 && <rect x="52" y="106" width="16" height="12" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 3 && <rect x="57" y="114" width="6"  height="8"  rx="2" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}

      {!headOnly && config.style === 0 && (
        <>
          <rect x="22" y="116" width="76" height="52" rx="8" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="60" cy="137" r="7"   fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="60" cy="137" r="3.5" fill={accent} />
          <rect x="30" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.3" />
          <rect x="53" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.3" />
          <rect x="76" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.3" />
        </>
      )}
      {!headOnly && config.style === 1 && (
        <>
          <rect x="17" y="122" width="86" height="48" rx="24" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="60" cy="147" r="8"   fill={bodyFill} stroke={accent} strokeWidth="1.5" />
          <circle cx="60" cy="147" r="4"   fill={accent} />
          <circle cx="40" cy="147" r="4"   fill={accent} opacity="0.2" />
          <circle cx="80" cy="147" r="4"   fill={accent} opacity="0.2" />
        </>
      )}
      {!headOnly && config.style === 2 && (
        <>
          <rect x="15" y="116" width="90" height="52" rx="4" fill={bodyFill} stroke={accent} strokeWidth="2" />
          {[0, 1, 2].map(row =>
            [0, 1, 2, 3].map(col => (
              <rect key={`k-${row}-${col}`}
                x={23 + col * 21} y={128 + row * 12} width="16" height="8" rx="2"
                fill={accent} opacity="0.15" />
            ))
          )}
        </>
      )}
      {!headOnly && config.style === 3 && (
        <>
          <rect x="32" y="120" width="56" height="48" rx="28" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <rect x="44" y="133" width="32" height="4" rx="2" fill={accent} opacity="0.35" />
          <circle cx="60" cy="151" r="5"   fill={bodyFill} stroke={accent} strokeWidth="1.5" />
          <circle cx="60" cy="151" r="2.5" fill={accent} />
        </>
      )}
    </svg>
  )
}
