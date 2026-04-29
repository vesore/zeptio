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

type Phase = 'ready' | 'round1' | 'round2' | 'round3' | 'scoring' | 'done'

const TOTAL_TIME = 60

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#4A90E2', '#E2A04A', '#4AE27A', '#E24A4A', '#9B4AE2', '#1A1A1A'][i % 6],
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

export default function SpeedRound({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
}: Props) {
  const [phase, setPhase]             = useState<Phase>('ready')
  const [timeLeft, setTimeLeft]       = useState(TOTAL_TIME)
  const [prompts, setPrompts]         = useState<[string, string, string]>(['', '', ''])
  const [currentRound, setCurrentRound] = useState(0) // 0=none, 1/2/3=active
  const [scores, setScores]           = useState<[ScoreResult | null, ScoreResult | null, ScoreResult | null]>([null, null, null])
  const [bestResult, setBestResult]   = useState<ScoreResult | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [scoreLanded, setScoreLanded] = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [reflection, setReflection]   = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startTimer() {
    setCurrentRound(1)
    setPhase('round1')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setPhase('scoring')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  // Score animation
  useEffect(() => {
    if (!bestResult) return
    const target = bestResult.score
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
  }, [bestResult])

  useEffect(() => {
    if (scoreLanded && bestResult && bestResult.score >= 60 && nextLevelUrl) {
      setShowCelebration(true)
      const t = setTimeout(() => setShowCelebration(false), 3200)
      return () => clearTimeout(t)
    }
  }, [scoreLanded, bestResult, nextLevelUrl])

  // Score all prompts when time's up
  useEffect(() => {
    if (phase !== 'scoring') return
    async function scoreAll() {
      const results: [ScoreResult | null, ScoreResult | null, ScoreResult | null] = [null, null, null]
      for (let i = 0; i < 3; i++) {
        const p = prompts[i]
        if (!p.trim()) continue
        try {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_prompt: p, level_config: levelConfig, level_id: levelConfig.level }),
          })
          if (res.ok) results[i] = await res.json()
        } catch { /* continue to next */ }
      }
      setScores(results)
      const valid = results.filter(Boolean) as ScoreResult[]
      const best = valid.reduce((b, r) => r.score > (b?.score ?? -1) ? r : b, null as ScoreResult | null)
      setBestResult(best)
      setPhase('done')
    }
    scoreAll()
  }, [phase, prompts, levelConfig])

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
    if (timerRef.current) clearInterval(timerRef.current)
    if (animationRef.current) clearInterval(animationRef.current)
    setPhase('ready'); setTimeLeft(TOTAL_TIME); setPrompts(['', '', '']); setCurrentRound(0)
    setScores([null, null, null]); setBestResult(null); setDisplayScore(0)
    setScoreLanded(false); setFeedbackVisible(false); setShowCelebration(false)
    setReflection(''); setReflectionSaved(false); setError(null)
  }

  function advanceRound() {
    if (currentRound === 1) { setCurrentRound(2); setPhase('round2') }
    else if (currentRound === 2) { setCurrentRound(3); setPhase('round3') }
    else { if (timerRef.current) clearInterval(timerRef.current); setPhase('scoring') }
  }

  const timerColor = timeLeft <= 10 ? '#C84B1F' : timeLeft <= 20 ? '#B87333' : '#4AE27A'

  const robotExpression: RobotExpression =
    phase === 'scoring' ? 'loading'
    : phase === 'done' && scoreLanded && bestResult && bestResult.score === 100 ? 'perfect'
    : phase === 'done' && scoreLanded && bestResult && bestResult.score >= 80 ? 'excited'
    : phase === 'done' && scoreLanded && bestResult && bestResult.score >= 60 ? 'happy'
    : phase === 'done' && scoreLanded && bestResult ? 'neutral'
    : phase === 'done' ? 'sad'
    : phase === 'ready' ? 'idle'
    : timeLeft <= 10 ? 'excited'
    : prompts[currentRound - 1]?.trim() ? 'typing'
    : 'idle'

  const scoreColor =
    displayScore >= 80 ? '#1A1A1A' : displayScore >= 60 ? '#00FF88' : displayScore >= 40 ? '#B87333' : '#E24A4A'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="sr-only" aria-live="polite">{scoreLanded && bestResult ? `Best score: ${bestResult.score}. ${bestResult.feedback}` : ''}</div>

      <div style={{ position: 'fixed', right: '1rem', bottom: '1.5rem', zIndex: 40 }} aria-hidden="true">
        <GameRobot config={robotConfig} expression={robotExpression} size={80} showBubble />
      </div>

      {showCelebration && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 60, pointerEvents: 'none', animation: 'levelComplete 3.2s ease-in-out forwards', whiteSpace: 'nowrap' }} aria-hidden="true">
          <span style={{ fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, fontFamily: 'var(--font-fredoka)', letterSpacing: '0.08em', color: '#4A90E2', textShadow: '0 0 24px rgba(74,144,226,0.9)' }}>LEVEL COMPLETE!</span>
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
        <div className="w-full rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6" style={{ background: '#FAFAFA', border: '1.5px solid #E8E8E8',  }}>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(226,160,74,0.1)', color: '#E2A04A', border: '1px solid rgba(226,160,74,0.2)' }}>
              Speed Round
            </span>
            {/* Timer */}
            {(phase === 'round1' || phase === 'round2' || phase === 'round3') && (
              <div className="flex flex-col items-center">
                <span
                  className={`text-4xl font-black tabular-nums font-mono ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                  style={{ color: timerColor, textShadow: timeLeft <= 10 ? `0 0 20px ${timerColor}` : undefined }}
                >
                  {timeLeft}
                </span>
                <span className="text-xs" style={{ color: '#999999' }}>seconds</span>
              </div>
            )}
          </div>

          {/* Ready screen */}
          {phase === 'ready' && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4A90E2' }}>The Challenge</p>
                <p className="text-base font-bold leading-relaxed" style={{ color: '#1A1A1A' }}>{levelConfig.challenge}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(226,160,74,0.06)', border: '1px solid rgba(226,160,74,0.15)' }}>
                <p className="text-sm font-mono" style={{ color: '#E2A04A' }}>3 prompts · 60 seconds · Best score counts</p>
                <p className="text-xs mt-1" style={{ color: '#888888' }}>Write 3 different prompts for the same challenge. Press Next to advance between rounds. Best score used for XP and progression.</p>
              </div>
              <button onClick={startTimer} className="w-full py-4 font-bold text-sm tracking-wide btn-primary neon-pulse">
                Start — GO!
              </button>
            </div>
          )}

          {/* Active rounds */}
          {(phase === 'round1' || phase === 'round2' || phase === 'round3') && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4A90E2' }}>Prompt {currentRound} of 3</p>
                <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{levelConfig.challenge}</p>
              </div>

              {/* Round indicators */}
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: n < currentRound ? '#00FF88' : n === currentRound ? 'rgba(74,144,226,0.4)' : 'rgba(255,255,255,0.1)' }}
                  />
                ))}
              </div>

              <textarea
                className="w-full rounded-2xl p-4 text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] placeholder:text-black/25"
                style={{ background: '#FAFAFA', border: '1.5px solid #E8E8E8', minHeight: '120px', caretColor: '#4A90E2', color: '#4A90E2', fontWeight: 700 }}
                placeholder={`Prompt ${currentRound} — write your best…`}
                value={prompts[currentRound - 1]}
                onChange={(e) => {
                  const updated: [string, string, string] = [...prompts] as [string, string, string]
                  updated[currentRound - 1] = e.target.value
                  setPrompts(updated)
                }}
                autoFocus
                onFocus={(e) => { e.target.style.borderColor = '#00FF88' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />

              <button
                onClick={advanceRound}
                className="w-full py-4 font-bold text-sm tracking-wide btn-primary"
              >
                {currentRound < 3 ? `Next Prompt →` : 'Submit All'}
              </button>
            </div>
          )}

          {/* Scoring */}
          {phase === 'scoring' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(74,144,226,0.2)', borderTopColor: '#4AE27A' }} />
              <p className="text-sm font-mono" style={{ color: '#666666' }}>Scoring all 3 prompts…</p>
            </div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              {/* 3 prompt scores */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A90E2' }}>Round Scores</p>
                {scores.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-mono" style={{ color: '#999999' }}>Round {i + 1}</span>
                    <div className="flex-1 text-xs" style={{ color: '#666666' }}>{prompts[i] ? `"${prompts[i].substring(0, 40)}${prompts[i].length > 40 ? '…' : ''}"` : '(skipped)'}</div>
                    {s ? (
                      <span className="text-xs font-mono font-bold" style={{ color: s.score >= 60 ? '#00FF88' : '#E2A04A' }}>{s.score}</span>
                    ) : (
                      <span className="text-xs font-mono" style={{ color: '#BBBBBB' }}>—</span>
                    )}
                  </div>
                ))}
              </div>

              {bestResult ? (
                <>
                  <div className="flex flex-col items-center gap-2 py-4" aria-hidden="true">
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(74,144,226,0.5)' }}>Best Score</p>
                    <span className={`fredoka text-7xl sm:text-8xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`} style={{ color: scoreColor }}>{displayScore}</span>
                    <span className="text-xs uppercase tracking-widest mt-1" style={{ color: '#888888' }}>out of 100</span>
                    {scoreLanded && <span className="text-base font-bold mt-1 animate-in fade-in duration-300" style={{ color: scoreColor }}>{getCongratulatoryMessage(bestResult.score)}</span>}
                    {scoreLanded && <span className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300" style={{ background: 'rgba(74,144,226,0.12)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.25)' }}>+{bestResult.xp_earned} XP</span>}
                  </div>

                  <div className="rounded-3xl p-6 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A90E2' }}>Feedback — Best Prompt</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#444444' }}>{bestResult.feedback}</p>
                  </div>

                  <div className="rounded-3xl p-6 flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: 'rgba(226,160,74,0.04)', border: '1px solid rgba(226,160,74,0.15)' }}>
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E2A04A' }}>Reflection</label>
                    <p className="text-sm" style={{ color: '#666666' }}>What made your best prompt stronger than the others?</p>
                    <div className="flex gap-2 items-start">
                      <textarea className="flex-1 rounded-xl p-3 text-sm resize-none outline-none focus-visible:ring-1 focus-visible:ring-[#B87333]" style={{ background: '#FAFAFA', border: '1px solid rgba(226,160,74,0.2)', color: 'rgba(255,255,255,0.8)', minHeight: '60px', caretColor: '#E2A04A' }} placeholder="Type your reflection…" value={reflection} onChange={(e) => setReflection(e.target.value.slice(0, 100))} disabled={reflectionSaved} />
                      <button onClick={handleSaveReflection} disabled={!reflection.trim() || reflectionSaved} className="shrink-0 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: reflectionSaved ? 'rgba(74,144,226,0.1)' : 'rgba(226,160,74,0.15)', border: `1px solid ${reflectionSaved ? 'rgba(74,144,226,0.3)' : 'rgba(226,160,74,0.3)'}`, color: reflectionSaved ? '#00FF88' : '#E2A04A', cursor: reflectionSaved ? 'default' : 'pointer' }}>
                        {reflectionSaved ? '✓ Saved' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0 }}>
                    {bestResult.score >= 60 && nextLevelUrl ? (
                      <>
                        <Link href={nextLevelUrl} className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] btn-primary">Next Level →</Link>
                        <button onClick={handleReset} className="w-full rounded-full py-4 font-bold text-sm" style={{ border: '1.5px solid rgba(74,144,226,0.3)', color: 'rgba(74,144,226,0.5)', cursor: 'pointer' }}>Try Again</button>
                      </>
                    ) : (
                      <>
                        {bestResult.score < 60 && <p className="text-xs text-center font-mono" style={{ color: '#999999' }}>Score 60 or higher to advance.</p>}
                        <button onClick={handleReset} className="w-full py-4 font-bold text-sm tracking-wide btn-primary">Try Again</button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4 items-center py-4">
                  {error && <p className="text-sm text-center" style={{ color: '#E24A4A' }}>{error}</p>}
                  <p className="text-sm font-mono" style={{ color: '#888888' }}>No prompts were submitted in time.</p>
                  <button onClick={handleReset} className="w-full py-4 font-bold text-sm tracking-wide btn-primary">Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
