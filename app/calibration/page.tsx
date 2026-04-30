'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GameRobot, { type RobotExpression } from '@/src/components/game/GameRobot'
import { DEFAULT_ROBOT_CONFIG } from '@/app/profile/_components/RobotSVG'
import { levelCompleteSound, scoreRevealSound } from '@/src/lib/sounds'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'c1' | 'c1result' | 'c2' | 'c2result' | 'c3' | 'results'

interface ChoiceOption { id: 'A' | 'B' | 'C' | 'D'; text: string; flaw: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#4A90E2'

const SHRINK_ORIGINAL =
  'Please write me a very detailed and comprehensive email that I can send to my manager ' +
  'that clearly explains and describes in full detail all the reasons why I would like to ' +
  'formally request taking this Friday off from work.'

const MC_CHOICES: ChoiceOption[] = [
  {
    id: 'A',
    text: 'Write a concise 3-bullet email to my manager requesting Friday off, with a work-coverage plan.',
    flaw: '',
  },
  {
    id: 'B',
    text: 'Write an email to my boss about taking Friday off.',
    flaw: 'Too vague — no structure, no coverage plan, no tone guidance.',
  },
  {
    id: 'C',
    text: 'Can you help me write something to my manager? I need Friday off and want to be professional.',
    flaw: 'Unclear task — conversational framing, no format or context specified.',
  },
  {
    id: 'D',
    text: 'Write a detailed, comprehensive, professionally-worded, thorough email with full justification addressing all potential manager objections while formally requesting the coming Friday off from work.',
    flaw: 'Over-specified filler — verbose without adding useful constraint.',
  },
]

const MC_SCORES: Record<string, number> = { A: 100, B: 30, C: 20, D: 45 }

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  x:        ((i * 47 + 11) % 90) + 5,
  color:    [ACCENT, '#E2A04A', '#4AE27A', '#E24A4A', '#9B4AE2', '#1A1A1A'][i % 6],
  delay:    parseFloat(((i * 0.09) % 0.7).toFixed(2)),
  duration: parseFloat((((i * 0.13) % 0.8) + 0.55).toFixed(2)),
  size:     ((i * 3) % 7) + 5,
  shape:    i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
}))

// ── Score count-up hook ────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean): number {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!active) { setDisplay(0); return }
    const steps = 60
    const step = target / steps
    let cur = 0
    const id = setInterval(() => {
      cur = Math.min(cur + step, target)
      setDisplay(Math.round(cur))
      if (cur >= target) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
  }, [target, active])
  return display
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressDots({ phase }: { phase: Phase }) {
  const stepOf: Record<Phase, number> = { intro: 0, c1: 1, c1result: 1, c2: 2, c2result: 2, c3: 3, results: 3 }
  const step = stepOf[phase] ?? 0
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className="rounded-full transition-all duration-300"
          style={{
            width: n === step ? 20 : 8,
            height: 8,
            background: n <= step ? ACCENT : 'rgba(0,0,0,0.12)',
          }}
        />
      ))}
    </div>
  )
}

function WordCounter({ count, limit }: { count: number; limit: number }) {
  const over = count > limit
  return (
    <span
      className="text-xs font-mono tabular-nums"
      style={{ color: over ? '#E24A4A' : count > limit * 0.85 ? '#E2A04A' : '#999999' }}
    >
      {count}/{limit}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CalibrationPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [choiceRevealed, setChoiceRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const avgScore = scores.length === 3
    ? Math.round(scores.reduce((a, b) => a + b, 0) / 3)
    : 0

  const displayScore = useCountUp(avgScore, phase === 'results')

  const robotExpression = useCallback((): RobotExpression => {
    if (phase === 'intro') return 'idle'
    if (loading) return 'loading'
    if (phase === 'results') {
      if (avgScore >= 80) return 'perfect'
      if (avgScore >= 60) return 'excited'
      if (avgScore >= 40) return 'neutral'
      return 'sad'
    }
    return 'typing'
  }, [phase, loading, avgScore])

  const words1 = countWords(text1)
  const words2 = countWords(text2)

  async function scoreWithAPI(
    challenge: string,
    criteria: string[],
    response: string,
  ): Promise<{ score: number; feedback: string }> {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: response,
        level_config: {
          world: 'clarity',
          level: 0,
          challenge,
          criteria,
          max_xp: 100,
        },
        level_id: 0,
      }),
    })
    if (!res.ok) throw new Error('Scoring failed')
    return res.json()
  }

  async function submitChallenge1() {
    if (words1 === 0 || words1 > 30) return
    setLoading(true)
    setError('')
    try {
      const result = await scoreWithAPI(
        'Explain what artificial intelligence is in 30 words or fewer.',
        [
          'Captures the core concept of AI clearly and accurately',
          'Uses accessible language appropriate for a general audience',
          'Stays within the 30-word limit',
          'Is specific and substantive, not vague or circular',
        ],
        text1,
      )
      scoreRevealSound(result.score)
      setScores(s => [...s, result.score])
      setFeedback(result.feedback)
      setPhase('c1result')
    } catch {
      setError('Scoring failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitChallenge2() {
    if (words2 === 0 || words2 > 10) return
    setLoading(true)
    setError('')
    try {
      const result = await scoreWithAPI(
        `Shrink this prompt to 10 words or fewer while keeping its core meaning: "${SHRINK_ORIGINAL}"`,
        [
          'Stays within 10 words',
          'Preserves the core task (asking AI to draft a time-off request email to a manager)',
          'Remains clear and actionable as a standalone prompt',
          'Eliminates filler without losing essential meaning',
        ],
        text2,
      )
      scoreRevealSound(result.score)
      setScores(s => [...s, result.score])
      setFeedback(result.feedback)
      setPhase('c2result')
    } catch {
      setError('Scoring failed — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function submitChallenge3() {
    if (!selectedChoice) return
    const score = MC_SCORES[selectedChoice] ?? 0
    scoreRevealSound(score)
    setScores(s => [...s, score])
    setChoiceRevealed(true)
  }

  async function finishCalibration(finalScores: number[]) {
    setSaving(true)
    levelCompleteSound()
    try {
      await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: finalScores }),
      })
    } catch {
      // Non-critical — still advance
    } finally {
      setSaving(false)
      setPhase('results')
    }
  }

  function advanceFromC3() {
    finishCalibration([...scores])
  }

  useEffect(() => {
    if (phase === 'c1' || phase === 'c2') {
      textareaRef.current?.focus()
    }
  }, [phase])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-10 overflow-x-hidden"
      style={{ background: '#EFEFEF' }}
    >
      <style>{`
        @keyframes cal-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes robot-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes robot-bounce {
          0%,100% { transform: translateY(0) scale(1); }
          40%     { transform: translateY(-10px) scale(1.05); }
          60%     { transform: translateY(-4px) scale(0.98); }
        }
        @keyframes robot-lean {
          0%,100% { transform: rotate(0deg); }
          50%     { transform: rotate(3deg); }
        }
        .robot-float  { animation: robot-float  2.4s ease-in-out infinite; }
        .robot-bounce { animation: robot-bounce 1.2s ease-in-out infinite; }
        .robot-lean   { animation: robot-lean   1.6s ease-in-out infinite; }
      `}</style>

      {/* Confetti on results */}
      {phase === 'results' && avgScore >= 60 && CONFETTI.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: '-12px',
            left: `${c.x}%`,
            width: c.size,
            height: c.size,
            borderRadius: c.shape,
            background: c.color,
            animation: `cal-confetti-fall ${c.duration}s ${c.delay}s ease-in forwards`,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      ))}

      <div className="w-full max-w-md">

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div>
              <p
                className="text-xs font-mono tracking-[0.2em] uppercase mb-3"
                style={{ color: `${ACCENT}99` }}
              >
                Calibration
              </p>
              <h1
                className="fredoka text-4xl font-black tracking-wide mb-3"
                style={{ color: '#1A1A1A' }}
              >
                Quick skills check
              </h1>
              <p className="text-base" style={{ color: '#666666' }}>
                3 challenges. 2 minutes. We&apos;ll put you right where you belong.
              </p>
            </div>

            <GameRobot
              config={DEFAULT_ROBOT_CONFIG}
              expression="idle"
              size={100}
              showBubble
              worldAccent={ACCENT}
            />

            <button
              onClick={() => setPhase('c1')}
              className="rounded-full px-8 py-3.5 font-bold text-base transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: ACCENT, color: '#FFFFFF' }}
            >
              Let&apos;s Go →
            </button>
          </div>
        )}

        {/* ── CHALLENGE 1 ── */}
        {(phase === 'c1' || phase === 'c1result') && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <ProgressDots phase={phase} />
              <span className="text-xs font-mono" style={{ color: '#999999' }}>Challenge 1 of 3</span>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <p
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: `${ACCENT}99` }}
              >
                WordBudget
              </p>
              <p className="text-base font-bold mb-1" style={{ color: '#1A1A1A' }}>
                Explain what artificial intelligence is.
              </p>
              <p className="text-sm" style={{ color: '#888888' }}>
                Use 30 words or fewer. Be clear and accurate.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-mono" style={{ color: '#999999' }}>Your answer</label>
                <WordCounter count={words1} limit={30} />
              </div>
              <textarea
                ref={textareaRef}
                value={text1}
                onChange={e => setText1(e.target.value)}
                disabled={phase === 'c1result'}
                placeholder="Type your response here…"
                rows={4}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all duration-200"
                style={{
                  background: '#F5F5F5',
                  border: `1.5px solid ${phase === 'c1result' ? 'rgba(0,0,0,0.08)' : ACCENT}`,
                  color: '#1A1A1A',
                  fontFamily: 'var(--font-nunito)',
                }}
              />
            </div>

            {phase === 'c1' && (
              <>
                {error && (
                  <p className="text-xs text-center" style={{ color: '#E24A4A' }}>{error}</p>
                )}
                <button
                  onClick={submitChallenge1}
                  disabled={loading || words1 === 0 || words1 > 30}
                  className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95"
                  style={{
                    background: (loading || words1 === 0 || words1 > 30) ? 'rgba(0,0,0,0.1)' : ACCENT,
                    color: (loading || words1 === 0 || words1 > 30) ? '#AAAAAA' : '#FFFFFF',
                    cursor: (loading || words1 === 0 || words1 > 30) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Scoring…' : 'Submit →'}
                </button>
              </>
            )}

            {phase === 'c1result' && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: '#FFFFFF', border: '1.5px solid #E8E8E8' }}
                >
                  <div
                    className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-black text-xl"
                    style={{ background: `${ACCENT}15`, color: ACCENT }}
                  >
                    {scores[0]}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{feedback}</p>
                </div>
                <button
                  onClick={() => setPhase('c2')}
                  className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95 hover:opacity-90"
                  style={{ background: ACCENT, color: '#FFFFFF' }}
                >
                  Next Challenge →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHALLENGE 2 ── */}
        {(phase === 'c2' || phase === 'c2result') && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <ProgressDots phase={phase} />
              <span className="text-xs font-mono" style={{ color: '#999999' }}>Challenge 2 of 3</span>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <p
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: '#E2A04A99' }}
              >
                TheShrink
              </p>
              <p className="text-base font-bold mb-3" style={{ color: '#1A1A1A' }}>
                Shrink this to 10 words or fewer.
              </p>
              <div
                className="rounded-lg p-3 text-sm leading-relaxed italic"
                style={{
                  background: 'rgba(226,160,74,0.06)',
                  border: '1px solid rgba(226,160,74,0.2)',
                  color: '#666666',
                }}
              >
                &ldquo;{SHRINK_ORIGINAL}&rdquo;
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-mono" style={{ color: '#999999' }}>Your shrunken prompt</label>
                <WordCounter count={words2} limit={10} />
              </div>
              <textarea
                ref={phase === 'c2' ? textareaRef : undefined}
                value={text2}
                onChange={e => setText2(e.target.value)}
                disabled={phase === 'c2result'}
                placeholder="Distill the core idea…"
                rows={3}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all duration-200"
                style={{
                  background: '#F5F5F5',
                  border: `1.5px solid ${phase === 'c2result' ? 'rgba(0,0,0,0.08)' : '#E2A04A'}`,
                  color: '#1A1A1A',
                  fontFamily: 'var(--font-nunito)',
                }}
              />
            </div>

            {phase === 'c2' && (
              <>
                {error && (
                  <p className="text-xs text-center" style={{ color: '#E24A4A' }}>{error}</p>
                )}
                <button
                  onClick={submitChallenge2}
                  disabled={loading || words2 === 0 || words2 > 10}
                  className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95"
                  style={{
                    background: (loading || words2 === 0 || words2 > 10) ? 'rgba(0,0,0,0.1)' : '#E2A04A',
                    color: (loading || words2 === 0 || words2 > 10) ? '#AAAAAA' : '#FFFFFF',
                    cursor: (loading || words2 === 0 || words2 > 10) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Scoring…' : 'Submit →'}
                </button>
              </>
            )}

            {phase === 'c2result' && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: '#FFFFFF', border: '1.5px solid #E8E8E8' }}
                >
                  <div
                    className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-black text-xl"
                    style={{ background: 'rgba(226,160,74,0.12)', color: '#E2A04A' }}
                  >
                    {scores[1]}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{feedback}</p>
                </div>
                <button
                  onClick={() => setPhase('c3')}
                  className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95 hover:opacity-90"
                  style={{ background: '#E2A04A', color: '#FFFFFF' }}
                >
                  Last Challenge →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHALLENGE 3 ── */}
        {phase === 'c3' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <ProgressDots phase={phase} />
              <span className="text-xs font-mono" style={{ color: '#999999' }}>Challenge 3 of 3</span>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <p
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: 'rgba(74,226,122,0.8)' }}
              >
                MultipleChoice
              </p>
              <p className="text-base font-bold" style={{ color: '#1A1A1A' }}>
                Which prompt is strongest for asking an AI to draft a time-off request email?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {MC_CHOICES.map(choice => {
                const isSelected = selectedChoice === choice.id
                const isCorrect = choiceRevealed && choice.id === 'A'
                const isWrong = choiceRevealed && isSelected && choice.id !== 'A'
                return (
                  <button
                    key={choice.id}
                    onClick={() => !choiceRevealed && setSelectedChoice(choice.id)}
                    disabled={choiceRevealed}
                    className="w-full rounded-xl p-4 text-left transition-all duration-200"
                    style={{
                      background: isCorrect
                        ? 'rgba(74,226,122,0.08)'
                        : isWrong
                        ? 'rgba(226,74,74,0.06)'
                        : isSelected
                        ? `${ACCENT}0D`
                        : '#FFFFFF',
                      border: `1.5px solid ${
                        isCorrect
                          ? '#4AE27A'
                          : isWrong
                          ? '#E24A4A'
                          : isSelected
                          ? ACCENT
                          : '#E8E8E8'
                      }`,
                      cursor: choiceRevealed ? 'default' : 'pointer',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                        style={{
                          background: isCorrect
                            ? '#4AE27A'
                            : isWrong
                            ? '#E24A4A'
                            : isSelected
                            ? ACCENT
                            : 'rgba(0,0,0,0.08)',
                          color: (isCorrect || isWrong || isSelected) ? '#FFFFFF' : '#888888',
                        }}
                      >
                        {choice.id}
                      </span>
                      <div>
                        <p className="text-sm leading-relaxed" style={{ color: '#333333' }}>{choice.text}</p>
                        {choiceRevealed && choice.flaw && (
                          <p className="mt-1.5 text-xs" style={{ color: '#E24A4A' }}>↳ {choice.flaw}</p>
                        )}
                        {choiceRevealed && choice.id === 'A' && (
                          <p className="mt-1.5 text-xs font-bold" style={{ color: '#4AE27A' }}>↳ Specific, structured, and actionable.</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {!choiceRevealed ? (
              <button
                onClick={submitChallenge3}
                disabled={!selectedChoice}
                className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95"
                style={{
                  background: selectedChoice ? '#4AE27A' : 'rgba(0,0,0,0.1)',
                  color: selectedChoice ? '#FFFFFF' : '#AAAAAA',
                  cursor: selectedChoice ? 'pointer' : 'not-allowed',
                }}
              >
                Submit →
              </button>
            ) : (
              <button
                onClick={advanceFromC3}
                disabled={saving}
                className="w-full rounded-full py-3.5 font-bold text-base transition-all duration-200 active:scale-95 hover:opacity-90"
                style={{ background: '#4AE27A', color: '#FFFFFF' }}
              >
                {saving ? 'Saving…' : 'See Results →'}
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <div className="flex flex-col items-center gap-8 text-center">
            <div>
              <p
                className="text-xs font-mono tracking-[0.2em] uppercase mb-3"
                style={{ color: `${ACCENT}99` }}
              >
                Calibration Complete
              </p>
              <h2
                className="fredoka text-4xl font-black tracking-wide"
                style={{ color: '#1A1A1A' }}
              >
                {avgScore >= 80 ? 'You\'re advanced.' : avgScore >= 60 ? 'Solid foundation.' : avgScore >= 40 ? 'Good starting point.' : 'Time to level up.'}
              </h2>
            </div>

            {/* Big score */}
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                background: `${ACCENT}12`,
                border: `3px solid ${ACCENT}`,
                boxShadow: `0 0 32px ${ACCENT}30`,
              }}
            >
              <span
                className="font-black tabular-nums"
                style={{ fontSize: '3.5rem', color: ACCENT, lineHeight: 1 }}
              >
                {displayScore}
              </span>
            </div>

            {/* Per-challenge breakdown */}
            <div className="w-full flex gap-3">
              {(['WordBudget', 'TheShrink', 'MultipleChoice'] as const).map((label, i) => (
                <div
                  key={label}
                  className="flex-1 rounded-xl py-3 flex flex-col items-center gap-1"
                  style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}
                >
                  <span className="font-black text-lg" style={{ color: '#1A1A1A' }}>{scores[i] ?? 0}</span>
                  <span className="text-[10px] font-mono" style={{ color: '#BBBBBB' }}>{label}</span>
                </div>
              ))}
            </div>

            <GameRobot
              config={DEFAULT_ROBOT_CONFIG}
              expression={robotExpression()}
              size={100}
              showBubble
              worldAccent={ACCENT}
            />

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full rounded-full py-4 font-bold text-base transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: ACCENT, color: '#FFFFFF' }}
            >
              Enter the Factory →
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
