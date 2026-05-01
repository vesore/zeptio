import React from 'react'

export type WorldName = 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'
export type PartBodySlot = 'brain' | 'gears' | 'arms' | 'eyes' | 'core'
export type PartTier = 'basic' | 'enhanced' | 'premium' | 'perfect' | 'accessory'
export type UnlockType = 'auto_level' | 'auto_score100' | 'buy'

export interface PartDef {
  id: string
  name: string
  world: WorldName
  slot: PartBodySlot
  tier: PartTier
  unlockType: UnlockType
  unlockLevel?: number
  cost?: number
  description: string
  Icon: React.FC<{ color: string; size?: number }>
}

export const WORLD_ACCENT: Record<WorldName, string> = {
  clarity: '#4A90E2',
  constraints: '#F5A623',
  structure: '#4AE27A',
  debug: '#E24A4A',
  mastery: '#9B4AE2',
}

export const WORLD_SLOT: Record<WorldName, PartBodySlot> = {
  clarity: 'brain',
  constraints: 'gears',
  structure: 'arms',
  debug: 'eyes',
  mastery: 'core',
}

// ── Brain Icons (Clarity) ────────────────────────────────────────────────────

const BasicBrain: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M20 8 C13 8 8 13 8 20 C8 26 11 30 15 32 L15 35 L25 35 L25 32 C29 30 32 26 32 20 C32 13 27 8 20 8 Z"
      fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <line x1="20" y1="8" x2="20" y2="35" stroke={color} strokeWidth="1.5" opacity="0.4"/>
    <path d="M10 18 Q14 16 18 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
    <path d="M22 18 Q26 16 30 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

const EnhancedBrain: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M20 8 C13 8 8 13 8 20 C8 26 11 30 15 32 L15 35 L25 35 L25 32 C29 30 32 26 32 20 C32 13 27 8 20 8 Z"
      fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <line x1="20" y1="8" x2="20" y2="35" stroke={color} strokeWidth="1.5" opacity="0.35"/>
    {[14, 19, 24].map(y => (
      <React.Fragment key={y}>
        <line x1="9" y1={y} x2="18" y2={y} stroke={color} strokeWidth="1" opacity="0.5"/>
        <line x1="22" y1={y} x2="31" y2={y} stroke={color} strokeWidth="1" opacity="0.5"/>
      </React.Fragment>
    ))}
    <circle cx="20" cy="21" r="3" fill={color} opacity="0.25"/>
  </svg>
)

const PremiumBrain: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M20 8 C13 8 8 13 8 20 C8 26 11 30 15 32 L15 35 L25 35 L25 32 C29 30 32 26 32 20 C32 13 27 8 20 8 Z"
      fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <line x1="20" y1="8" x2="20" y2="35" stroke={color} strokeWidth="1.5" opacity="0.4"/>
    <path d="M10 18 Q14 16 18 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M22 18 Q26 16 30 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {[[9,10],[31,10],[9,30],[31,30]].map(([x,y],i) => (
      <path key={i} d={`M${x-2} ${y} L${x} ${y-2} L${x+2} ${y} L${x} ${y+2} Z`} fill={color}/>
    ))}
  </svg>
)

const PerfectBrain: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M20 8 C13 8 8 13 8 20 C8 26 11 30 15 32 L15 35 L25 35 L25 32 C29 30 32 26 32 20 C32 13 27 8 20 8 Z"
      fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
    <line x1="20" y1="8" x2="20" y2="35" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5"/>
    <path d="M10 18 Q14 16 18 18" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M22 18 Q26 16 30 18" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="20" cy="21" r="3.5" fill="#f59e0b" opacity="0.7"/>
    {[[6,6],[34,6],[6,34],[34,34],[20,4]].map(([x,y],i) => (
      <path key={i} d={`M${x-2} ${y} L${x} ${y-2.5} L${x+2} ${y} L${x} ${y+2.5} Z`} fill="#fcd34d"/>
    ))}
  </svg>
)

// Brain accessories
const ThoughtBubble: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="20" cy="18" rx="12" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="14" cy="30" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <circle cx="11" cy="36" r="2" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
)

const BrainAntenna: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <line x1="20" y1="28" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="6" r="4" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="20" cy="6" r="2" fill={color}/>
    <ellipse cx="20" cy="32" rx="9" ry="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5"/>
  </svg>
)

const NeuralGlow: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="20" cy="20" r="14" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeDasharray="3 2"/>
    <circle cx="20" cy="20" r="9" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5"/>
    <circle cx="20" cy="20" r="4" fill={color} opacity="0.5"/>
  </svg>
)

const LightningBolt: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M23 6 L12 21 L20 21 L17 34 L28 19 L20 19 Z" fill={color} opacity="0.8"/>
  </svg>
)

const BrainCrown: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="10" y="24" width="20" height="7" rx="2" fill="#f59e0b"/>
    <polygon points="10,24 14,12 19,20 24,8 29,20 34,12 30,24" fill="#f59e0b"/>
    <circle cx="14" cy="13" r="2" fill="#fef08a"/>
    <circle cx="24" cy="9" r="2" fill="#fef08a"/>
    <circle cx="30" cy="13" r="2" fill="#fef08a"/>
  </svg>
)

// ── Gear Icons (Constraints) ─────────────────────────────────────────────────

function gearPath(cx: number, cy: number, r: number, teeth: number, toothH: number): string {
  const pts: string[] = []
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 0.35) / teeth) * 2 * Math.PI - Math.PI / 2
    const a2 = ((i + 0.65) / teeth) * 2 * Math.PI - Math.PI / 2
    const a3 = ((i + 1) / teeth) * 2 * Math.PI - Math.PI / 2
    const ri = r; const ro = r + toothH
    pts.push(`${i === 0 ? 'M' : 'L'}${cx + ri * Math.cos(a0)} ${cy + ri * Math.sin(a0)}`)
    pts.push(`L${cx + ro * Math.cos(a1)} ${cy + ro * Math.sin(a1)}`)
    pts.push(`L${cx + ro * Math.cos(a2)} ${cy + ro * Math.sin(a2)}`)
    pts.push(`L${cx + ri * Math.cos(a3)} ${cy + ri * Math.sin(a3)}`)
  }
  return pts.join(' ') + ' Z'
}

const BasicGears: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 20, 10, 8, 3)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="4" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
)

const EnhancedGears: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(14, 22, 8, 7, 2.5)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="14" cy="22" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <path d={gearPath(26, 16, 7, 6, 2)} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="26" cy="16" r="2.5" fill={color} opacity="0.4"/>
  </svg>
)

const PremiumGears: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 21, 10, 8, 3)} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="20" cy="21" r="4" fill={color} opacity="0.4"/>
    <path d={gearPath(7, 12, 5, 6, 1.5)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d={gearPath(33, 12, 5, 6, 1.5)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

const PerfectGears: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 21, 10, 10, 3)} fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
    <circle cx="20" cy="21" r="4" fill="#f59e0b" opacity="0.6"/>
    {[[10,10],[30,10],[10,32],[30,32]].map(([x,y],i) => (
      <path key={i} d={`M${x-2} ${y} L${x} ${y-3} L${x+2} ${y} L${x} ${y+3} Z`} fill="#fcd34d"/>
    ))}
  </svg>
)

const SteamEffect: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M12 28 Q10 22 12 18 Q14 14 12 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
    <path d="M20 28 Q18 22 20 18 Q22 14 20 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M28 28 Q26 22 28 18 Q30 14 28 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
  </svg>
)

const GearColors: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 20, 9, 8, 2.5)} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3.5" fill={color} opacity="0.5"/>
    <circle cx="20" cy="20" r="7" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
  </svg>
)

const OilDrip: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 16, 8, 7, 2)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="20" cy="16" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <path d="M18 26 Q20 22 22 26 Q22 32 20 34 Q18 32 18 26 Z" fill={color} opacity="0.7"/>
  </svg>
)

const TurboBoost: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 20, 8, 8, 2.5)} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    {[[-12, 2], [-10, -3], [-8, -8]].map(([dx, dy], i) => (
      <line key={i} x1={8 + dx} y1={20 + dy} x2={14 + dx} y2={20 + dy}
        stroke={color} strokeWidth={2 - i * 0.4} strokeLinecap="round" opacity={0.9 - i * 0.2}/>
    ))}
  </svg>
)

const DiamondGears: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={gearPath(20, 22, 10, 10, 3)} fill="#e0f2fe" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.8"/>
    <circle cx="20" cy="22" r="4" fill={color} opacity="0.4"/>
    <path d="M20 4 L23 9 L20 14 L17 9 Z" fill={color} opacity="0.8"/>
    <path d="M20 6 L23 9 L20 12 L17 9 Z" fill="white" opacity="0.3"/>
  </svg>
)

// ── Arm Icons (Structure) ────────────────────────────────────────────────────

const BasicArms: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="6" y="12" width="9" height="24" rx="4" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="25" y="12" width="9" height="24" rx="4" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="3" y="30" width="12" height="6" rx="3" fill="none" stroke={color} strokeWidth="1.5"/>
    <rect x="25" y="30" width="12" height="6" rx="3" fill="none" stroke={color} strokeWidth="1.5"/>
  </svg>
)

const EnhancedArms: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="6" y="12" width="9" height="22" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="25" y="12" width="9" height="22" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="6" y1="22" x2="15" y2="22" stroke={color} strokeWidth="1.5" opacity="0.5"/>
    <line x1="25" y1="22" x2="34" y2="22" stroke={color} strokeWidth="1.5" opacity="0.5"/>
    {/* Wrench on right arm */}
    <circle cx="29.5" cy="36" r="3.5" fill="none" stroke={color} strokeWidth="1.5"/>
    <line x1="32" y1="33" x2="36" y2="29" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const PremiumArms: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="6" y="10" width="10" height="26" rx="4" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
    <rect x="24" y="10" width="10" height="26" rx="4" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
    <rect x="6" y="18" width="10" height="3" rx="1.5" fill={color} opacity="0.3"/>
    <rect x="24" y="18" width="10" height="3" rx="1.5" fill={color} opacity="0.3"/>
    <rect x="4" y="32" width="12" height="5" rx="2.5" fill={color} opacity="0.5"/>
    <rect x="24" y="32" width="12" height="5" rx="2.5" fill={color} opacity="0.5"/>
  </svg>
)

const PerfectArms: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="6" y="10" width="10" height="26" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2.5"/>
    <rect x="24" y="10" width="10" height="26" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2.5"/>
    <rect x="6" y="18" width="10" height="3" rx="1.5" fill="#fcd34d" opacity="0.7"/>
    <rect x="24" y="18" width="10" height="3" rx="1.5" fill="#fcd34d" opacity="0.7"/>
    {[[4,8],[36,8],[4,38],[36,38]].map(([x,y],i) => (
      <path key={i} d={`M${x-2} ${y} L${x} ${y-2.5} L${x+2} ${y} L${x} ${y+2.5} Z`} fill="#fcd34d"/>
    ))}
  </svg>
)

const ToolAttachment: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="13" cy="25" r="5" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="13" y1="20" x2="13" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="9" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="22" y="16" width="6" height="18" rx="2" fill="none" stroke={color} strokeWidth="2"/>
    <line x1="24" y1="20" x2="26" y2="20" stroke={color} strokeWidth="1.5" opacity="0.5"/>
    <line x1="24" y1="24" x2="26" y2="24" stroke={color} strokeWidth="1.5" opacity="0.5"/>
  </svg>
)

const GripUpgrade: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="8" y="12" width="10" height="20" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="22" y="12" width="10" height="20" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    {[16, 20, 24].map(y => (
      <React.Fragment key={y}>
        <line x1="8" y1={y} x2="18" y2={y} stroke={color} strokeWidth="1" opacity="0.4"/>
        <line x1="22" y1={y} x2="32" y2={y} stroke={color} strokeWidth="1" opacity="0.4"/>
      </React.Fragment>
    ))}
    <rect x="5" y="30" width="13" height="5" rx="2.5" fill={color} opacity="0.35"/>
    <rect x="22" y="30" width="13" height="5" rx="2.5" fill={color} opacity="0.35"/>
  </svg>
)

const ArmColors: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="7" y="11" width="10" height="23" rx="4" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2"/>
    <rect x="23" y="11" width="10" height="23" rx="4" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="22" r="3" fill={color} opacity="0.5"/>
    <circle cx="28" cy="22" r="3" fill={color} opacity="0.5"/>
  </svg>
)

const RocketArms: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="7" y="11" width="9" height="20" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="24" y="11" width="9" height="20" rx="3" fill="none" stroke={color} strokeWidth="2"/>
    {/* Mini rockets */}
    <ellipse cx="11.5" cy="36" rx="3.5" ry="5" fill={color} opacity="0.6"/>
    <path d="M8 33 L11.5 27 L15 33" fill={color} opacity="0.8"/>
    <ellipse cx="28.5" cy="36" rx="3.5" ry="5" fill={color} opacity="0.6"/>
    <path d="M25 33 L28.5 27 L32 33" fill={color} opacity="0.8"/>
  </svg>
)

const TitaniumPlating: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="7" y="11" width="10" height="23" rx="3" fill="#e2e8f0" stroke={color} strokeWidth="2"/>
    <rect x="23" y="11" width="10" height="23" rx="3" fill="#e2e8f0" stroke={color} strokeWidth="2"/>
    <line x1="7" y1="19" x2="17" y2="19" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="7" y1="25" x2="17" y2="25" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="23" y1="19" x2="33" y2="19" stroke={color} strokeWidth="1" opacity="0.6"/>
    <line x1="23" y1="25" x2="33" y2="25" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
)

// ── Eye Icons (Debug) ────────────────────────────────────────────────────────

const BasicEyes: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="13" cy="20" rx="7" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="13" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="13" cy="20" r="2" fill="white"/>
    <ellipse cx="27" cy="20" rx="7" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="27" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="27" cy="20" r="2" fill="white"/>
  </svg>
)

const EnhancedEyes: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="13" cy="20" rx="7" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="13" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="13" cy="20" r="2" fill="white"/>
    {[14, 18, 22, 26].map(y => (
      <line key={y} x1="6" y1={y} x2="20" y2={y} stroke={color} strokeWidth="0.8" opacity="0.35"/>
    ))}
    <ellipse cx="27" cy="20" rx="7" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="27" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="27" cy="20" r="2" fill="white"/>
    {[14, 18, 22, 26].map(y => (
      <line key={y} x1="20" y1={y} x2="34" y2={y} stroke={color} strokeWidth="0.8" opacity="0.35"/>
    ))}
  </svg>
)

const PremiumEyes: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="13" cy="20" rx="7" ry="10" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
    <circle cx="13" cy="20" r="4.5" fill={color} opacity="0.8"/>
    <circle cx="13" cy="20" r="2" fill="white"/>
    <line x1="13" y1="8" x2="13" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="30" x2="13" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="27" cy="20" rx="7" ry="10" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
    <circle cx="27" cy="20" r="4.5" fill={color} opacity="0.8"/>
    <circle cx="27" cy="20" r="2" fill="white"/>
    <line x1="27" y1="8" x2="27" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="30" x2="27" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const PerfectEyes: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="13" cy="20" rx="7" ry="10" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2.5"/>
    <circle cx="13" cy="20" r="4.5" fill="#f59e0b" opacity="0.8"/>
    <circle cx="13" cy="20" r="2" fill="white"/>
    {[[-6,0],[6,0],[0,-9],[0,9],[-4,-6],[4,-6],[-4,6],[4,6]].map(([dx,dy],i) => (
      <line key={i} x1={13+dx*0.5} y1={20+dy*0.5} x2={13+dx} y2={20+dy} stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
    <ellipse cx="27" cy="20" rx="7" ry="10" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2.5"/>
    <circle cx="27" cy="20" r="4.5" fill="#f59e0b" opacity="0.8"/>
    <circle cx="27" cy="20" r="2" fill="white"/>
    {[[-6,0],[6,0],[0,-9],[0,9],[-4,-6],[4,-6],[-4,6],[4,6]].map(([dx,dy],i) => (
      <line key={i} x1={27+dx*0.5} y1={20+dy*0.5} x2={27+dx} y2={20+dy} stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round"/>
    ))}
  </svg>
)

const ScanEffect: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="20" cy="20" rx="14" ry="10" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="20" cy="20" r="5" fill={color} opacity="0.6"/>
    <line x1="6" y1="20" x2="34" y2="20" stroke={color} strokeWidth="1.5" opacity="0.5"/>
    {[13, 16, 19, 22, 25, 28].map(x => (
      <line key={x} x1={x} y1="12" x2={x} y2="28" stroke={color} strokeWidth="0.7" opacity="0.25"/>
    ))}
  </svg>
)

const LensStyle: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <rect x="6" y="12" width="13" height="16" rx="6" fill="none" stroke={color} strokeWidth="2"/>
    <rect x="21" y="12" width="13" height="16" rx="6" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="12.5" cy="20" r="4" fill={color} opacity="0.5"/>
    <circle cx="27.5" cy="20" r="4" fill={color} opacity="0.5"/>
    <line x1="19" y1="20" x2="21" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const EyeColors: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="13" cy="20" r="8" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
    <circle cx="13" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="13" cy="20" r="2" fill="white"/>
    <circle cx="27" cy="20" r="8" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
    <circle cx="27" cy="20" r="4" fill={color} opacity="0.7"/>
    <circle cx="27" cy="20" r="2" fill="white"/>
  </svg>
)

const LaserBeams: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="13" cy="18" r="5" fill={color} opacity="0.7"/>
    <circle cx="13" cy="18" r="2" fill="white"/>
    <line x1="18" y1="18" x2="36" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    <circle cx="27" cy="18" r="5" fill={color} opacity="0.7"/>
    <circle cx="27" cy="18" r="2" fill="white"/>
    <line x1="32" y1="18" x2="38" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
  </svg>
)

const XRayVision: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <ellipse cx="20" cy="20" rx="14" ry="12" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="2"/>
    <ellipse cx="20" cy="20" rx="9" ry="8" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeDasharray="3 2"/>
    <circle cx="20" cy="20" r="4" fill={color} opacity="0.6"/>
    <circle cx="20" cy="20" r="2" fill="white"/>
    {[45, 90, 135, 0, 315, 270, 225, 180].map((deg, i) => {
      const rad = (deg * Math.PI) / 180
      return <line key={i} x1={20 + 9 * Math.cos(rad)} y1={20 + 9 * Math.sin(rad)}
        x2={20 + 14 * Math.cos(rad)} y2={20 + 14 * Math.sin(rad)}
        stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    })}
  </svg>
)

// ── Core/Heart Icons (Mastery) ───────────────────────────────────────────────

const heartPath = 'M20 32 C20 32 6 22 6 14 C6 9 10 6 14 6 C17 6 19 8 20 10 C21 8 23 6 26 6 C30 6 34 9 34 14 C34 22 20 32 20 32 Z'

const BasicCore: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

const EnhancedCore: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M20 30 C20 30 9 22 9 15 C9 11 12 9 15 9 C17 9 19 10.5 20 12 C21 10.5 23 9 25 9 C28 9 31 11 31 15 C31 22 20 30 20 30 Z"
      fill="none" stroke={color} strokeWidth="1" opacity="0.3" strokeLinejoin="round"/>
  </svg>
)

const PremiumCore: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="20" cy="20" r="12" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.5" strokeDasharray="4 2"/>
    <circle cx="20" cy="20" r="7" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
    <circle cx="20" cy="20" r="3" fill={color} opacity="0.7"/>
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const rad = (deg * Math.PI) / 180
      return <circle key={i} cx={20 + 10 * Math.cos(rad)} cy={20 + 10 * Math.sin(rad)}
        r="1.5" fill={color} opacity="0.4"/>
    })}
  </svg>
)

const PerfectCore: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill="url(#rainbow)" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E24A4A"/>
        <stop offset="33%" stopColor="#F5A623"/>
        <stop offset="66%" stopColor="#4AE27A"/>
        <stop offset="100%" stopColor="#9B4AE2"/>
      </linearGradient>
    </defs>
    {[[8,8],[32,8],[8,32],[32,32],[20,4]].map(([x,y],i) => (
      <path key={i} d={`M${x-2} ${y} L${x} ${y-2.5} L${x+2} ${y} L${x} ${y+2.5} Z`} fill="#fcd34d"/>
    ))}
  </svg>
)

const EnergyPulse: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="1" opacity="0.25"/>
    <circle cx="20" cy="20" r="11" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4"/>
    <circle cx="20" cy="20" r="6" fill="none" stroke={color} strokeWidth="2" opacity="0.7"/>
    <circle cx="20" cy="20" r="2.5" fill={color}/>
  </svg>
)

const HeartColors: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="20" cy="18" r="4" fill={color} opacity="0.5"/>
  </svg>
)

const AuraEffect: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    {[5, 10].map((expand, i) => (
      <ellipse key={i} cx="20" cy="19" rx={14 + expand} ry={12 + expand}
        fill="none" stroke={color} strokeWidth="1" opacity={0.3 - i * 0.1} strokeDasharray="3 3"/>
    ))}
  </svg>
)

const PowerSurge: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d={heartPath} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M22 8 L14 20 L20 20 L18 32 L26 18 L20 18 Z" fill={color} opacity="0.7"/>
  </svg>
)

const InfinityCore: React.FC<{ color: string; size?: number }> = ({ color, size = 40 }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
    <path d="M8 20 C8 14 13 10 18 14 C21 16 19 24 22 26 C27 30 32 26 32 20 C32 14 27 10 22 14 C19 16 21 24 18 26 C13 30 8 26 8 20 Z"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="2" fill={color} opacity="0.6"/>
  </svg>
)

// ── Parts Catalog ────────────────────────────────────────────────────────────

export const ALL_PARTS: PartDef[] = [
  // ── CLARITY (Brain) ──────────────────────────────────────────
  { id: 'clarity_brain_basic',       name: 'Basic Brain',     world: 'clarity',     slot: 'brain', tier: 'basic',
    unlockType: 'auto_level', unlockLevel: 3,
    description: 'Complete Level 3 Clarity', Icon: BasicBrain },
  { id: 'clarity_brain_enhanced',    name: 'Enhanced Brain',  world: 'clarity',     slot: 'brain', tier: 'enhanced',
    unlockType: 'auto_level', unlockLevel: 6,
    description: 'Complete Level 6 Clarity', Icon: EnhancedBrain },
  { id: 'clarity_brain_premium',     name: 'Premium Brain',   world: 'clarity',     slot: 'brain', tier: 'premium',
    unlockType: 'auto_level', unlockLevel: 10,
    description: 'Complete Level 10 Clarity', Icon: PremiumBrain },
  { id: 'clarity_brain_perfect',     name: 'Perfect Brain',   world: 'clarity',     slot: 'brain', tier: 'perfect',
    unlockType: 'auto_score100',
    description: 'Score 100 on any Clarity level', Icon: PerfectBrain },
  { id: 'clarity_thought_bubble',    name: 'Thought Bubble',  world: 'clarity',     slot: 'brain', tier: 'accessory',
    unlockType: 'buy', cost: 50,
    description: 'Floating thought bubble', Icon: ThoughtBubble },
  { id: 'clarity_antenna',           name: 'Antenna',         world: 'clarity',     slot: 'brain', tier: 'accessory',
    unlockType: 'buy', cost: 100,
    description: 'Classic robot antenna', Icon: BrainAntenna },
  { id: 'clarity_neural_glow',       name: 'Neural Glow',     world: 'clarity',     slot: 'brain', tier: 'accessory',
    unlockType: 'buy', cost: 200,
    description: 'Blue glow effect', Icon: NeuralGlow },
  { id: 'clarity_lightning',         name: 'Lightning Bolt',  world: 'clarity',     slot: 'brain', tier: 'accessory',
    unlockType: 'buy', cost: 300,
    description: 'Electric spark effect', Icon: LightningBolt },
  { id: 'clarity_crown',             name: 'Crown',           world: 'clarity',     slot: 'brain', tier: 'accessory',
    unlockType: 'buy', cost: 500,
    description: 'Gold crown on top', Icon: BrainCrown },

  // ── CONSTRAINTS (Gears) ───────────────────────────────────────
  { id: 'constraints_gears_basic',   name: 'Basic Gears',     world: 'constraints', slot: 'gears', tier: 'basic',
    unlockType: 'auto_level', unlockLevel: 3,
    description: 'Complete Level 3 Constraints', Icon: BasicGears },
  { id: 'constraints_gears_enhanced', name: 'Enhanced Gears', world: 'constraints', slot: 'gears', tier: 'enhanced',
    unlockType: 'auto_level', unlockLevel: 6,
    description: 'Complete Level 6 Constraints', Icon: EnhancedGears },
  { id: 'constraints_gears_premium', name: 'Premium Gears',   world: 'constraints', slot: 'gears', tier: 'premium',
    unlockType: 'auto_level', unlockLevel: 10,
    description: 'Complete Level 10 Constraints', Icon: PremiumGears },
  { id: 'constraints_gears_perfect', name: 'Perfect Gears',   world: 'constraints', slot: 'gears', tier: 'perfect',
    unlockType: 'auto_score100',
    description: 'Score 100 on any Constraints level', Icon: PerfectGears },
  { id: 'constraints_steam',         name: 'Steam Effect',    world: 'constraints', slot: 'gears', tier: 'accessory',
    unlockType: 'buy', cost: 50,
    description: 'Steam puffs from gears', Icon: SteamEffect },
  { id: 'constraints_gear_colors',   name: 'Gear Colors',     world: 'constraints', slot: 'gears', tier: 'accessory',
    unlockType: 'buy', cost: 100,
    description: 'Colorful gear set', Icon: GearColors },
  { id: 'constraints_oil_drip',      name: 'Oil Drip',        world: 'constraints', slot: 'gears', tier: 'accessory',
    unlockType: 'buy', cost: 200,
    description: 'Cartoon oil drops', Icon: OilDrip },
  { id: 'constraints_turbo',         name: 'Turbo Boost',     world: 'constraints', slot: 'gears', tier: 'accessory',
    unlockType: 'buy', cost: 300,
    description: 'Speed lines effect', Icon: TurboBoost },
  { id: 'constraints_diamond_gears', name: 'Diamond Gears',   world: 'constraints', slot: 'gears', tier: 'accessory',
    unlockType: 'buy', cost: 500,
    description: 'Sparkle diamond effect', Icon: DiamondGears },

  // ── STRUCTURE (Arms) ──────────────────────────────────────────
  { id: 'structure_arms_basic',      name: 'Basic Arms',      world: 'structure',   slot: 'arms', tier: 'basic',
    unlockType: 'auto_level', unlockLevel: 3,
    description: 'Complete Level 3 Structure', Icon: BasicArms },
  { id: 'structure_arms_enhanced',   name: 'Enhanced Arms',   world: 'structure',   slot: 'arms', tier: 'enhanced',
    unlockType: 'auto_level', unlockLevel: 6,
    description: 'Complete Level 6 Structure', Icon: EnhancedArms },
  { id: 'structure_arms_premium',    name: 'Premium Arms',    world: 'structure',   slot: 'arms', tier: 'premium',
    unlockType: 'auto_level', unlockLevel: 10,
    description: 'Complete Level 10 Structure', Icon: PremiumArms },
  { id: 'structure_arms_perfect',    name: 'Perfect Arms',    world: 'structure',   slot: 'arms', tier: 'perfect',
    unlockType: 'auto_score100',
    description: 'Score 100 on any Structure level', Icon: PerfectArms },
  { id: 'structure_tool',            name: 'Tool Attachment', world: 'structure',   slot: 'arms', tier: 'accessory',
    unlockType: 'buy', cost: 50,
    description: 'Wrench attachment', Icon: ToolAttachment },
  { id: 'structure_grip',            name: 'Grip Upgrade',    world: 'structure',   slot: 'arms', tier: 'accessory',
    unlockType: 'buy', cost: 100,
    description: 'Enhanced grip pads', Icon: GripUpgrade },
  { id: 'structure_arm_colors',      name: 'Arm Colors',      world: 'structure',   slot: 'arms', tier: 'accessory',
    unlockType: 'buy', cost: 200,
    description: 'Custom color arms', Icon: ArmColors },
  { id: 'structure_rockets',         name: 'Rocket Arms',     world: 'structure',   slot: 'arms', tier: 'accessory',
    unlockType: 'buy', cost: 300,
    description: 'Small rockets on arms', Icon: RocketArms },
  { id: 'structure_titanium',        name: 'Titanium Plating', world: 'structure',  slot: 'arms', tier: 'accessory',
    unlockType: 'buy', cost: 500,
    description: 'Metallic shine effect', Icon: TitaniumPlating },

  // ── DEBUG (Eyes) ──────────────────────────────────────────────
  { id: 'debug_eyes_basic',          name: 'Basic Eyes',      world: 'debug',       slot: 'eyes', tier: 'basic',
    unlockType: 'auto_level', unlockLevel: 3,
    description: 'Complete Level 3 Debug', Icon: BasicEyes },
  { id: 'debug_eyes_enhanced',       name: 'Enhanced Eyes',   world: 'debug',       slot: 'eyes', tier: 'enhanced',
    unlockType: 'auto_level', unlockLevel: 6,
    description: 'Complete Level 6 Debug', Icon: EnhancedEyes },
  { id: 'debug_eyes_premium',        name: 'Premium Eyes',    world: 'debug',       slot: 'eyes', tier: 'premium',
    unlockType: 'auto_level', unlockLevel: 10,
    description: 'Complete Level 10 Debug', Icon: PremiumEyes },
  { id: 'debug_eyes_perfect',        name: 'Perfect Eyes',    world: 'debug',       slot: 'eyes', tier: 'perfect',
    unlockType: 'auto_score100',
    description: 'Score 100 on any Debug level', Icon: PerfectEyes },
  { id: 'debug_scan',                name: 'Scan Effect',     world: 'debug',       slot: 'eyes', tier: 'accessory',
    unlockType: 'buy', cost: 50,
    description: 'Scanning line animation', Icon: ScanEffect },
  { id: 'debug_lens',                name: 'Lens Style',      world: 'debug',       slot: 'eyes', tier: 'accessory',
    unlockType: 'buy', cost: 100,
    description: 'Different lens shapes', Icon: LensStyle },
  { id: 'debug_eye_colors',          name: 'Eye Colors',      world: 'debug',       slot: 'eyes', tier: 'accessory',
    unlockType: 'buy', cost: 200,
    description: 'Custom eye colors', Icon: EyeColors },
  { id: 'debug_laser',               name: 'Laser Beams',     world: 'debug',       slot: 'eyes', tier: 'accessory',
    unlockType: 'buy', cost: 300,
    description: 'Laser effect', Icon: LaserBeams },
  { id: 'debug_xray',                name: 'X-Ray Vision',    world: 'debug',       slot: 'eyes', tier: 'accessory',
    unlockType: 'buy', cost: 500,
    description: 'Special lens effect', Icon: XRayVision },

  // ── MASTERY (Core) ────────────────────────────────────────────
  { id: 'mastery_core_basic',        name: 'Basic Core',      world: 'mastery',     slot: 'core', tier: 'basic',
    unlockType: 'auto_level', unlockLevel: 3,
    description: 'Complete Level 3 Mastery', Icon: BasicCore },
  { id: 'mastery_core_enhanced',     name: 'Enhanced Core',   world: 'mastery',     slot: 'core', tier: 'enhanced',
    unlockType: 'auto_level', unlockLevel: 6,
    description: 'Complete Level 6 Mastery', Icon: EnhancedCore },
  { id: 'mastery_core_premium',      name: 'Premium Core',    world: 'mastery',     slot: 'core', tier: 'premium',
    unlockType: 'auto_level', unlockLevel: 10,
    description: 'Complete Level 10 Mastery', Icon: PremiumCore },
  { id: 'mastery_core_perfect',      name: 'Perfect Core',    world: 'mastery',     slot: 'core', tier: 'perfect',
    unlockType: 'auto_score100',
    description: 'Score 100 on any Mastery level', Icon: PerfectCore },
  { id: 'mastery_pulse',             name: 'Energy Pulse',    world: 'mastery',     slot: 'core', tier: 'accessory',
    unlockType: 'buy', cost: 50,
    description: 'Pulse wave effect', Icon: EnergyPulse },
  { id: 'mastery_heart_colors',      name: 'Heart Colors',    world: 'mastery',     slot: 'core', tier: 'accessory',
    unlockType: 'buy', cost: 100,
    description: 'Custom heart colors', Icon: HeartColors },
  { id: 'mastery_aura',              name: 'Aura Effect',     world: 'mastery',     slot: 'core', tier: 'accessory',
    unlockType: 'buy', cost: 200,
    description: 'Glowing aura', Icon: AuraEffect },
  { id: 'mastery_power_surge',       name: 'Power Surge',     world: 'mastery',     slot: 'core', tier: 'accessory',
    unlockType: 'buy', cost: 300,
    description: 'Electric surge effect', Icon: PowerSurge },
  { id: 'mastery_infinity',          name: 'Infinity Core',   world: 'mastery',     slot: 'core', tier: 'accessory',
    unlockType: 'buy', cost: 500,
    description: 'Infinite symbol effect', Icon: InfinityCore },
]

export const PARTS_BY_WORLD = Object.fromEntries(
  (['clarity', 'constraints', 'structure', 'debug', 'mastery'] as WorldName[]).map(world => [
    world,
    ALL_PARTS.filter(p => p.world === world),
  ])
) as Record<WorldName, PartDef[]>

export const PART_BY_ID = Object.fromEntries(ALL_PARTS.map(p => [p.id, p]))
