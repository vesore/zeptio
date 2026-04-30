'use client'

import { useState } from 'react'
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

interface Choice { id: 'A' | 'B' | 'C' | 'D'; text: string }
interface ScoreResult { score: number; xp_earned: number; feedback: string }

interface Props {
  levelConfig: LevelConfig
  levelId: number
  nextLevelUrl?: string
  robotConfig?: RobotConfig
  choices?: Choice[]
}

const WORLD_ACCENT: Record<string, string> = {
  clarity:     '#4A90E2',
  constraints: '#F5A623',
  structure:   '#4AE27A',
  debug:       '#E24A4A',
  mastery:     '#9B4AE2',
}

// A is always the strongest option (per levelGenerator spec).
const CHOICE_SCORES: Record<string, number> = { A: 100, B: 30, C: 20, D: 35 }

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#4A90E2', '#E2A04A', '#4AE27A', '#E24A4A', '#9B4AE2', '#1A1A1A'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
}))

function getCongratulatoryMessage(score: number): string {
  if (score === 100) return 'Correct! You spotted the best prompt.'
  if (score >= 50) return 'Close — but A was stronger.'
  return 'Not quite — A was the best choice.'
}

export default function MultipleChoice({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
  choices,
}: Props) {
  const accent = WORLD_ACCENT[levelConfig.world] ?? '#4A90E2'

  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)

  const robotExpression = (): RobotExpression => {
    if (loading) return 'loading'
    if (!result) return 'idle'
    if (result.score === 100) return 'perfect'
    if (result.score >= 50)  return 'neutral'
    return 'sad'
  }

  async function handleSubmit() {
    if (!selected || loading) return
    setLoading(true)
    setError('')
    const score = CHOICE_SCORES[selected] ?? 20

    try {
      // Persist to xp_ledger via score API using the selected text as the response
      const choiceText = choices?.find(c => c.id === selected)?.text ?? selected
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: choiceText,
          level_config: levelConfig,
          level_id: levelId,
        }),
      })
      let feedback = selected === 'A'
        ? 'Excellent choice. This prompt is specific, actionable, and includes the right constraints.'
        : 'A was the strongest option — it was specific, actionable, and well-constrained.'

      if (res.ok) {
        const data = await res.json()
        feedback = data.feedback ?? feedback
      }

      const finalScore = score
      scoreRevealSound(finalScore)
      if (finalScore >= 60) levelCompleteSound()

      setResult({ score: finalScore, xp_earned: finalScore, feedback })
      setRevealed(true)
    } catch {
      setError('Failed to submit — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!choices || choices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EFEFEF' }}>
        <p style={{ color: '#999999' }}>No choices for this level.</p>
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
          width: c.size, height: c.size, borderRadius: c.shape, background: c.color,
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
            Multiple Choice
          </p>
          <p className="text-base font-bold mb-1" style={{ color: '#1A1A1A' }}>
            {levelConfig.challenge}
          </p>
          <p className="text-xs" style={{ color: '#AAAAAA' }}>
            Pick the strongest prompt for the goal above.
          </p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-3">
          {choices.map(choice => {
            const isSelected = selected === choice.id
            const isCorrect = revealed && choice.id === 'A'
            const isWrong   = revealed && isSelected && choice.id !== 'A'
            return (
              <button
                key={choice.id}
                onClick={() => !revealed && setSelected(choice.id)}
                disabled={revealed}
                className="w-full rounded-xl p-4 text-left transition-all duration-200"
                style={{
                  background: isCorrect ? 'rgba(74,226,122,0.07)' : isWrong ? 'rgba(226,74,74,0.05)' : isSelected ? `${accent}0D` : '#FFFFFF',
                  border: `1.5px solid ${isCorrect ? '#4AE27A' : isWrong ? '#E24A4A' : isSelected ? accent : '#E8E8E8'}`,
                  cursor: revealed ? 'default' : 'pointer',
                  boxShadow: isSelected && !revealed ? `0 0 0 2px ${accent}25` : 'none',
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: isCorrect ? '#4AE27A' : isWrong ? '#E24A4A' : isSelected ? accent : 'rgba(0,0,0,0.08)',
                      color: (isCorrect || isWrong || isSelected) ? '#FFFFFF' : '#888888',
                    }}
                  >
                    {choice.id}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: '#333333' }}>
                    {choice.text}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && <p className="text-xs text-center" style={{ color: '#E24A4A' }}>{error}</p>}

        {/* Submit or result */}
        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95"
            style={{
              background: (!selected || loading) ? 'rgba(0,0,0,0.1)' : accent,
              color: (!selected || loading) ? '#AAAAAA' : '#FFFFFF',
              cursor: (!selected || loading) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting…' : 'Submit →'}
          </button>
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
                  <p className="text-xs font-mono" style={{ color: '#AAAAAA' }}>+{result.xp_earned} XP</p>
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
                onClick={() => { setSelected(null); setResult(null); setRevealed(false) }}
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
