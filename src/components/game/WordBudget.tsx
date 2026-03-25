'use client'

import { useState, useEffect, useRef } from 'react'

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
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export default function WordBudget({ goal, wordLimit, levelId: _levelId, levelConfig }: WordBudgetProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > wordLimit
  const isSubmitDisabled = isOverLimit || isLoading || prompt.trim() === ''

  useEffect(() => {
    if (result === null) return

    const target = result.score
    const duration = 1000
    const steps = 40
    const increment = target / steps
    const intervalMs = duration / steps
    let current = 0

    if (animationRef.current) clearInterval(animationRef.current)

    animationRef.current = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayScore(target)
        if (animationRef.current) clearInterval(animationRef.current)
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

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt,
          level_config: levelConfig,
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
  }

  const scoreColor =
    displayScore >= 80 ? '#E8FF47' : displayScore >= 50 ? '#facc15' : '#f87171'

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#1a1a2e' }}>
      <div
        className="w-full max-w-xl rounded-2xl p-8 flex flex-col gap-6"
        style={{ backgroundColor: '#12122a', border: '1px solid #2a2a4a' }}
      >
        {/* Goal */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#E8FF47' }}>
            Goal
          </p>
          <p className="text-white text-base leading-relaxed">{goal}</p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#2a2a4a' }} />

        {/* Textarea + word counter */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E8FF47' }}>
            Your Prompt
          </label>
          <textarea
            className="w-full rounded-xl p-4 text-sm text-white resize-none outline-none transition-all duration-200"
            style={{
              backgroundColor: '#1a1a2e',
              border: `1.5px solid ${isOverLimit ? '#f87171' : '#2a2a4a'}`,
              minHeight: '140px',
              caretColor: '#E8FF47',
            }}
            placeholder="Write your prompt here…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading || result !== null}
            onFocus={(e) => {
              if (!isOverLimit) e.target.style.borderColor = '#E8FF47'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isOverLimit ? '#f87171' : '#2a2a4a'
            }}
          />

          {/* Word counter */}
          <div className="flex justify-end">
            <span
              className="text-xs font-mono tabular-nums transition-colors duration-200"
              style={{ color: isOverLimit ? '#f87171' : '#6b7280' }}
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
            className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide transition-all duration-200"
            style={{
              backgroundColor: isSubmitDisabled ? '#2a2a4a' : '#E8FF47',
              color: isSubmitDisabled ? '#4a4a6a' : '#1a1a2e',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
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
          <p className="text-sm text-center rounded-xl py-3 px-4" style={{ backgroundColor: '#2d1515', color: '#f87171' }}>
            {error}
          </p>
        )}

        {/* Result */}
        {result !== null && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-500">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-1 py-4">
              <span
                className="text-7xl font-black tabular-nums leading-none transition-colors duration-300"
                style={{ color: scoreColor }}
              >
                {displayScore}
              </span>
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>
                out of 100
              </span>
              <span className="text-xs mt-1" style={{ color: '#E8FF47' }}>
                +{result.xp_earned} XP
              </span>
            </div>

            {/* Feedback */}
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#E8FF47' }}>
                Feedback
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.feedback}</p>
            </div>

            {/* Try again */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl py-3 px-6 font-semibold text-sm tracking-wide transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                border: '1.5px solid #E8FF47',
                color: '#E8FF47',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E8FF47'
                e.currentTarget.style.color = '#1a1a2e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#E8FF47'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
