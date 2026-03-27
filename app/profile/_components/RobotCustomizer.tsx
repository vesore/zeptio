'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { RobotSVG, DEFAULT_ROBOT_CONFIG, type RobotConfig, type RobotStyle } from './RobotSVG'

interface UnlockedParts {
  antenna: boolean
  glowingEyes: boolean
  goldBody: boolean
  crown: boolean
}

interface RobotCustomizerProps {
  initialConfig: RobotConfig
  unlockedParts: UnlockedParts
}

const STYLE_NAMES: Record<RobotStyle, string> = {
  0: 'Classic',
  1: 'Bubble',
  2: 'Retro',
  3: 'Sleek',
}

const PARTS: Array<{
  key: keyof UnlockedParts
  label: string
  icon: string
  hint: string
}> = [
  { key: 'antenna',     label: 'Antenna',     icon: '📡', hint: 'Complete Clarity level 3' },
  { key: 'glowingEyes', label: 'Glow Eyes',   icon: '✨', hint: '7-day streak'             },
  { key: 'goldBody',    label: 'Gold Body',   icon: '⭐', hint: 'Score 80+ on any level'   },
  { key: 'crown',       label: 'Crown',       icon: '👑', hint: 'Complete all Clarity levels' },
]

export default function RobotCustomizer({ initialConfig, unlockedParts }: RobotCustomizerProps) {
  const [config, setConfig] = useState<RobotConfig>(initialConfig)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ robot_config: config }).eq('id', user.id)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  function setStyle(style: RobotStyle) {
    setConfig(prev => ({ ...prev, style }))
    setSaved(false)
  }

  function togglePart(key: keyof UnlockedParts) {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Robot preview */}
      <div className="flex justify-center">
        <div
          className="inline-flex items-center justify-center rounded-3xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(176,224,32,0.15)' }}
        >
          <RobotSVG config={config} size={140} />
        </div>
      </div>

      {/* Style picker */}
      <div>
        <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#B0E020' }}>
          Base Style
        </p>
        <div className="grid grid-cols-4 gap-2">
          {([0, 1, 2, 3] as RobotStyle[]).map(style => {
            const active = config.style === style
            return (
              <button
                key={style}
                onClick={() => setStyle(style)}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-2 px-1 transition-all duration-200"
                style={{
                  background: active ? 'rgba(176,224,32,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${active ? '#B0E020' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <RobotSVG config={{ ...DEFAULT_ROBOT_CONFIG, style }} size={52} />
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{ color: active ? '#B0E020' : 'rgba(255,255,255,0.4)' }}
                >
                  {STYLE_NAMES[style]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Parts */}
      <div>
        <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#B0E020' }}>
          Equip Parts
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PARTS.map(({ key, label, icon, hint }) => {
            const unlocked = unlockedParts[key]
            const equipped = config[key]
            return (
              <button
                key={key}
                onClick={() => unlocked && togglePart(key)}
                disabled={!unlocked}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 min-w-0"
                style={{
                  background: equipped ? 'rgba(176,224,32,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${equipped ? 'rgba(176,224,32,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: unlocked ? 1 : 0.45,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="text-xl shrink-0" role="img" aria-label={label}>
                  {unlocked ? icon : '🔒'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{label}</p>
                  {unlocked ? (
                    <p className="text-[10px] font-mono" style={{ color: equipped ? 'rgba(176,224,32,0.7)' : 'rgba(255,255,255,0.3)' }}>
                      {equipped ? 'Equipped' : 'Tap to equip'}
                    </p>
                  ) : (
                    <p className="text-[10px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {hint}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-200 btn-primary"
      >
        {saving ? 'Saving…' : saved ? '✓ Robot saved!' : 'Save Robot'}
      </button>

    </div>
  )
}
