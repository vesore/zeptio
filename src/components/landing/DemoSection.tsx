'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const CHALLENGE = 'Get an AI to write you a useful project status email.'
const WORD_LIMIT = 30

const ATTEMPTS = [
  {
    prompt: 'Write me a status email.',
    score: 21,
    xp: 21,
    feedback:
      "Too vague — no recipient, project, or context. The AI will guess everything and almost certainly get it wrong.",
  },
  {
    prompt: 'Write a project status email to my manager.',
    score: 49,
    xp: 49,
    feedback:
      "Better! You've added recipient and purpose. Now specify which project and what the actual status is to push past 70.",
  },
  {
    prompt:
      'Write a 5-sentence status email to my manager: API migration is 80% done, blocked on auth, shipping Friday.',
    score: 86,
    xp: 86,
    feedback:
      "Excellent! Format (5 sentences), recipient, project, progress (80%), blocker (auth), and deadline — the AI has everything it needs.",
  },
]

type Phase =
  | 'idle'
  | 'typing'
  | 'pre-submit'
  | 'submitting'
  | 'scoring'
  | 'feedback'
  | 'reading'
  | 'clearing'

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function countWords(text: string) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

// Mimic human typing rhythm
function charDelay(char: string): number {
  const base = 30 + Math.random() * 48
  if (char === '.') return base + 190
  if (char === ',') return base + 110
  if (char === ':') return base + 90
  if (char === ' ' && Math.random() < 0.07) return base + 220 // occasional micro-pause
  return base
}

export default function DemoSection() {
  const [phase,        setPhase]        = useState<Phase>('idle')
  const [attemptIdx,   setAttemptIdx]   = useState(0)
  const [typedText,    setTypedText]    = useState('')
  const [displayScore, setDisplayScore] = useState(0)
  const [barWidth,     setBarWidth]     = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [pulsing,      setPulsing]      = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    function safe(fn: () => void) { if (alive.current) fn() }

    function animateScore(target: number) {
      return new Promise<void>((resolve) => {
        const steps    = 32
        const stepSize = target / steps
        const tick     = 720 / steps
        let current    = 0
        const id = setInterval(() => {
          current += stepSize
          if (current >= target) {
            safe(() => { setDisplayScore(target); setBarWidth(target) })
            clearInterval(id)
            resolve()
          } else {
            const v = Math.round(current)
            safe(() => { setDisplayScore(v); setBarWidth(v) })
          }
        }, tick)
      })
    }

    async function runAttempt(idx: number) {
      // Reset for this attempt
      safe(() => {
        setAttemptIdx(idx)
        setTypedText('')
        setDisplayScore(0)
        setBarWidth(0)
        setShowFeedback(false)
        setPulsing(false)
        setPhase('idle')
      })
      await wait(480)

      // Typing
      safe(() => setPhase('typing'))
      const { prompt } = ATTEMPTS[idx]
      for (let i = 0; i < prompt.length; i++) {
        if (!alive.current) return
        safe(() => setTypedText(prompt.slice(0, i + 1)))
        await wait(charDelay(prompt[i]))
      }

      // Pause before hitting submit (thinking moment)
      safe(() => setPhase('pre-submit'))
      await wait(750)

      // Submitting
      safe(() => setPhase('submitting'))
      await wait(1350)

      // Score counting up
      safe(() => setPhase('scoring'))
      await animateScore(ATTEMPTS[idx].score)

      // Score lands — pulse it
      safe(() => setPulsing(true))
      await wait(420)
      safe(() => setPulsing(false))

      // Feedback fades in
      await wait(200)
      safe(() => { setShowFeedback(true); setPhase('feedback') })

      // Reading time
      await wait(2700)

      // Clear — result fades out first
      safe(() => setPhase('clearing'))
      await wait(350)
      safe(() => { setTypedText(''); setDisplayScore(0); setBarWidth(0); setShowFeedback(false) })
      await wait(300)
    }

    async function loop() {
      while (alive.current) {
        for (let i = 0; i < ATTEMPTS.length; i++) {
          if (!alive.current) return
          await runAttempt(i)
        }
        await wait(900)
      }
    }

    loop()
    return () => { alive.current = false }
  }, [])

  const attempt      = ATTEMPTS[attemptIdx]
  const wordCount    = countWords(typedText)
  const isOverLimit  = wordCount > WORD_LIMIT
  const showCursor   = phase === 'typing' || phase === 'pre-submit'
  const isSubmitting = phase === 'submitting'
  const hasResult    = phase === 'scoring' || phase === 'feedback' || phase === 'reading'
  const submitActive = phase === 'pre-submit'

  const scoreColor =
    displayScore >= 70 ? '#E8FF47'
    : displayScore >= 40 ? '#facc15'
    : '#f87171'

  // Border color of the fake textarea
  const textareaBorder =
    isOverLimit      ? '#f87171'
    : submitActive   ? '#E8FF47'
    : isSubmitting || hasResult ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.12)'

  return (
    <>
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes rec-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes score-land {
          0%   { transform: scale(1); }
          32%  { transform: scale(1.28); }
          62%  { transform: scale(0.91); }
          82%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cursor-blink {
          display: inline-block;
          width: 1.5px;
          height: 1.1em;
          background: #E8FF47;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: cursor-blink 900ms step-end infinite;
        }
        .score-land {
          animation: score-land 440ms cubic-bezier(.36,.07,.19,.97) forwards;
        }
        .fade-up {
          animation: fade-up 380ms ease forwards;
        }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >

        {/* ── Window chrome ─────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: '#0b0b1e', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0">
            {['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'].map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>

          {/* URL bar */}
          <div className="flex-1 flex justify-center">
            <div
              className="rounded px-3 py-0.5 text-xs font-mono"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.01em',
              }}
            >
              zeptio.app/dashboard/clarity
            </div>
          </div>

          {/* REC indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: '#f87171',
                boxShadow: '0 0 5px rgba(248,113,113,0.8)',
                animation: 'rec-pulse 2.2s ease-in-out infinite',
              }}
            />
            <span className="text-xs font-mono" style={{ color: 'rgba(248,113,113,0.65)' }}>REC</span>
          </div>
        </div>

        {/* ── Game interface ─────────────────────────────── */}
        <div className="p-6 flex flex-col gap-4" style={{ backgroundColor: '#12122a' }}>

          {/* Top bar: world label + attempt dots */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" style={{ color: '#E8FF47', fontFamily: 'monospace', fontSize: '12px' }}>◎</span>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#E8FF47' }}>
                Clarity
              </span>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Level 1
              </span>
            </div>

            {/* Attempt progress pills */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {ATTEMPTS.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full"
                  style={{
                    width:           i === attemptIdx ? '18px' : '6px',
                    backgroundColor:
                      i < attemptIdx  ? 'rgba(232,255,71,0.45)'
                      : i === attemptIdx ? '#E8FF47'
                      : 'rgba(255,255,255,0.14)',
                    transition: 'width 350ms ease, background-color 350ms ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Challenge card */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs font-mono tracking-widest uppercase mb-1.5" style={{ color: 'rgba(232,255,71,0.65)' }}>
              Challenge
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {CHALLENGE}
            </p>
          </div>

          {/* Prompt input */}
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Your Prompt
            </p>
            <div
              className="w-full rounded-xl p-4 text-sm leading-relaxed"
              style={{
                backgroundColor: '#1a1a2e',
                border: `1.5px solid ${textareaBorder}`,
                minHeight: '86px',
                color: isSubmitting || hasResult ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
                transition: 'border-color 280ms ease, color 280ms ease',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '13px',
                wordBreak: 'break-word',
              }}
              aria-hidden="true"
            >
              {typedText || (!showCursor && (
                <span style={{ color: 'rgba(255,255,255,0.18)' }}>Write your prompt here…</span>
              ))}
              {showCursor && <span className="cursor-blink" />}
            </div>

            {/* Word counter */}
            <div className="flex justify-end mt-1.5">
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: isOverLimit ? '#f87171' : 'rgba(255,255,255,0.22)' }}
                aria-hidden="true"
              >
                {wordCount} / {WORD_LIMIT} words
              </span>
            </div>
          </div>

          {/* Submit button (display only — no real interaction) */}
          <button
            disabled
            tabIndex={-1}
            aria-hidden="true"
            className="w-full rounded-xl py-3 px-6 text-sm font-semibold tracking-wide"
            style={{
              backgroundColor:
                submitActive   ? '#E8FF47'
                : isSubmitting ? 'rgba(232,255,71,0.1)'
                : 'rgba(255,255,255,0.05)',
              color:
                submitActive   ? '#1a1a2e'
                : isSubmitting ? 'rgba(232,255,71,0.55)'
                : 'rgba(255,255,255,0.18)',
              border:
                isSubmitting ? '1.5px solid rgba(232,255,71,0.25)'
                : submitActive ? 'none'
                : '1.5px solid rgba(255,255,255,0.07)',
              transition: 'background-color 250ms ease, color 250ms ease, border-color 250ms ease',
              cursor: 'default',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'rgba(232,255,71,0.15)',
                    borderTopColor: 'rgba(232,255,71,0.65)',
                  }}
                />
                Scoring…
              </span>
            ) : (
              'Submit'
            )}
          </button>

          {/* Result panel */}
          <div
            style={{
              opacity:    hasResult ? 1 : 0,
              transform:  hasResult ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 380ms ease, transform 380ms ease',
            }}
            aria-hidden="true"
          >
            {/* Score + bar */}
            <div
              className="rounded-xl p-5 mb-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-end gap-2">
                  <span
                    className={`text-5xl font-black tabular-nums leading-none${pulsing ? ' score-land' : ''}`}
                    style={{
                      color: scoreColor,
                      display: 'inline-block',
                      transition: 'color 250ms ease',
                    }}
                  >
                    {displayScore}
                  </span>
                  <span className="mb-1 text-sm font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    / 100
                  </span>
                </div>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: '#E8FF47' }}
                >
                  +{attempt.xp} XP
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: scoreColor,
                    transition: 'width 22ms linear, background-color 250ms ease',
                  }}
                />
              </div>
            </div>

            {/* Feedback */}
            {showFeedback && (
              <div
                className="rounded-xl p-4 fade-up"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p
                  className="text-xs font-mono tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(232,255,71,0.65)' }}
                >
                  Feedback
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {attempt.feedback}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer CTA ─────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: '#0b0b1e', borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Specificity = higher scores. Every time.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-mono font-bold tracking-widest uppercase text-[#1a1a2e] transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b1e]"
            style={{ backgroundColor: '#E8FF47' }}
          >
            Play now →
          </Link>
        </div>
      </div>
    </>
  )
}
