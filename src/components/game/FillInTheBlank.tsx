'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import GameRobot, { type RobotExpression } from './GameRobot'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'

interface LevelConfig {
  world: 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'
  level: number
  challenge: string
  criteria: string[]
  max_xp: number
}

interface ScoreResult {
  score: number
  xp_earned: number
  feedback: string
}

interface Props {
  levelConfig: LevelConfig
  levelId: number
  nextLevelUrl?: string
  robotConfig?: RobotConfig
}

interface BlankPart {
  word: string
  isBlank: boolean
  idx: number
}

const STOP_WORDS = new Set([
  'write', 'a', 'an', 'the', 'and', 'or', 'but', 'to', 'for', 'of', 'with',
  'in', 'on', 'at', 'is', 'are', 'this', 'that', 'your', 'you', 'can', 'will',
  'by', 'from', 'as', 'be', 'it', 'its', 'was', 'do', 'how',
])

function createBlanks(challenge: string): BlankPart[] {
  const words = challenge.split(' ')
  const candidates = words
    .map((w, i) => ({ clean: w.replace(/[^a-zA-Z]/g, '').toLowerCase(), i }))
    .filter(({ clean, i }) => clean.length > 4 && !STOP_WORDS.has(clean) && i > 0 && i < words.length - 1)
    .map(({ i }) => i)

  const blankSet = new Set<number>()
  if (candidates.length >= 1) {
    const step = Math.max(1, Math.floor(candidates.length / 2))
    for (let j = 0; j < candidates.length && blankSet.size < 2; j += step) {
      blankSet.add(candidates[j])
    }
  }

  return words.map((word, idx) => ({ word, isBlank: blankSet.has(idx), idx }))
}

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#00FF88', '#B87333', '#C84B1F', '#E8E8E8', '#8B8FA8', '#00FF88'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
}))

function getCongratulatoryMessage(score: number): string {
  if (score === 100) return 'Perfect score!'
  if (score >= 80) return 'Excellent!'
  if (score >= 60) return 'Nice work!'
  if (score >= 40) return 'Getting there!'
  return 'Keep practicing!'
}

export default function FillInTheBlank({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
}: Props) {
  const parts = createBlanks(levelConfig.challenge)
  const blankParts = parts.filter(p => p.isBlank)

  const [blanks, setBlanks]               = useState<Record<number, string>>({})
  const [isLoading, setIsLoading]         = useState(false)
  const [result, setResult]               = useState<ScoreResult | null>(null)
  const [displayScore, setDisplayScore]   = useState(0)
  const [scoreLanded, setScoreLanded]     = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [reflection, setReflection]       = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (result === null) { setScoreLanded(false); setFeedbackVisible(false); return }
    const target = result.score
    const steps = 60; const intervalMs = 1500 / steps; const increment = target / steps; let current = 0
    if (animationRef.current) clearInterval(animationRef.current)
    setScoreLanded(false); setFeedbackVisible(false)
    animationRef.current = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayScore(target); setScoreLanded(true)
        if (animationRef.current) clearInterval(animationRef.current)
        setTimeout(() => setFeedbackVisible(true), 600)
      } else { setDisplayScore(Math.round(current)) }
    }, intervalMs)
    return () => { if (animationRef.current) clearInterval(animationRef.current) }
  }, [result])

  useEffect(() => {
    if (scoreLanded && result && result.score >= 60 && nextLevelUrl) {
      setShowCelebration(true)
      const t = setTimeout(() => setShowCelebration(false), 3200)
      return () => clearTimeout(t)
    }
  }, [scoreLanded, result, nextLevelUrl])

  const allFilled = blankParts.every(p => blanks[p.idx]?.trim())

  const completedPrompt = parts
    .map(p => p.isBlank ? (blanks[p.idx]?.trim() || '___') : p.word)
    .join(' ')

  async function handleSubmit() {
    if (!allFilled || isLoading) return
    setIsLoading(true); setError(null); setResult(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: completedPrompt, level_config: levelConfig, level_id: levelConfig.level }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveReflection() {
    if (!reflection.trim() || reflectionSaved) return
    try {
      await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level_id: levelId, world: levelConfig.world, reflection: reflection.trim() }),
      })
      setReflectionSaved(true)
    } catch { /* non-critical */ }
  }

  function handleReset() {
    setBlanks({}); setResult(null); setError(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)
  }

  const isSubmitDisabled = !allFilled || isLoading

  const scoreColor =
    displayScore >= 80 ? '#E8E8E8' : displayScore >= 60 ? '#00FF88' : displayScore >= 40 ? '#B87333' : '#C84B1F'

  const hasAnyInput = Object.values(blanks).some(v => v.trim())
  const robotExpression: RobotExpression =
    isLoading ? 'loading'
    : result !== null && !scoreLanded ? 'loading'
    : result !== null && result.score === 100 ? 'perfect'
    : result !== null && result.score >= 80 ? 'excited'
    : result !== null && result.score >= 60 ? 'happy'
    : result !== null && result.score >= 40 ? 'neutral'
    : result !== null ? 'sad'
    : hasAnyInput ? 'typing'
    : 'idle'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#0F0F0F' }}>
      <div className="sr-only" aria-live="polite">{scoreLanded && result ? `Score: ${result.score}. ${result.feedback}` : ''}</div>

      <div style={{ position: 'fixed', right: '1rem', bottom: '1.5rem', zIndex: 40 }} aria-hidden="true">
        <GameRobot config={robotConfig} expression={robotExpression} size={80} showBubble />
      </div>

      {showCelebration && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 60, pointerEvents: 'none', animation: 'levelComplete 3.2s ease-in-out forwards', whiteSpace: 'nowrap' }} aria-hidden="true">
          <span style={{ fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#00FF88', textShadow: '0 0 24px rgba(0,255,136,0.9)' }}>LEVEL COMPLETE!</span>
        </div>
      )}
      {showCelebration && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 55 }} aria-hidden="true">
          {CONFETTI.map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.x + '%', top: '30%', width: p.size + 'px', height: p.size + 'px', borderRadius: p.shape, background: p.color, animationName: 'confettiFall', animationDuration: p.duration + 's', animationDelay: p.delay + 's', animationTimingFunction: 'ease-in', animationFillMode: 'forwards' }} />
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(184,115,51,0.1)', color: '#B87333', border: '1px solid rgba(184,115,51,0.2)' }}>
              Fill in the Blank
            </span>
          </div>

          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#00FF88' }}>Complete the Prompt</p>
            {/* Inline blank display */}
            <div className="flex flex-wrap gap-x-1 gap-y-2 items-baseline text-base sm:text-lg font-bold leading-relaxed" style={{ color: '#E8E8E8' }}>
              {parts.map((p) =>
                p.isBlank ? (
                  <input
                    key={p.idx}
                    type="text"
                    value={blanks[p.idx] ?? ''}
                    onChange={(e) => setBlanks(prev => ({ ...prev, [p.idx]: e.target.value }))}
                    disabled={result !== null || isLoading}
                    placeholder="___"
                    className="rounded-lg px-2 py-0.5 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] transition-all duration-200 placeholder:text-[#B87333]/40"
                    style={{
                      background: 'rgba(184,115,51,0.12)',
                      border: '1.5px solid #B87333',
                      color: '#B87333',
                      caretColor: '#B87333',
                      minWidth: `${Math.max(p.word.length, 4)}ch`,
                      width: `${Math.max((blanks[p.idx]?.length ?? 0) + 2, p.word.length, 4)}ch`,
                    }}
                    aria-label={`Blank ${blankParts.indexOf(p) + 1} of ${blankParts.length}`}
                  />
                ) : (
                  <span key={p.idx}>{p.word}</span>
                )
              )}
            </div>
          </div>

          {/* Live preview */}
          {hasAnyInput && result === null && (
            <div className="rounded-2xl p-4 animate-in fade-in duration-300" style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <p className="text-xs font-mono mb-2" style={{ color: 'rgba(0,255,136,0.5)' }}>Preview</p>
              <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{completedPrompt}</p>
            </div>
          )}

          {result === null && (
            <button onClick={handleSubmit} disabled={isSubmitDisabled} className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 btn-primary${!isSubmitDisabled ? ' neon-pulse' : ''}`}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(15,15,15,0.3)', borderTopColor: '#0F0F0F' }} />
                  Scoring…
                </span>
              ) : !allFilled ? 'Fill all blanks to submit' : 'Submit'}
            </button>
          )}

          {error && <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

          {result !== null && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              {/* Show the completed prompt they submitted */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(184,115,51,0.06)', border: '1px solid rgba(184,115,51,0.15)' }}>
                <p className="text-xs font-mono mb-2" style={{ color: '#B87333' }}>Your completed prompt</p>
                <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{completedPrompt}</p>
              </div>

              <div className="flex flex-col items-center gap-2 py-6" aria-hidden="true">
                <span className={`text-7xl sm:text-8xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`} style={{ color: scoreColor }}>{displayScore}</span>
                <span className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>out of 100</span>
                {scoreLanded && <span className="text-base font-bold mt-1 animate-in fade-in duration-300" style={{ color: scoreColor }}>{getCongratulatoryMessage(result.score)}</span>}
                {scoreLanded && <span className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>+{result.xp_earned} XP</span>}
              </div>

              <div className="rounded-3xl p-6 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#00FF88' }}>Feedback</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{result.feedback}</p>
              </div>

              <div className="rounded-3xl p-6 flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: 'rgba(184,115,51,0.04)', border: '1px solid rgba(184,115,51,0.15)' }}>
                <label className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#B87333' }}>Reflection</label>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Which words made the biggest difference to the prompt?</p>
                <div className="flex gap-2 items-start">
                  <textarea className="flex-1 rounded-xl p-3 text-sm resize-none outline-none focus-visible:ring-1 focus-visible:ring-[#B87333]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,115,51,0.2)', color: 'rgba(255,255,255,0.8)', minHeight: '60px', caretColor: '#B87333' }} placeholder="Type your reflection…" value={reflection} onChange={(e) => setReflection(e.target.value.slice(0, 100))} disabled={reflectionSaved} />
                  <button onClick={handleSaveReflection} disabled={!reflection.trim() || reflectionSaved} className="shrink-0 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: reflectionSaved ? 'rgba(0,255,136,0.1)' : 'rgba(184,115,51,0.15)', border: `1px solid ${reflectionSaved ? 'rgba(0,255,136,0.3)' : 'rgba(184,115,51,0.3)'}`, color: reflectionSaved ? '#00FF88' : '#B87333', cursor: reflectionSaved ? 'default' : 'pointer' }}>
                    {reflectionSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0 }}>
                {result.score >= 60 && nextLevelUrl ? (
                  <>
                    <Link href={nextLevelUrl} className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] btn-primary">Next Level →</Link>
                    <button onClick={handleReset} className="w-full rounded-full py-4 font-bold text-sm" style={{ border: '1.5px solid rgba(0,255,136,0.3)', color: 'rgba(0,255,136,0.5)', cursor: 'pointer' }}>Try Again</button>
                  </>
                ) : (
                  <>
                    {result.score < 60 && <p className="text-xs text-center font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>Score 60 or higher to advance.</p>}
                    <button onClick={handleReset} className="w-full py-4 font-bold text-sm tracking-wide btn-primary">Try Again</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
