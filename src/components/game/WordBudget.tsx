'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import GameRobot, { type RobotExpression } from './GameRobot'

interface LevelConfig {
  world: 'clarity' | 'constraints' | 'structure' | 'debug'
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

interface WordBudgetProps {
  goal: string
  wordLimit: number
  levelId: number
  levelConfig: LevelConfig
  nextLevelUrl?: string
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function getCongratulatoryMessage(score: number): string {
  if (score === 100) return 'Perfect score!'
  if (score >= 80)   return 'Excellent!'
  if (score >= 60)   return 'Nice work!'
  if (score >= 40)   return 'Getting there!'
  return 'Keep practicing!'
}

// Deterministic confetti pieces — avoids hydration mismatch
const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#B0E020', '#facc15', '#f59e0b', '#ffffff', '#a78bfa', '#34d399'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',  // circle / rounded / square
}))

export default function WordBudget({ goal, wordLimit, levelId: _levelId, levelConfig, nextLevelUrl }: WordBudgetProps) {
  const [prompt, setPrompt]                   = useState('')
  const [isLoading, setIsLoading]             = useState(false)
  const [result, setResult]                   = useState<ScoreResult | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const [displayScore, setDisplayScore]       = useState(0)
  const [scoreLanded, setScoreLanded]         = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [announcement, setAnnouncement]       = useState('')
  const [displayedGoal, setDisplayedGoal]     = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Typing animation for goal text on mount
  useEffect(() => {
    setDisplayedGoal('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayedGoal(goal.slice(0, i))
      if (i >= goal.length) clearInterval(timer)
    }, 22)
    return () => clearInterval(timer)
  }, [goal])

  // Screen reader announcement
  useEffect(() => {
    if (result) {
      setAnnouncement(`Score: ${result.score} out of 100. You earned ${result.xp_earned} XP. Feedback: ${result.feedback}`)
    } else {
      setAnnouncement('')
    }
  }, [result])

  // Score count-up over 1.5s, then reveal feedback
  useEffect(() => {
    if (result === null) {
      setScoreLanded(false)
      setFeedbackVisible(false)
      return
    }

    const target = result.score
    const duration = 1500
    const steps = 60
    const intervalMs = duration / steps
    const increment = target / steps
    let current = 0

    if (animationRef.current) clearInterval(animationRef.current)
    setScoreLanded(false)
    setFeedbackVisible(false)

    animationRef.current = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayScore(target)
        setScoreLanded(true)
        if (animationRef.current) clearInterval(animationRef.current)
        setTimeout(() => setFeedbackVisible(true), 600)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, intervalMs)

    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
    }
  }, [result])

  // Celebration when score lands ≥ 60 and next level exists
  useEffect(() => {
    if (scoreLanded && result && result.score >= 60 && nextLevelUrl) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 3200)
      return () => clearTimeout(timer)
    }
  }, [scoreLanded, result, nextLevelUrl])

  async function handleSubmit() {
    if (isSubmitDisabled) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    setDisplayScore(0)
    setScoreLanded(false)
    setFeedbackVisible(false)
    setShowCelebration(false)

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt,
          level_config: levelConfig,
          level_id: levelConfig.level,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
      }

      const data: ScoreResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setPrompt('')
    setResult(null)
    setError(null)
    setDisplayScore(0)
    setScoreLanded(false)
    setFeedbackVisible(false)
    setAnnouncement('')
    setShowCelebration(false)
  }

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > wordLimit
  const isSubmitDisabled = isOverLimit || isLoading || prompt.trim() === ''

  const scoreColor =
    displayScore >= 80 ? '#ffffff'
    : displayScore >= 60 ? '#B0E020'
    : displayScore >= 40 ? '#facc15'
    : '#f87171'

  // Derive robot expression
  const robotExpression: RobotExpression =
    isLoading                           ? 'loading'
    : result === null                   ? 'idle'
    : !scoreLanded                      ? 'loading'
    : result.score === 100              ? 'perfect'
    : result.score >= 80                ? 'excited'
    : result.score >= 60                ? 'happy'
    : result.score >= 40                ? 'neutral'
    : 'sad'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#000' }}>
      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {/* Robot mascot — fixed top-right, hidden on small screens */}
      <div
        className="hidden sm:block"
        style={{ position: 'fixed', right: '1.5rem', top: '5.5rem', zIndex: 40 }}
        aria-hidden="true"
      >
        <GameRobot expression={robotExpression} />
      </div>

      {/* "LEVEL COMPLETE!" banner — centered overlay */}
      {showCelebration && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            zIndex: 60,
            pointerEvents: 'none',
            animation: 'levelComplete 3.2s ease-in-out forwards',
            whiteSpace: 'nowrap',
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              color: '#B0E020',
              textShadow: '0 0 24px rgba(176,224,32,0.9), 0 0 60px rgba(176,224,32,0.5)',
            }}
          >
            LEVEL COMPLETE!
          </span>
        </div>
      )}

      {/* Confetti */}
      {showCelebration && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 55 }} aria-hidden="true">
          {CONFETTI.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x + '%',
                top: '30%',
                width:  p.size + 'px',
                height: p.size + 'px',
                borderRadius: p.shape,
                background: p.color,
                animationName: 'confettiFall',
                animationDuration: p.duration + 's',
                animationDelay: p.delay + 's',
                animationTimingFunction: 'ease-in',
                animationFillMode: 'forwards',
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className="w-full rounded-3xl p-5 sm:p-8 flex flex-col gap-5 sm:gap-6"
          role="main"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(12px)',
          }}
        >

          {/* Goal */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#B0E020' }} id="goal-label">
              Goal
            </p>
            <p
              className={`text-base sm:text-lg font-bold text-white leading-relaxed ${displayedGoal.length < goal.length ? 'typing-cursor' : 'typing-cursor-done'}`}
              aria-labelledby="goal-label"
              aria-label={goal}
            >
              {displayedGoal}
            </p>
          </div>

          {/* Divider */}
          <div role="separator" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Textarea + word counter */}
          <div className="flex flex-col gap-3">
            <label htmlFor="prompt-textarea" className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#B0E020' }}>
              Your Prompt
            </label>
            <textarea
              id="prompt-textarea"
              className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#B0E020] placeholder:text-white/30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isOverLimit ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                minHeight: '120px',
                caretColor: '#B0E020',
                color: '#B0E020',
                fontWeight: 700,
              }}
              placeholder="Write your prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading || result !== null}
              aria-describedby="word-counter"
              aria-invalid={isOverLimit}
              aria-label="Your prompt response"
              onFocus={(e) => { if (!isOverLimit) e.target.style.borderColor = '#B0E020' }}
              onBlur={(e)  => { e.target.style.borderColor = isOverLimit ? '#f87171' : 'rgba(255,255,255,0.1)' }}
            />

            {/* Word counter pill */}
            <div className="flex justify-end">
              <span
                id="word-counter"
                className="text-xs font-mono tabular-nums rounded-full px-3 py-1 transition-all duration-200"
                style={{
                  background: isOverLimit ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
                  color: isOverLimit ? '#f87171' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${isOverLimit ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
                }}
                aria-label={`${wordCount} of ${wordLimit} words used${isOverLimit ? ', over limit' : ''}`}
              >
                {wordCount} / {wordLimit} words{isOverLimit && ' — over limit'}
              </span>
            </div>
          </div>

          {/* Submit button */}
          {result === null && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              aria-disabled={isSubmitDisabled}
              aria-busy={isLoading}
              aria-label={
                isLoading ? 'Scoring your prompt, please wait'
                : isOverLimit ? 'Cannot submit: prompt exceeds word limit'
                : 'Submit your prompt for scoring'
              }
              className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary${!isSubmitDisabled ? ' neon-pulse' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(26,29,43,0.2)', borderTopColor: '#1A1D2B' }} />
                  Scoring…
                </span>
              ) : isOverLimit ? (
                'Trim your prompt to submit'
              ) : (
                'Submit'
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          {/* Result */}
          {result !== null && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">

              {/* Score display */}
              <div className="flex flex-col items-center gap-2 py-6" aria-hidden="true">
                <span
                  className={`text-7xl sm:text-8xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`}
                  style={{ color: scoreColor }}
                >
                  {displayScore}
                </span>
                <span className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  out of 100
                </span>
                {scoreLanded && (
                  <span
                    className="text-base font-bold mt-1 animate-in fade-in duration-300"
                    style={{ color: scoreColor }}
                  >
                    {getCongratulatoryMessage(result.score)}
                  </span>
                )}
                {scoreLanded && (
                  <span
                    className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300"
                    style={{ background: 'rgba(176,224,32,0.12)', color: '#B0E020', border: '1px solid rgba(176,224,32,0.25)' }}
                  >
                    +{result.xp_earned} XP
                  </span>
                )}
              </div>

              {/* Feedback */}
              <div
                className="rounded-3xl p-6 transition-opacity duration-500"
                style={{
                  opacity: feedbackVisible ? 1 : 0,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#B0E020' }} id="feedback-label">
                  Feedback
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }} aria-labelledby="feedback-label">
                  {result.feedback}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0 }}>
                {result.score >= 60 && nextLevelUrl ? (
                  <>
                    <Link
                      href={nextLevelUrl}
                      className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary"
                    >
                      Next Level →
                    </Link>
                    <button
                      onClick={handleReset}
                      aria-label="Try again — clear your prompt and start over"
                      className="w-full rounded-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020]"
                      style={{ border: '1.5px solid rgba(176,224,32,0.3)', color: 'rgba(176,224,32,0.5)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B0E020'; e.currentTarget.style.color = '#B0E020' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(176,224,32,0.3)'; e.currentTarget.style.color = 'rgba(176,224,32,0.5)' }}
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    {result.score < 60 && (
                      <p className="text-xs text-center font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Score 60 or higher to advance to the next level.
                      </p>
                    )}
                    <button
                      onClick={handleReset}
                      aria-label="Try again — clear your prompt and start over"
                      className="w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0E020] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary"
                    >
                      Try Again
                    </button>
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
