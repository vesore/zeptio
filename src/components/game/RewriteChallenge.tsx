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

function makeWeakPrompt(challenge: string): string {
  const firstWords = challenge.split(' ').slice(0, 6).join(' ')
  return `Write something about this topic. ${firstWords}... make it decent somehow. You know what I mean.`
}

const ORIGINAL_SCORE = 30

export default function RewriteChallenge({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
}: Props) {
  const weakPrompt = makeWeakPrompt(levelConfig.challenge)

  const [rewrite, setRewrite]             = useState('')
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

  async function handleSubmit() {
    if (!rewrite.trim() || isLoading) return
    setIsLoading(true); setError(null); setResult(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)

    try {
      const contextConfig = {
        ...levelConfig,
        criteria: [...levelConfig.criteria, `Score must beat the original weak prompt score of ${ORIGINAL_SCORE}`],
      }
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: rewrite, level_config: contextConfig, level_id: levelConfig.level }),
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
    setRewrite(''); setResult(null); setError(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)
  }

  const improvement = result ? result.score - ORIGINAL_SCORE : 0

  const scoreColor =
    displayScore >= 80 ? '#E8E8E8' : displayScore >= 60 ? '#00FF88' : displayScore >= 40 ? '#B87333' : '#C84B1F'

  const robotExpression: RobotExpression =
    isLoading ? 'loading'
    : result !== null && !scoreLanded ? 'loading'
    : result !== null && result.score === 100 ? 'perfect'
    : result !== null && improvement > 50 ? 'excited'
    : result !== null && result.score >= 60 ? 'happy'
    : result !== null && result.score >= 40 ? 'neutral'
    : result !== null ? 'sad'
    : rewrite.trim() ? 'typing'
    : 'idle'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#0F0F0F' }}>
      <div className="sr-only" aria-live="polite">{scoreLanded && result ? `Score: ${result.score}. Improvement: ${improvement} points. ${result.feedback}` : ''}</div>

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
              Rewrite Challenge
            </span>
          </div>

          {/* Weak prompt card */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(200,75,31,0.08)', border: '1px solid rgba(200,75,31,0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#C84B1F' }}>Weak Prompt</p>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,75,31,0.15)', color: '#C84B1F', border: '1px solid rgba(200,75,31,0.3)' }}>
                Score: {ORIGINAL_SCORE}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{weakPrompt}</p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Goal reminder */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: '#00FF88' }}>Original Goal</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{levelConfig.challenge}</p>
          </div>

          {result === null && (
            <div className="flex flex-col gap-3">
              <label htmlFor="rewrite-input" className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#00FF88' }}>
                Your Rewrite <span style={{ color: 'rgba(0,255,136,0.4)' }}>— beat {ORIGINAL_SCORE}</span>
              </label>
              <textarea
                id="rewrite-input"
                className="w-full rounded-2xl p-4 text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] placeholder:text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', minHeight: '140px', caretColor: '#00FF88', color: '#00FF88', fontWeight: 700 }}
                placeholder="Rewrite the prompt to make it clear, specific, and effective…"
                value={rewrite}
                onChange={(e) => setRewrite(e.target.value)}
                disabled={isLoading}
                onFocus={(e) => { e.target.style.borderColor = '#00FF88' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
          )}

          {result === null && (
            <button onClick={handleSubmit} disabled={!rewrite.trim() || isLoading} className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 btn-primary${rewrite.trim() && !isLoading ? ' neon-pulse' : ''}`}>
              {isLoading ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(15,15,15,0.3)', borderTopColor: '#0F0F0F' }} />Scoring…</span> : 'Submit Rewrite'}
            </button>
          )}

          {error && <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

          {result !== null && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(200,75,31,0.08)', border: '1px solid rgba(200,75,31,0.2)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono font-semibold" style={{ color: '#C84B1F' }}>Original</p>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,75,31,0.15)', color: '#C84B1F' }}>{ORIGINAL_SCORE}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{weakPrompt}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono font-semibold" style={{ color: '#00FF88' }}>Your Rewrite</p>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}>{result.score}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{rewrite}</p>
                </div>
              </div>

              {/* Improvement badge */}
              {scoreLanded && improvement > 0 && (
                <div className="text-center animate-in fade-in duration-300">
                  <span className="text-sm font-bold font-mono px-4 py-2 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}>
                    +{improvement} point improvement
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 py-4" aria-hidden="true">
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
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>What was the biggest flaw in the original prompt?</p>
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
