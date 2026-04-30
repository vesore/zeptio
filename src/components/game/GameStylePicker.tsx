'use client'

import { useState } from 'react'
import type { GameType } from '@/src/lib/gameRandomizer'

interface Props {
  world: string
  accent: string
  availableTypes: GameType[]
  initialPreferred: GameType | null
}

const GAME_LABELS: Partial<Record<GameType, { label: string; desc: string }>> = {
  WordBudget:      { label: 'Word Budget',     desc: 'Write within a word limit' },
  TheShrink:       { label: 'The Shrink',      desc: 'Compress a bloated prompt' },
  FillInTheBlank:  { label: 'Fill in Blank',   desc: 'Complete the missing part' },
  RewriteChallenge:{ label: 'Rewrite',         desc: 'Fix a flawed prompt' },
  AudienceSwap:    { label: 'Audience Swap',   desc: 'Target a specific reader' },
  SpeedRound:      { label: 'Speed Round',     desc: 'Fast-fire under pressure' },
  ToneTranslator:  { label: 'Tone Translator', desc: 'Match a voice or style' },
  PromptDetective: { label: 'Detective',       desc: 'Analyze and deduce' },
  FormatMaster:    { label: 'Format Master',   desc: 'Control output structure' },
  RoleAssignment:  { label: 'Role Play',       desc: 'Assign an AI persona' },
  HeadToHead:      { label: 'Head to Head',    desc: 'Pick the stronger prompt' },
  ChainPrompting:  { label: 'Chain Prompt',    desc: 'Build multi-step chains' },
  SpotTheFlaw:     { label: 'Spot the Flaw',   desc: 'Find what\'s broken' },
  Reorder:         { label: 'Reorder',         desc: 'Arrange fragments in order' },
  MultipleChoice:  { label: 'Multi-Choice',    desc: 'Pick the best prompt' },
}

export default function GameStylePicker({ world, accent, availableTypes, initialPreferred }: Props) {
  const [preferred, setPreferred] = useState<GameType | null>(initialPreferred)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function pick(type: GameType | null) {
    const next = type === preferred ? null : type
    setPreferred(next)
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/game-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ world, preferred: next }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      // Non-critical — preference just won't persist
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono tracking-widest uppercase" style={{ color: `${accent}99` }}>
          Game Style
        </p>
        {preferred && (
          <button
            onClick={() => pick(null)}
            className="text-[10px] font-mono transition-colors duration-200 hover:opacity-70"
            style={{ color: '#AAAAAA' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Clear →'}
          </button>
        )}
        {!preferred && (
          <span className="text-[10px] font-mono" style={{ color: '#CCCCCC' }}>Random each level</span>
        )}
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {availableTypes.map(type => {
          const meta = GAME_LABELS[type]
          const isActive = preferred === type
          return (
            <button
              key={type}
              onClick={() => pick(type)}
              className="shrink-0 rounded-xl px-3 py-2.5 text-left transition-all duration-150 active:scale-95"
              style={{
                background: isActive ? `${accent}12` : '#FFFFFF',
                border: `1.5px solid ${isActive ? accent : '#E8E8E8'}`,
                minWidth: 100,
                boxShadow: isActive ? `0 0 0 2px ${accent}20` : 'none',
              }}
            >
              <p
                className="text-xs font-black whitespace-nowrap"
                style={{ color: isActive ? accent : '#333333' }}
              >
                {meta?.label ?? type}
              </p>
              <p
                className="text-[10px] mt-0.5 leading-tight whitespace-nowrap"
                style={{ color: '#AAAAAA' }}
              >
                {meta?.desc ?? ''}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
