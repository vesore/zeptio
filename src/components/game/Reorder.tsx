'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import GameRobot, { type RobotExpression } from './GameRobot'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { levelCompleteSound, scoreRevealSound } from '@/src/lib/sounds'

interface LevelConfig {
  world: 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'
  level: number
  challenge: string
  criteria: string[]
  max_xp: number
}

interface ScoreResult { score: number; xp_earned: number; feedback: string }

interface Props {
  levelConfig: LevelConfig
  levelId: number
  nextLevelUrl?: string
  robotConfig?: RobotConfig
  fragments?: string[]
  keyRule?: string
}

const WORLD_ACCENT: Record<string, string> = {
  clarity:     '#4A90E2',
  constraints: '#F5A623',
  structure:   '#4AE27A',
  debug:       '#E24A4A',
  mastery:     '#9B4AE2',
}

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#4A90E2', '#E2A04A', '#4AE27A', '#E24A4A', '#9B4AE2', '#1A1A1A'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
}))

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getCongratulatoryMessage(score: number): string {
  if (score >= 90) return 'Perfect order!'
  if (score >= 75) return 'Great arrangement!'
  if (score >= 60) return 'Nice work!'
  if (score >= 40) return 'Getting there!'
  return 'Keep practicing!'
}

export default function Reorder({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
  fragments,
}: Props) {
  const accent = WORLD_ACCENT[levelConfig.world] ?? '#4A90E2'

  // Scramble on first render only
  const [items, setItems] = useState<string[]>(() =>
    fragments && fragments.length > 0 ? shuffle(fragments) : [],
  )

  const [result, setResult] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Drag state
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const robotExpression = (): RobotExpression => {
    if (loading) return 'loading'
    if (!result) return 'idle'
    if (result.score >= 90) return 'perfect'
    if (result.score >= 70) return 'excited'
    if (result.score >= 50) return 'happy'
    if (result.score >= 30) return 'neutral'
    return 'sad'
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(index)
  }

  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    const fromIdx = dragIndex.current
    if (fromIdx === null || fromIdx === dropIdx) { setDragOver(null); return }
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(dropIdx, 0, moved)
    setItems(next)
    dragIndex.current = null
    setDragOver(null)
  }

  function handleDragEnd() {
    dragIndex.current = null
    setDragOver(null)
  }

  // Touch-based move (tap swap): tap the first fragment to select, tap second to swap
  const [touchSelected, setTouchSelected] = useState<number | null>(null)

  function handleTap(index: number) {
    if (submitted) return
    if (touchSelected === null) {
      setTouchSelected(index)
    } else {
      if (touchSelected !== index) {
        const next = [...items]
        ;[next[touchSelected], next[index]] = [next[index], next[touchSelected]]
        setItems(next)
      }
      setTouchSelected(null)
    }
  }

  async function handleSubmit() {
    if (items.length === 0 || loading) return
    setLoading(true)
    setError('')
    const userPrompt = items.join(' ')
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: userPrompt, level_config: levelConfig, level_id: levelId }),
      })
      if (!res.ok) throw new Error()
      const data: ScoreResult = await res.json()
      scoreRevealSound(data.score)
      if (data.score >= 60) levelCompleteSound()
      setResult(data)
      setSubmitted(true)
    } catch {
      setError('Scoring failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!fragments || fragments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EFEFEF' }}>
        <p style={{ color: '#999999' }}>No fragments for this level.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full" style={{ background: '#EFEFEF' }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes robot-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes robot-bounce { 0%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-10px) scale(1.05)} 60%{transform:translateY(-4px) scale(0.98)} }
        @keyframes robot-lean   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(3deg)} }
        .robot-float  { animation: robot-float  2.4s ease-in-out infinite; }
        .robot-bounce { animation: robot-bounce 1.2s ease-in-out infinite; }
        .robot-lean   { animation: robot-lean   1.6s ease-in-out infinite; }
      `}</style>

      {result && result.score >= 60 && CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: 'fixed', top: '-12px', left: `${c.x}%`,
          width: c.size, height: c.size, borderRadius: c.shape,
          background: c.color,
          animation: `confetti-fall ${c.duration}s ${c.delay}s ease-in forwards`,
          pointerEvents: 'none', zIndex: 50,
        }} />
      ))}

      <div className="w-full max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Robot */}
        <div className="flex justify-center pt-2">
          <GameRobot
            config={robotConfig}
            expression={robotExpression()}
            size={80}
            showBubble
            worldAccent={accent}
          />
        </div>

        {/* Goal card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: `${accent}99` }}>
            Reorder
          </p>
          <p className="text-base font-bold mb-1" style={{ color: '#1A1A1A' }}>
            {levelConfig.challenge}
          </p>
          <p className="text-xs" style={{ color: '#AAAAAA' }}>
            Drag to rearrange the fragments into the correct prompt order.
          </p>
        </div>

        {/* Fragment list */}
        <div className="flex flex-col gap-2">
          {items.map((frag, idx) => {
            const isOver    = dragOver === idx
            const isSelected = touchSelected === idx
            return (
              <div
                key={frag}
                draggable={!submitted}
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleTap(idx)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150"
                style={{
                  background: isSelected ? `${accent}15` : isOver ? `${accent}08` : '#FFFFFF',
                  border: `1.5px solid ${isSelected ? accent : isOver ? `${accent}60` : '#E8E8E8'}`,
                  opacity: submitted ? 0.85 : 1,
                  transform: isOver ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isSelected ? `0 0 0 2px ${accent}40` : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <span
                  className="shrink-0 w-5 h-5 rounded text-[10px] font-black flex items-center justify-center"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed flex-1" style={{ color: '#333333' }}>
                  {frag}
                </span>
                {!submitted && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 4h6M5 8h6M5 12h6" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        {/* Action / result */}
        {!submitted ? (
          <div className="flex flex-col gap-3">
            {error && <p className="text-xs text-center" style={{ color: '#E24A4A' }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95"
              style={{
                background: loading ? 'rgba(0,0,0,0.1)' : accent,
                color: loading ? '#AAAAAA' : '#FFFFFF',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Scoring…' : 'Submit Order →'}
            </button>
          </div>
        ) : result && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl"
                  style={{ background: `${accent}12`, color: accent }}
                >
                  {result.score}
                </div>
                <div>
                  <p className="font-black text-lg" style={{ color: '#1A1A1A' }}>
                    {getCongratulatoryMessage(result.score)}
                  </p>
                  <p className="text-xs font-mono" style={{ color: '#AAAAAA' }}>
                    +{result.xp_earned} XP
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>
                {result.feedback}
              </p>
            </div>

            {nextLevelUrl ? (
              <Link
                href={nextLevelUrl}
                className="w-full rounded-full py-3.5 font-bold text-base text-center block transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: accent, color: '#FFFFFF' }}
              >
                Next Level →
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full rounded-full py-3.5 font-bold text-base text-center block transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: accent, color: '#FFFFFF' }}
              >
                Back to Dashboard
              </Link>
            )}
            {result.score < 60 && (
              <button
                onClick={() => { setItems(shuffle(fragments!)); setResult(null); setSubmitted(false); setTouchSelected(null) }}
                className="w-full rounded-full py-3 font-bold text-sm transition-all duration-200 hover:opacity-80"
                style={{ background: 'transparent', border: `1.5px solid ${accent}`, color: accent }}
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
