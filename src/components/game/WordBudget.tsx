'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import GameRobot, { type RobotExpression } from './GameRobot'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import { assembleSound, levelCompleteSound, scoreRevealSound } from '@/src/lib/sounds'

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

interface WordBudgetProps {
  goal: string
  wordLimit: number
  levelId: number
  levelConfig: LevelConfig
  nextLevelUrl?: string
  robotConfig?: RobotConfig
  keyRule?: string
}

const WORLD_ACCENT: Record<string, string> = {
  clarity:     '#4A90E2',
  constraints: '#E2A04A',
  structure:   '#4AE27A',
  debug:       '#E24A4A',
  mastery:     '#9B4AE2',
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

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    ['#4A90E2', '#E2A04A', '#4AE27A', '#E24A4A', '#9B4AE2', '#1A1A1A'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
}))

export default function WordBudget({
  goal,
  wordLimit,
  levelId,
  levelConfig,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
  keyRule,
}: WordBudgetProps) {
  const accent = WORLD_ACCENT[levelConfig.world] ?? '#4A90E2'

  const [ruleDismissed, setRuleDismissed]         = useState(!keyRule)
  const [prompt, setPrompt]                       = useState('')
  const [isLoading, setIsLoading]                 = useState(false)
  const [result, setResult]                       = useState<ScoreResult | null>(null)
  const [error, setError]                         = useState<string | null>(null)
  const [displayScore, setDisplayScore]           = useState(0)
  const [scoreLanded, setScoreLanded]             = useState(false)
  const [feedbackVisible, setFeedbackVisible]     = useState(false)
  const [announcement, setAnnouncement]           = useState('')
  const [displayedGoal, setDisplayedGoal]         = useState('')
  const [showCelebration, setShowCelebration]     = useState(false)
  const [reflection, setReflection]               = useState('')
  const [reflectionSaved, setReflectionSaved]     = useState(false)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  useEffect(() => {
    if (result) {
      setAnnouncement(`Score: ${result.score} out of 100. You earned ${result.xp_earned} XP. Feedback: ${result.feedback}`)
    } else {
      setAnnouncement('')
    }
  }, [result])

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
        assembleSound()
        scoreRevealSound(target)
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

  useEffect(() => {
    if (scoreLanded && result && result.score >= 60 && nextLevelUrl) {
      setShowCelebration(true)
      levelCompleteSound()
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
    setReflection('')
    setReflectionSaved(false)

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

  async function handleSaveReflection() {
    if (!reflection.trim() || reflectionSaved) return
    try {
      await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level_id: levelId,
          world: levelConfig.world,
          reflection: reflection.trim(),
        }),
      })
      setReflectionSaved(true)
    } catch {
      // Silently fail — reflection is non-critical
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
    setReflection('')
    setReflectionSaved(false)
  }

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > wordLimit
  const isSubmitDisabled = isOverLimit || isLoading || prompt.trim() === ''

  const scoreColor =
    displayScore >= 80 ? '#1A1A1A'
    : displayScore >= 60 ? '#4AE27A'
    : displayScore >= 40 ? '#E2A04A'
    : '#E24A4A'

  const robotExpression: RobotExpression =
    isLoading                                      ? 'loading'
    : result !== null && !scoreLanded              ? 'loading'
    : result !== null && result.score === 100      ? 'perfect'
    : result !== null && result.score >= 80        ? 'excited'
    : result !== null && result.score >= 60        ? 'happy'
    : result !== null && result.score >= 40        ? 'neutral'
    : result !== null                              ? 'sad'
    : prompt.trim() !== ''                         ? 'typing'
    : 'idle'

  // ── KEY RULE GATE ──────────────────────────────────────────────────────────
  if (!ruleDismissed && keyRule) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
        <div
          className="w-full max-w-2xl mx-auto"
          style={{
            background: '#F5F5F5',
            border: `1.5px solid ${accent}40`,
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <p
            className="text-xs font-mono font-semibold uppercase tracking-widest mb-6 text-center"
            style={{ color: accent }}
          >
            Key Rule
          </p>
          <p
            className="text-2xl sm:text-3xl font-black text-center leading-tight mb-10"
            style={{
              color: '#1A1A1A',
              fontFamily: 'monospace',
              letterSpacing: '0.02em',
            }}
          >
            &ldquo;{keyRule}&rdquo;
          </p>
          <button
            onClick={() => setRuleDismissed(true)}
            className="w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 btn-primary"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
            autoFocus
          >
            Got it, let&apos;s play
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN GAME UI ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {/* Robot companion */}
      <div
        style={{ position: 'fixed', right: '1rem', bottom: '1.5rem', zIndex: 40 }}
        aria-hidden="true"
      >
        <GameRobot config={robotConfig} expression={robotExpression} size={80} showBubble worldAccent={accent} />
      </div>

      {/* Level Complete banner */}
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
              color: accent,
              textShadow: `0 0 24px ${accent}88, 0 0 48px ${accent}44`,
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
            background: '#FFFFFF',
            border: '1.5px solid #E8E8E8',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}
        >

          {/* Key Rule reminder pill */}
          {keyRule && (
            <div
              className="rounded-2xl px-4 py-3 text-center"
              style={{
                background: `rgba(${accent.slice(1).match(/../g)?.map(h => parseInt(h, 16)).join(',')},0.06)`,
                border: `1px solid ${accent}30`,
              }}
            >
              <p className="text-xs font-mono" style={{ color: accent }}>
                &ldquo;{keyRule}&rdquo;
              </p>
            </div>
          )}

          {/* Goal */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3"
              style={{ color: accent }} id="goal-label">
              Goal
            </p>
            <p
              className={`text-base sm:text-lg font-bold leading-relaxed ${displayedGoal.length < goal.length ? 'typing-cursor' : 'typing-cursor-done'}`}
              style={{ color: '#1A1A1A' }}
              aria-labelledby="goal-label"
              aria-label={goal}
            >
              {displayedGoal}
            </p>
          </div>

          {/* Divider */}
          <div role="separator" style={{ height: '1px', background: '#F0F0F0' }} />

          {/* Textarea + word counter */}
          <div className="flex flex-col gap-3">
            <label htmlFor="prompt-textarea"
              className="text-xs font-mono font-semibold uppercase tracking-widest"
              style={{ color: accent }}>
              Your Prompt
            </label>
            <textarea
              id="prompt-textarea"
              className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all duration-200 focus-visible:ring-2 placeholder:text-black/25"
              style={{
                background: '#FAFAFA',
                border: `1.5px solid ${isOverLimit ? '#E24A4A' : '#E8E8E8'}`,
                minHeight: '120px',
                caretColor: accent,
                color: '#1A1A1A',
                fontWeight: 600,
              }}
              placeholder="Write your prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading || result !== null}
              aria-describedby="word-counter"
              aria-invalid={isOverLimit}
              aria-label="Your prompt response"
              onFocus={(e) => { if (!isOverLimit) e.target.style.borderColor = accent }}
              onBlur={(e)  => { e.target.style.borderColor = isOverLimit ? '#E24A4A' : '#E8E8E8' }}
            />

            <div className="flex justify-end">
              <span
                id="word-counter"
                className="text-xs font-mono tabular-nums rounded-full px-3 py-1 transition-all duration-200"
                style={{
                  background: isOverLimit ? 'rgba(226,74,74,0.08)' : '#F5F5F5',
                  color: isOverLimit ? '#E24A4A' : '#999999',
                  border: `1px solid ${isOverLimit ? 'rgba(226,74,74,0.25)' : '#E8E8E8'}`,
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
              className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 btn-primary${!isSubmitDisabled ? ' neon-pulse' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF' }} />
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
            <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4"
              style={{ background: 'rgba(226,74,74,0.08)', color: '#E24A4A', border: '1px solid rgba(226,74,74,0.2)' }}>
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
                <span className="text-xs uppercase tracking-widest mt-1" style={{ color: '#AAAAAA' }}>
                  out of 100
                </span>
                {scoreLanded && (
                  <span className="text-base font-bold mt-1 animate-in fade-in duration-300"
                    style={{ color: scoreColor }}>
                    {getCongratulatoryMessage(result.score)}
                  </span>
                )}
                {scoreLanded && (
                  <span
                    className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300"
                    style={{
                      background: `${accent}18`,
                      color: accent,
                      border: `1px solid ${accent}40`,
                    }}
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
                  background: '#F8F8F8',
                  border: '1px solid #EEEEEE',
                }}
              >
                <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3"
                  style={{ color: accent }} id="feedback-label">
                  Feedback
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#555555' }}
                  aria-labelledby="feedback-label">
                  {result.feedback}
                </p>
              </div>

              {/* Reflection */}
              <div
                className="rounded-3xl p-6 flex flex-col gap-3 transition-opacity duration-500"
                style={{
                  opacity: feedbackVisible ? 1 : 0,
                  background: `${accent}08`,
                  border: `1px solid ${accent}25`,
                }}
              >
                <label htmlFor="reflection-input"
                  className="text-xs font-mono font-semibold uppercase tracking-widest"
                  style={{ color: accent }}>
                  Reflection
                </label>
                <p className="text-sm" style={{ color: '#777777' }}>
                  What made your best attempt work better than your first?
                </p>
                <div className="flex gap-2 items-start">
                  <textarea
                    id="reflection-input"
                    className="flex-1 rounded-xl p-3 text-sm resize-none outline-none transition-all duration-200"
                    style={{
                      background: '#FFFFFF',
                      border: `1px solid ${accent}30`,
                      color: '#1A1A1A',
                      minHeight: '60px',
                      caretColor: accent,
                    }}
                    placeholder="Type your reflection…"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value.slice(0, 100))}
                    maxLength={100}
                    disabled={reflectionSaved}
                    aria-label="Your reflection on this attempt"
                  />
                  <button
                    onClick={handleSaveReflection}
                    disabled={!reflection.trim() || reflectionSaved}
                    className="shrink-0 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200"
                    style={{
                      background: reflectionSaved ? '#F0FAF5' : '#F5F5F5',
                      border: `1px solid ${reflectionSaved ? '#4AE27A50' : '#E0E0E0'}`,
                      color: reflectionSaved ? '#4AE27A' : '#888888',
                      cursor: reflectionSaved ? 'default' : 'pointer',
                    }}
                    aria-label={reflectionSaved ? 'Reflection saved' : 'Save reflection'}
                  >
                    {reflectionSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
                <p className="text-xs font-mono text-right" style={{ color: '#CCCCCC' }}>
                  {reflection.length}/100
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 transition-opacity duration-500"
                style={{ opacity: feedbackVisible ? 1 : 0 }}>
                {result.score >= 60 && nextLevelUrl ? (
                  <>
                    <Link
                      href={nextLevelUrl}
                      className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 btn-primary"
                    >
                      Next Level →
                    </Link>
                    <button
                      onClick={handleReset}
                      aria-label="Try again — clear your prompt and start over"
                      className="w-full rounded-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        border: `1.5px solid #E0E0E0`,
                        color: '#888888',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#1A1A1A' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = '#888888' }}
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    {result.score < 60 && (
                      <p className="text-xs text-center font-mono" style={{ color: '#AAAAAA' }}>
                        Score 60 or higher to advance to the next level.
                      </p>
                    )}
                    <button
                      onClick={handleReset}
                      aria-label="Try again — clear your prompt and start over"
                      className="w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 btn-primary"
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
