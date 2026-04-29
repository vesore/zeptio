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

const STEP_LABELS = [
  'Set the Context',
  'Define the Format',
  'Add Precision',
] as const

const STEP_DESCRIPTIONS = [
  'Who needs this, what is the goal, and why does it matter?',
  'How should the response be structured — length, format, tone?',
  'What specific details, constraints, or edge cases are critical?',
]

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

export default function ChainPrompting({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
}: Props) {
  const [step, setStep]                   = useState(0) // 0/1/2 = writing, 3 = done
  const [prompts, setPrompts]             = useState(['', '', ''])
  const [stepResults, setStepResults]     = useState<(ScoreResult | null)[]>([null, null, null])
  const [currentStepLoading, setCurrentStepLoading] = useState(false)
  const [finalScore, setFinalScore]       = useState<number | null>(null)
  const [displayScore, setDisplayScore]   = useState(0)
  const [scoreLanded, setScoreLanded]     = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [reflection, setReflection]       = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Score animation when all done
  useEffect(() => {
    if (finalScore === null) return
    const target = finalScore
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
  }, [finalScore])

  useEffect(() => {
    if (scoreLanded && finalScore !== null && finalScore >= 60 && nextLevelUrl) {
      setShowCelebration(true)
      const t = setTimeout(() => setShowCelebration(false), 3200)
      return () => clearTimeout(t)
    }
  }, [scoreLanded, finalScore, nextLevelUrl])

  async function handleStepSubmit() {
    const currentPrompt = prompts[step]
    if (!currentPrompt.trim() || currentStepLoading) return
    setCurrentStepLoading(true); setError(null)

    try {
      const prevContext = step > 0
        ? `\n\nPrevious chain steps:\nStep 1: ${prompts[0]}${step > 1 ? `\nStep 2: ${prompts[1]}` : ''}`
        : ''

      const contextConfig = {
        ...levelConfig,
        challenge: `${levelConfig.challenge}${prevContext}\n\nChain step ${step + 1} of 3 — ${STEP_LABELS[step]}: ${STEP_DESCRIPTIONS[step]}`,
        criteria: [...levelConfig.criteria, `This is chain step ${step + 1}: ${STEP_LABELS[step]}`, STEP_DESCRIPTIONS[step]],
      }

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: currentPrompt, level_config: contextConfig, level_id: levelConfig.level }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
      }

      const stepResult: ScoreResult = await res.json()
      const newResults = [...stepResults]
      newResults[step] = stepResult
      setStepResults(newResults)

      if (step < 2) {
        setStep(step + 1)
      } else {
        // All 3 done — calculate average
        const allResults = newResults.filter(Boolean) as ScoreResult[]
        const avg = Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length)
        const avgXp = Math.round(allResults.reduce((s, r) => s + r.xp_earned, 0) / allResults.length)
        setFinalScore(avg)
        // Use last step's feedback for display; override XP with average
        const syntheticResult: ScoreResult = { score: avg, xp_earned: avgXp, feedback: allResults[allResults.length - 1].feedback }
        setStepResults(newResults) // already set above
        setStep(3)
        // trigger score animation
        setFinalScore(syntheticResult.score)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setCurrentStepLoading(false)
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
    setStep(0); setPrompts(['', '', '']); setStepResults([null, null, null])
    setFinalScore(null); setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false); setError(null)
    if (animationRef.current) clearInterval(animationRef.current)
  }

  const scoreColor =
    displayScore >= 80 ? '#1A1A1A' : displayScore >= 60 ? '#00FF88' : displayScore >= 40 ? '#B87333' : '#E24A4A'

  const robotExpression: RobotExpression =
    currentStepLoading ? 'loading'
    : step === 3 && scoreLanded && finalScore !== null && finalScore === 100 ? 'perfect'
    : step === 3 && scoreLanded && finalScore !== null && finalScore >= 80 ? 'excited'
    : step === 3 && scoreLanded && finalScore !== null && finalScore >= 60 ? 'happy'
    : step === 3 && scoreLanded ? 'neutral'
    : prompts[step]?.trim() ? 'typing'
    : 'idle'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="sr-only" aria-live="polite">{scoreLanded && finalScore !== null ? `Average score: ${finalScore}.` : ''}</div>

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

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(226,160,74,0.1)', color: '#E2A04A', border: '1px solid rgba(226,160,74,0.2)' }}>
              Chain Prompting
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4A90E2' }}>Goal</p>
            <p className="text-base font-bold leading-relaxed" style={{ color: '#1A1A1A' }}>{levelConfig.challenge}</p>
          </div>

          {/* Chain progress */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: i < step ? 'rgba(74,144,226,0.2)' : i === step ? 'rgba(74,144,226,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${i < step ? '#00FF88' : i === step ? 'rgba(74,144,226,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: i < step ? '#00FF88' : i === step ? 'rgba(74,144,226,0.7)' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-mono hidden sm:block" style={{ color: i === step ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}>{STEP_LABELS[i]}</span>
                {i < 2 && <div className="flex-1 h-px mx-1" style={{ background: i < step ? 'rgba(74,144,226,0.3)' : 'rgba(255,255,255,0.08)' }} />}
              </div>
            ))}
          </div>

          {/* Active step */}
          {step < 3 && (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(74,144,226,0.04)', border: '1px solid rgba(74,144,226,0.1)' }}>
                <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#4A90E2' }}>Step {step + 1}: {STEP_LABELS[step]}</p>
                <p className="text-xs mt-1" style={{ color: '#666666' }}>{STEP_DESCRIPTIONS[step]}</p>
              </div>

              {/* Show previous steps as context */}
              {step > 0 && (
                <div className="flex flex-col gap-2">
                  {prompts.slice(0, step).map((p, i) => (
                    <div key={i} className="rounded-xl px-3 py-2 flex gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: '#4A90E2' }}>↳ Step {i + 1}</span>
                      <span className="text-xs" style={{ color: '#888888' }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                className="w-full rounded-2xl p-4 text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] placeholder:text-black/25"
                style={{ background: '#FAFAFA', border: '1.5px solid #E8E8E8', minHeight: '120px', caretColor: '#4A90E2', color: '#4A90E2', fontWeight: 700 }}
                placeholder={`Step ${step + 1}: ${STEP_DESCRIPTIONS[step]}`}
                value={prompts[step]}
                onChange={(e) => {
                  const updated = [...prompts]
                  updated[step] = e.target.value
                  setPrompts(updated)
                }}
                disabled={currentStepLoading}
                onFocus={(e) => { e.target.style.borderColor = '#00FF88' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />

              <button onClick={handleStepSubmit} disabled={!prompts[step].trim() || currentStepLoading} className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 btn-primary${prompts[step].trim() && !currentStepLoading ? ' neon-pulse' : ''}`}>
                {currentStepLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#FFFFFF' }} />
                    Scoring step {step + 1}…
                  </span>
                ) : step < 2 ? `Score Step ${step + 1} → Next` : 'Score Step 3 — Finish'}
              </button>

              {/* Step scores so far */}
              {stepResults.some(Boolean) && (
                <div className="flex gap-2">
                  {stepResults.map((r, i) => r && (
                    <span key={i} className="text-xs font-mono px-3 py-1 rounded-full animate-in fade-in duration-300" style={{ background: 'rgba(74,144,226,0.08)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.15)' }}>
                      Step {i + 1}: {r.score}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4" style={{ background: 'rgba(248,113,113,0.1)', color: '#E24A4A', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

          {/* Final results */}
          {step === 3 && finalScore !== null && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              {/* Per-step breakdown */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A90E2' }}>Chain Scores</p>
                {stepResults.map((r, i) => r && (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-mono" style={{ color: '#999999' }}>Step {i + 1}</span>
                    <span className="flex-1 text-xs" style={{ color: '#888888' }}>{STEP_LABELS[i]}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: r.score >= 60 ? '#00FF88' : '#E2A04A' }}>{r.score}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-2 py-4" aria-hidden="true">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(74,144,226,0.5)' }}>Average Score</p>
                <span className={`fredoka text-7xl sm:text-8xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`} style={{ color: scoreColor }}>{displayScore}</span>
                <span className="text-xs uppercase tracking-widest mt-1" style={{ color: '#888888' }}>out of 100</span>
                {scoreLanded && <span className="text-base font-bold mt-1 animate-in fade-in duration-300" style={{ color: scoreColor }}>{getCongratulatoryMessage(finalScore)}</span>}
                {scoreLanded && <span className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300" style={{ background: 'rgba(74,144,226,0.12)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.25)' }}>+{Math.round(stepResults.filter(Boolean).reduce((s, r) => s + (r?.xp_earned ?? 0), 0) / 3)} XP</span>}
              </div>

              {stepResults[2] && (
                <div className="rounded-3xl p-6 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A90E2' }}>Feedback — Step 3</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#444444' }}>{stepResults[2]?.feedback}</p>
                </div>
              )}

              <div className="rounded-3xl p-6 flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: 'rgba(226,160,74,0.04)', border: '1px solid rgba(226,160,74,0.15)' }}>
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E2A04A' }}>Reflection</label>
                <p className="text-sm" style={{ color: '#666666' }}>How did each step build on the previous one?</p>
                <div className="flex gap-2 items-start">
                  <textarea className="flex-1 rounded-xl p-3 text-sm resize-none outline-none focus-visible:ring-1 focus-visible:ring-[#B87333]" style={{ background: '#FAFAFA', border: '1px solid rgba(226,160,74,0.2)', color: 'rgba(255,255,255,0.8)', minHeight: '60px', caretColor: '#E2A04A' }} placeholder="Type your reflection…" value={reflection} onChange={(e) => setReflection(e.target.value.slice(0, 100))} disabled={reflectionSaved} />
                  <button onClick={handleSaveReflection} disabled={!reflection.trim() || reflectionSaved} className="shrink-0 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: reflectionSaved ? 'rgba(74,144,226,0.1)' : 'rgba(226,160,74,0.15)', border: `1px solid ${reflectionSaved ? 'rgba(74,144,226,0.3)' : 'rgba(226,160,74,0.3)'}`, color: reflectionSaved ? '#00FF88' : '#E2A04A', cursor: reflectionSaved ? 'default' : 'pointer' }}>
                    {reflectionSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0 }}>
                {finalScore >= 60 && nextLevelUrl ? (
                  <>
                    <Link href={nextLevelUrl} className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] btn-primary">Next Level →</Link>
                    <button onClick={handleReset} className="w-full rounded-full py-4 font-bold text-sm" style={{ border: '1.5px solid rgba(74,144,226,0.3)', color: 'rgba(74,144,226,0.5)', cursor: 'pointer' }}>Try Again</button>
                  </>
                ) : (
                  <>
                    {finalScore < 60 && <p className="text-xs text-center font-mono" style={{ color: '#999999' }}>Average 60 or higher to advance.</p>}
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
