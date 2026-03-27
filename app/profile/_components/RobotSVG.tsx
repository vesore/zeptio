export type RobotStyle = 0 | 1 | 2 | 3

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

// Y coord of top edge of head for each style (used to position antenna / crown)
const HEAD_TOP: Record<RobotStyle, number> = { 0: 38, 1: 33, 2: 30, 3: 28 }

export function RobotSVG({ config, size = 140, headOnly = false }: { config: RobotConfig; size?: number; headOnly?: boolean }) {
  const accent   = config.goldBody ? '#f59e0b' : '#B0E020'
  const headFill = '#2D3148'
  const bodyFill = config.goldBody ? '#78350f' : '#2D3148'
  const eyeFill  = '#B0E020'
  const ht       = HEAD_TOP[config.style]
  const height   = headOnly ? size : Math.round(size * 170 / 120)
  const viewBox  = headOnly ? '0 0 120 120' : '0 0 120 170'

  return (
    <svg viewBox={viewBox} width={size} height={height} aria-hidden="true">

      {/* ── ANTENNA ───────────────────────────────── */}
      {config.antenna && (
        <g>
          <line x1="38" y1={ht} x2="38" y2="11" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="38" cy="8" r="5.5" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="38" cy="8" r="2.5" fill={accent} />
        </g>
      )}

      {/* ── CROWN ─────────────────────────────────── */}
      {config.crown && (
        <g>
          <rect x="33" y={ht - 9} width="54" height="9" rx="2.5" fill="#f59e0b" />
          <polygon points={`36,${ht - 9} 43,${ht - 29} 50,${ht - 9}`} fill="#f59e0b" />
          <polygon points={`54,${ht - 9} 60,${ht - 33} 66,${ht - 9}`} fill="#f59e0b" />
          <polygon points={`70,${ht - 9} 77,${ht - 29} 84,${ht - 9}`} fill="#f59e0b" />
          <circle cx="43" cy={ht - 25} r="3"   fill="#fef08a" />
          <circle cx="60" cy={ht - 29} r="3"   fill="#fef08a" />
          <circle cx="77" cy={ht - 25} r="3"   fill="#fef08a" />
        </g>
      )}

      {/* ── HEAD: STYLE 0 — Classic ───────────────── */}
      {config.style === 0 && (
        <>
          <rect x="20" y="38" width="80" height="64" rx="10" fill={headFill} stroke={accent} strokeWidth="2" />
          {/* Ears */}
          <rect x="7"  y="52" width="14" height="25" rx="4" fill={headFill} stroke={accent} strokeWidth="1.5" />
          <rect x="99" y="52" width="14" height="25" rx="4" fill={headFill} stroke={accent} strokeWidth="1.5" />
          {/* Mouth bar */}
          <rect x="44" y="87" width="32" height="5" rx="3" fill={accent} opacity="0.5" />
        </>
      )}

      {/* ── HEAD: STYLE 1 — Bubble ────────────────── */}
      {config.style === 1 && (
        <>
          <ellipse cx="60" cy="72" rx="40" ry="39" fill={headFill} stroke={accent} strokeWidth="2" />
          {/* Blush */}
          <circle cx="26" cy="82" r="9" fill={accent} opacity="0.12" />
          <circle cx="94" cy="82" r="9" fill={accent} opacity="0.12" />
          {/* Smile */}
          <path d="M 45 88 Q 60 100 75 88" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        </>
      )}

      {/* ── HEAD: STYLE 2 — Retro ─────────────────── */}
      {config.style === 2 && (
        <>
          <rect x="20" y="30" width="80" height="74" rx="4" fill={headFill} stroke={accent} strokeWidth="2" />
          {/* Inner screen */}
          <rect x="30" y="40" width="60" height="48" rx="3" fill="#0d1020" stroke={accent} strokeWidth="1" opacity="0.9" />
          {/* Speaker dots */}
          {[38, 46, 54, 62, 70, 78, 86].map(x => (
            <circle key={x} cx={x} cy="79" r="1.5" fill={accent} opacity="0.45" />
          ))}
        </>
      )}

      {/* ── HEAD: STYLE 3 — Sleek ─────────────────── */}
      {config.style === 3 && (
        <>
          <ellipse cx="60" cy="70" rx="28" ry="42" fill={headFill} stroke={accent} strokeWidth="2" />
          {/* Chin divider */}
          <line x1="42" y1="100" x2="78" y2="100" stroke={accent} strokeWidth="1" opacity="0.25" />
        </>
      )}

      {/* ── GLOW HALO (behind eyes) ───────────────── */}
      {config.glowingEyes && config.style === 0 && (
        <>
          <circle cx="47" cy="65" r="13" fill="#B0E020" opacity="0.2" />
          <circle cx="73" cy="65" r="13" fill="#B0E020" opacity="0.2" />
        </>
      )}
      {config.glowingEyes && config.style === 1 && (
        <>
          <circle cx="46" cy="70" r="15" fill="#B0E020" opacity="0.18" />
          <circle cx="74" cy="70" r="15" fill="#B0E020" opacity="0.18" />
        </>
      )}
      {config.glowingEyes && config.style === 2 && (
        <>
          <rect x="29" y="48" width="28" height="20" rx="5" fill="#B0E020" opacity="0.22" />
          <rect x="63" y="48" width="28" height="20" rx="5" fill="#B0E020" opacity="0.22" />
        </>
      )}
      {config.glowingEyes && config.style === 3 && (
        <>
          <rect x="40" y="58" width="21" height="13" rx="5" fill="#B0E020" opacity="0.22" />
          <rect x="59" y="58" width="21" height="13" rx="5" fill="#B0E020" opacity="0.22" />
        </>
      )}

      {/* ── EYES: STYLE 0 ─────────────────────────── */}
      {config.style === 0 && (
        <>
          <circle cx="47" cy="65" r="7.5" fill={eyeFill} />
          <circle cx="47" cy="65" r="3.5" fill="#1A1D2B" />
          <circle cx="73" cy="65" r="7.5" fill={eyeFill} />
          <circle cx="73" cy="65" r="3.5" fill="#1A1D2B" />
        </>
      )}

      {/* ── EYES: STYLE 1 ─────────────────────────── */}
      {config.style === 1 && (
        <>
          <circle cx="46" cy="70" r="9"   fill={eyeFill} />
          <circle cx="46" cy="70" r="4"   fill="#1A1D2B" />
          <circle cx="74" cy="70" r="9"   fill={eyeFill} />
          <circle cx="74" cy="70" r="4"   fill="#1A1D2B" />
          {/* Shine dots */}
          <circle cx="49" cy="67" r="2"   fill="white" opacity="0.5" />
          <circle cx="77" cy="67" r="2"   fill="white" opacity="0.5" />
        </>
      )}

      {/* ── EYES: STYLE 2 (LCD) ───────────────────── */}
      {config.style === 2 && (
        <>
          <rect x="33" y="52" width="22" height="14" rx="2" fill={eyeFill} />
          <rect x="65" y="52" width="22" height="14" rx="2" fill={eyeFill} />
          {/* Scan line */}
          <rect x="33" y="57" width="22" height="2.5" fill="#1A1D2B" opacity="0.35" />
          <rect x="65" y="57" width="22" height="2.5" fill="#1A1D2B" opacity="0.35" />
        </>
      )}

      {/* ── EYES: STYLE 3 (slits) ─────────────────── */}
      {config.style === 3 && (
        <>
          <rect x="44" y="63" width="13" height="5" rx="2.5" fill={eyeFill} />
          <rect x="63" y="63" width="13" height="5" rx="2.5" fill={eyeFill} />
        </>
      )}

      {/* ── NECK + BODY (hidden when headOnly) ────── */}
      {!headOnly && config.style === 0 && <rect x="52" y="104" width="16" height="14" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 1 && <rect x="54" y="113" width="12" height="11" rx="2" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 2 && <rect x="52" y="106" width="16" height="12" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}
      {!headOnly && config.style === 3 && <rect x="57" y="114" width="6"  height="8"  rx="2" fill={bodyFill} stroke={accent} strokeWidth="1.5" />}

      {/* ── BODY: STYLE 0 ─────────────────────────── */}
      {!headOnly && config.style === 0 && (
        <>
          <rect x="22" y="116" width="76" height="52" rx="8" fill={bodyFill} stroke={accent} strokeWidth="2" />
          {/* Central LED */}
          <circle cx="60" cy="137" r="7"   fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="60" cy="137" r="3.5" fill={accent} />
          {/* Bottom vent bars */}
          <rect x="30" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.35" />
          <rect x="53" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.35" />
          <rect x="76" y="153" width="14" height="4" rx="2" fill={accent} opacity="0.35" />
        </>
      )}

      {/* ── BODY: STYLE 1 ─────────────────────────── */}
      {!headOnly && config.style === 1 && (
        <>
          <rect x="17" y="122" width="86" height="48" rx="24" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <circle cx="60" cy="147" r="8"   fill={bodyFill} stroke={accent} strokeWidth="1.5" />
          <circle cx="60" cy="147" r="4"   fill={accent} />
          <circle cx="40" cy="147" r="4"   fill={accent} opacity="0.25" />
          <circle cx="80" cy="147" r="4"   fill={accent} opacity="0.25" />
        </>
      )}

      {/* ── BODY: STYLE 2 ─────────────────────────── */}
      {!headOnly && config.style === 2 && (
        <>
          <rect x="15" y="116" width="90" height="52" rx="4" fill={bodyFill} stroke={accent} strokeWidth="2" />
          {/* Keyboard grid: 3 cols × 3 rows */}
          {[0, 1, 2].map(row =>
            [0, 1, 2, 3].map(col => (
              <rect
                key={`k-${row}-${col}`}
                x={23 + col * 21}
                y={128 + row * 12}
                width="16"
                height="8"
                rx="2"
                fill={accent}
                opacity="0.18"
              />
            ))
          )}
        </>
      )}

      {/* ── BODY: STYLE 3 ─────────────────────────── */}
      {!headOnly && config.style === 3 && (
        <>
          <rect x="32" y="120" width="56" height="48" rx="28" fill={bodyFill} stroke={accent} strokeWidth="2" />
          <rect x="44" y="133" width="32" height="4" rx="2" fill={accent} opacity="0.4" />
          <circle cx="60" cy="151" r="5"   fill={bodyFill} stroke={accent} strokeWidth="1.5" />
          <circle cx="60" cy="151" r="2.5" fill={accent} />
        </>
      )}
    </svg>
  )
}
