'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

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

export default function WordBudget({ goal, wordLimit, levelId: _levelId, levelConfig, nextLevelUrl }: WordBudgetProps) {
  const [prompt, setPrompt]             = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [result, setResult]             = useState<ScoreResult | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [scoreLanded, setScoreLanded]   = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [displayedGoal, setDisplayedGoal] = useState('')
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
      setAnnouncement(
        `Score: ${result.score} out of 100. You earned ${result.xp_earned} XP. Feedback: ${result.feedback}`
      )
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
        // Fade in feedback after glow pulse settles
        setTimeout(() => setFeedbackVisible(true), 600)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, intervalMs)

    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
    }
  }, [result])

  async function handleSubmit() {
    if (isSubmitDisabled) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    setDisplayScore(0)
    setScoreLanded(false)
    setFeedbackVisible(false)

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
  }

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > wordLimit
  const isSubmitDisabled = isOverLimit || isLoading || prompt.trim() === ''

  // Color bands: red <40, yellow 40-59, lime 60-79, white 80-100
  const scoreColor =
    displayScore >= 80 ? '#ffffff'
    : displayScore >= 60 ? '#E8FF47'
    : displayScore >= 40 ? '#facc15'
    : '#f87171'

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#1a1a2e' }}>
      <style>{`
        @keyframes scorePulse {
          0%   { text-shadow: 0 0 0px transparent; }
          40%  { text-shadow: 0 0 32px rgba(232,255,71,0.8), 0 0 64px rgba(232,255,71,0.4); }
          100% { text-shadow: 0 0 10px rgba(232,255,71,0.2); }
        }
        .score-glow {
          animation: scorePulse 0.9s ease-out forwards;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .typing-cursor::after {
          content: '|';
          margin-left: 1px;
          animation: cursorBlink 0.8s step-end infinite;
          color: #E8FF47;
        }
        .typing-cursor-done::after {
          content: '';
        }
      `}</style>

      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div
        className="w-full max-w-xl rounded-2xl p-8 flex flex-col gap-6"
        style={{ backgroundColor: '#12122a', border: '1px solid #2a2a4a' }}
        role="main"
      >
        {/* Goal */}
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#E8FF47' }}
            id="goal-label"
          >
            Goal
          </p>
          <p
            className={`text-white text-base leading-relaxed ${displayedGoal.length < goal.length ? 'typing-cursor' : 'typing-cursor-done'}`}
            aria-labelledby="goal-label"
            aria-label={goal}
          >
            {displayedGoal}
          </p>
        </div>

        {/* Divider */}
        <div role="separator" style={{ height: '1px', backgroundColor: '#2a2a4a' }} />

        {/* Textarea + word counter */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="prompt-textarea"
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#E8FF47' }}
          >
            Your Prompt
          </label>
          <textarea
            id="prompt-textarea"
            className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47] placeholder:text-white/50"
            style={{
              backgroundColor: '#1a1a2e',
              border: `1.5px solid ${isOverLimit ? '#f87171' : '#2a2a4a'}`,
              minHeight: '140px',
              caretColor: '#E8FF47',
              color: '#ffffff',
            }}
            placeholder="Write your prompt here…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading || result !== null}
            aria-describedby="word-counter"
            aria-invalid={isOverLimit}
            aria-label="Your prompt response"
            onFocus={(e) => { if (!isOverLimit) e.target.style.borderColor = '#E8FF47' }}
            onBlur={(e)  => { e.target.style.borderColor = isOverLimit ? '#f87171' : '#2a2a4a' }}
          />

          {/* Word counter */}
          <div className="flex justify-end">
            <span
              id="word-counter"
              className="text-xs font-mono tabular-nums transition-colors duration-200"
              style={{ color: isOverLimit ? '#f87171' : '#9ca3af' }}
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
              isLoading
                ? 'Scoring your prompt, please wait'
                : isOverLimit
                ? 'Cannot submit: prompt exceeds word limit'
                : 'Submit your prompt for scoring'
            }
            className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
            style={{
              backgroundColor: isSubmitDisabled ? '#2a2a4a' : '#E8FF47',
              color: isSubmitDisabled ? '#9ca3af' : '#1a1a2e',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#4a4a6a', borderTopColor: '#9ca3af' }}
                />
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
          <p
            role="alert"
            className="text-sm text-center rounded-xl py-3 px-4"
            style={{ backgroundColor: '#2d1515', color: '#f87171' }}
          >
            {error}
          </p>
        )}

        {/* Result */}
        {result !== null && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-500">
            {/* Score display */}
            <div className="flex flex-col items-center gap-1 py-4" aria-hidden="true">
              <span
                className={`text-7xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`}
                style={{ color: scoreColor }}
              >
                {displayScore}
              </span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ color: '#9ca3af' }}>
                out of 100
              </span>
              {scoreLanded && (
                <span
                  className="text-sm font-bold mt-2 animate-in fade-in duration-300"
                  style={{ color: scoreColor }}
                >
                  {getCongratulatoryMessage(result.score)}
                </span>
              )}
              <span className="text-xs mt-1" style={{ color: '#E8FF47' }}>
                +{result.xp_earned} XP
              </span>
            </div>

            {/* Feedback — fades in after score animation */}
            <div
              className="rounded-xl p-5 transition-opacity duration-500"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a4a',
                opacity: feedbackVisible ? 1 : 0,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#E8FF47' }}
                id="feedback-label"
              >
                Feedback
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#d1d5db' }}
                aria-labelledby="feedback-label"
              >
                {result.feedback}
              </p>
            </div>

            {/* Actions — also wait for feedback */}
            <div
              className="flex flex-col gap-3 transition-opacity duration-500"
              style={{ opacity: feedbackVisible ? 1 : 0 }}
            >
              {result.score >= 60 && nextLevelUrl ? (
                <>
                  <Link
                    href={nextLevelUrl}
                    className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
                    style={{ backgroundColor: '#1a1a2e', border: '1.5px solid #E8FF47', color: '#E8FF47' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E8FF47'; e.currentTarget.style.color = '#1a1a2e' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a1a2e'; e.currentTarget.style.color = '#E8FF47' }}
                  >
                    Next Level →
                  </Link>
                  <button
                    onClick={handleReset}
                    aria-label="Try again — clear your prompt and start over"
                    className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
                    style={{ backgroundColor: '#1a1a2e', border: '1.5px solid rgba(232,255,71,0.3)', color: 'rgba(232,255,71,0.5)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8FF47'; e.currentTarget.style.color = '#E8FF47' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(232,255,71,0.3)'; e.currentTarget.style.color = 'rgba(232,255,71,0.5)' }}
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  {result.score < 60 && (
                    <p className="text-xs text-center font-mono" style={{ color: '#9ca3af' }}>
                      Score 60 or higher to advance to the next level.
                    </p>
                  )}
                  <button
                    onClick={handleReset}
                    aria-label="Try again — clear your prompt and start over"
                    className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
                    style={{ backgroundColor: '#1a1a2e', border: '1.5px solid #E8FF47', color: '#E8FF47', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E8FF47'; e.currentTarget.style.color = '#1a1a2e' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a1a2e'; e.currentTarget.style.color = '#E8FF47' }}
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
  )
}
