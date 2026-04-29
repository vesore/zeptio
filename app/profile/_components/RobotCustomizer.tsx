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
  bodyUnlocked: boolean
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
  { key: 'antenna',     label: 'Antenna',   icon: '📡', hint: 'Complete Clarity level 3'  },
  { key: 'glowingEyes', label: 'Glow Eyes', icon: '✨', hint: '7-day streak'              },
  { key: 'goldBody',    label: 'Gold Body', icon: '⭐', hint: 'Score 80+ on any level'    },
  { key: 'crown',       label: 'Crown',     icon: '👑', hint: 'Complete all Clarity levels' },
]

export default function RobotCustomizer({ initialConfig, unlockedParts, bodyUnlocked }: RobotCustomizerProps) {
  const [config, setConfig]     = useState<RobotConfig>(initialConfig)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

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

  // ── Collapsed view — robot avatar + name + edit button ──────────────────
  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex flex-col items-center gap-3 rounded-3xl py-7 px-5 transition-all duration-200 group"
        style={{
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(74,144,226,0.12)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,144,226,0.35)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,144,226,0.12)' }}
        aria-label="Edit your robot"
      >
        {/* Robot head (or full if body unlocked) */}
        <div
          className="rounded-2xl p-4 transition-all duration-200 group-hover:scale-105"
          style={{ background: 'rgba(74,144,226,0.06)', border: '1px solid rgba(74,144,226,0.15)' }}
        >
          <RobotSVG config={config} size={100} headOnly={!bodyUnlocked} />
        </div>

        {/* Robot name */}
        <div className="text-center">
          <p className="text-base font-bold font-mono" style={{ color: '#4A90E2' }}>
            {config.name.trim() || <span style={{ color: '#999999' }}>Unnamed Robot</span>}
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: '#AAAAAA' }}>
            Tap to customize
          </p>
        </div>
      </button>
    )
  }

  // ── Expanded editor ──────────────────────────────────────────────────────
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-5"
      style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(74,144,226,0.2)' }}
    >
      {/* Preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(74,144,226,0.06)', border: '1px solid rgba(74,144,226,0.15)' }}
        >
          <RobotSVG config={config} size={120} headOnly={!bodyUnlocked} />
        </div>
        <p className="text-sm font-bold font-mono" style={{ color: '#4A90E2', minHeight: '1.25rem' }}>
          {config.name.trim() || <span style={{ color: '#AAAAAA' }}>Unnamed Robot</span>}
        </p>
      </div>

      {/* Name input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="robot-name-input"
          className="text-xs font-mono font-semibold uppercase tracking-widest"
          style={{ color: '#4A90E2' }}
        >
          Robot Name
        </label>
        <div className="relative">
          <input
            id="robot-name-input"
            type="text"
            value={config.name}
            onChange={e => { setConfig(prev => ({ ...prev, name: e.target.value.slice(0, 20) })); setSaved(false) }}
            placeholder="Give your robot a name…"
            maxLength={20}
            className="w-full rounded-2xl px-4 py-3 pr-14 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#4A90E2] placeholder:text-white/25"
            style={{ color: '#FFFFFF', background: '#FAFAFA', border: '1.5px solid rgba(0,0,0,0.08)' }}
            onFocus={e => { e.target.style.borderColor = '#00FF88' }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.08)' }}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums pointer-events-none"
            style={{ color: config.name.length >= 17 ? '#f87171' : 'rgba(255,255,255,0.25)' }}
          >
            {config.name.length}/20
          </span>
        </div>
      </div>

      {/* Style picker */}
      <div>
        <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A90E2' }}>
          Head Style
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
                  background: active ? 'rgba(74,144,226,0.1)' : 'rgba(0,0,0,0.03)',
                  border: `1.5px solid ${active ? '#00FF88' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <RobotSVG config={{ ...DEFAULT_ROBOT_CONFIG, style }} size={52} headOnly />
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{ color: active ? '#00FF88' : 'rgba(255,255,255,0.4)' }}
                >
                  {STYLE_NAMES[style]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Body unlock hint (shown when body not yet unlocked) */}
      {!bodyUnlocked && (
        <p className="text-xs font-mono text-center rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.03)', color: '#999999', border: '1px solid rgba(255,255,255,0.06)' }}>
          🔒 Complete your first Clarity level to unlock the body
        </p>
      )}

      {/* Parts (only shown when body is unlocked) */}
      {bodyUnlocked && (
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A90E2' }}>
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
                    background: equipped ? 'rgba(74,144,226,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${equipped ? 'rgba(74,144,226,0.4)' : 'rgba(0,0,0,0.06)'}`,
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
                      <p className="text-[10px] font-mono" style={{ color: equipped ? 'rgba(74,144,226,0.7)' : 'rgba(255,255,255,0.3)' }}>
                        {equipped ? 'Equipped' : 'Tap to equip'}
                      </p>
                    ) : (
                      <p className="text-[10px] font-mono truncate" style={{ color: '#999999' }}>
                        {hint}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-200 btn-primary"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save'}
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-5 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-200"
          style={{ border: '1.5px solid rgba(0,0,0,0.08)', color: '#888888' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
