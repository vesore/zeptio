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

const FORMATS = ['Bullet Points', 'Paragraph', 'Table'] as const
type Format = typeof FORMATS[number]

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

const FORMAT_EXAMPLES: Record<Format, React.ReactNode> = {
  'Bullet Points': (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-mono" style={{ color: '#666666' }}>• First key point</p>
      <p className="text-xs font-mono" style={{ color: '#666666' }}>• Second key point</p>
      <p className="text-xs font-mono" style={{ color: '#666666' }}>• Third key point</p>
    </div>
  ),
  'Paragraph': (
    <p className="text-xs" style={{ color: '#666666' }}>
      A flowing block of text that explains the topic in connected sentences, building on each idea naturally...
    </p>
  ),
  'Table': (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono" style={{ color: '#666666', borderCollapse: 'collapse' }}>
        <thead><tr><th className="text-left pr-4 pb-1" style={{ color: 'rgba(74,144,226,0.5)' }}>Column A</th><th className="text-left pb-1" style={{ color: 'rgba(74,144,226,0.5)' }}>Column B</th></tr></thead>
        <tbody><tr><td className="pr-4">Row 1 A</td><td>Row 1 B</td></tr><tr><td className="pr-4">Row 2 A</td><td>Row 2 B</td></tr></tbody>
      </table>
    </div>
  ),
}

export default function FormatMaster({
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
}: Props) {
  const [selectedFormat, setSelectedFormat]   = useState<Format | null>(null)
  const [prompt, setPrompt]                   = useState('')
  const [isLoading, setIsLoading]             = useState(false)
  const [result, setResult]                   = useState<ScoreResult | null>(null)
  const [displayScore, setDisplayScore]       = useState(0)
  const [scoreLanded, setScoreLanded]         = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [reflection, setReflection]           = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [error, setError]                     = useState<string | null>(null)
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
    if (!selectedFormat || !prompt.trim() || isLoading) return
    setIsLoading(true); setError(null); setResult(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)

    try {
      const contextConfig = {
        ...levelConfig,
        challenge: `${levelConfig.challenge}\n\nRequired output format: ${selectedFormat}`,
        criteria: [...levelConfig.criteria, `The prompt must explicitly request ${selectedFormat.toLowerCase()} format`],
      }
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: prompt, level_config: contextConfig, level_id: levelConfig.level }),
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
    setSelectedFormat(null); setPrompt(''); setResult(null); setError(null)
    setDisplayScore(0); setScoreLanded(false); setFeedbackVisible(false)
    setShowCelebration(false); setReflection(''); setReflectionSaved(false)
  }

  const isSubmitDisabled = !selectedFormat || !prompt.trim() || isLoading

  const scoreColor =
    displayScore >= 80 ? '#1A1A1A' : displayScore >= 60 ? '#00FF88' : displayScore >= 40 ? '#B87333' : '#E24A4A'

  const robotExpression: RobotExpression =
    isLoading ? 'loading'
    : result !== null && !scoreLanded ? 'loading'
    : result !== null && result.score === 100 ? 'perfect'
    : result !== null && result.score >= 80 ? 'excited'
    : result !== null && result.score >= 60 ? 'happy'
    : result !== null && result.score >= 40 ? 'neutral'
    : result !== null ? 'sad'
    : prompt.trim() ? 'typing'
    : 'idle'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="sr-only" aria-live="polite">{scoreLanded && result ? `Score: ${result.score}. ${result.feedback}` : ''}</div>

      <div style={{ position: 'fixed', right: '1rem', bottom: '1.5rem', zIndex: 40 }} aria-hidden="true">
        <GameRobot config={robotConfig} expression={robotExpression} size={80} showBubble />
      </div>

      {showCelebration && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 60, pointerEvents: 'none', animation: 'levelComplete 3.2s ease-in-out forwards', whiteSpace: 'nowrap' }} aria-hidden="true">
          <span style={{ fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.12em', color: '#4A90E2', textShadow: '0 0 24px rgba(74,144,226,0.9)' }}>LEVEL COMPLETE!</span>
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
            <span className="text-xs font-mono font-semibold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(226,160,74,0.1)', color: '#E2A04A', border: '1px solid rgba(226,160,74,0.2)' }}>
              Format Master
            </span>
          </div>

          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: '#4A90E2' }}>Content Request</p>
            <p className="text-base sm:text-lg font-bold leading-relaxed" style={{ color: '#1A1A1A' }}>{levelConfig.challenge}</p>
          </div>

          <div style={{ height: '1px', background: '#F0F0F0' }} />

          {result === null && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#4A90E2' }}>Choose a Format</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FORMATS.map((f) => {
                  const isSelected = selectedFormat === f
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedFormat(f)}
                      className="rounded-2xl p-4 text-left transition-all duration-200 flex flex-col gap-3"
                      style={{ background: isSelected ? 'rgba(226,160,74,0.12)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isSelected ? '#B87333' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}
                      aria-pressed={isSelected}
                    >
                      <span className="text-sm font-bold" style={{ color: isSelected ? '#B87333' : '#E8E8E8' }}>{f}</span>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        {FORMAT_EXAMPLES[f]}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {result === null && selectedFormat && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#4A90E2' }}>
                Your Prompt <span style={{ color: 'rgba(74,144,226,0.4)' }}>— must request {selectedFormat}</span>
              </label>
              <textarea
                className="w-full rounded-2xl p-4 text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] placeholder:text-black/25"
                style={{ background: '#FAFAFA', border: '1.5px solid #E8E8E8', minHeight: '120px', caretColor: '#4A90E2', color: '#4A90E2', fontWeight: 700 }}
                placeholder={`Write a prompt that explicitly asks for ${selectedFormat.toLowerCase()}…`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                onFocus={(e) => { e.target.style.borderColor = '#00FF88' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
          )}

          {result === null && (
            <button onClick={handleSubmit} disabled={isSubmitDisabled} className={`w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 btn-primary${!isSubmitDisabled ? ' neon-pulse' : ''}`}>
              {isLoading ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#FFFFFF' }} />Scoring…</span> : !selectedFormat ? 'Pick a format first' : 'Submit'}
            </button>
          )}

          {error && <p role="alert" className="text-sm text-center rounded-2xl py-3 px-4" style={{ background: 'rgba(248,113,113,0.1)', color: '#E24A4A', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

          {result !== null && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-500">
              <div className="flex flex-col items-center gap-2 py-6" aria-hidden="true">
                <span className={`text-7xl sm:text-8xl font-black tabular-nums leading-none transition-colors duration-300 ${scoreLanded ? 'score-glow' : ''}`} style={{ color: scoreColor }}>{displayScore}</span>
                <span className="text-xs uppercase tracking-widest mt-1" style={{ color: '#888888' }}>out of 100</span>
                {scoreLanded && <span className="text-base font-bold mt-1 animate-in fade-in duration-300" style={{ color: scoreColor }}>{getCongratulatoryMessage(result.score)}</span>}
                {scoreLanded && <span className="rounded-full px-4 py-1.5 text-xs font-bold mt-1 animate-in fade-in duration-300" style={{ background: 'rgba(74,144,226,0.12)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.25)' }}>+{result.xp_earned} XP</span>}
              </div>

              <div className="rounded-3xl p-6 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A90E2' }}>Feedback</p>
                <p className="text-sm leading-relaxed" style={{ color: '#444444' }}>{result.feedback}</p>
              </div>

              <div className="rounded-3xl p-6 flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0, background: 'rgba(226,160,74,0.04)', border: '1px solid rgba(226,160,74,0.15)' }}>
                <label className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#E2A04A' }}>Reflection</label>
                <p className="text-sm" style={{ color: '#666666' }}>When would {selectedFormat?.toLowerCase()} be the wrong choice?</p>
                <div className="flex gap-2 items-start">
                  <textarea className="flex-1 rounded-xl p-3 text-sm resize-none outline-none focus-visible:ring-1 focus-visible:ring-[#B87333]" style={{ background: '#FAFAFA', border: '1px solid rgba(226,160,74,0.2)', color: 'rgba(255,255,255,0.8)', minHeight: '60px', caretColor: '#E2A04A' }} placeholder="Type your reflection…" value={reflection} onChange={(e) => setReflection(e.target.value.slice(0, 100))} disabled={reflectionSaved} />
                  <button onClick={handleSaveReflection} disabled={!reflection.trim() || reflectionSaved} className="shrink-0 rounded-xl px-4 py-3 text-xs font-bold" style={{ background: reflectionSaved ? 'rgba(74,144,226,0.1)' : 'rgba(226,160,74,0.15)', border: `1px solid ${reflectionSaved ? 'rgba(74,144,226,0.3)' : 'rgba(226,160,74,0.3)'}`, color: reflectionSaved ? '#00FF88' : '#E2A04A', cursor: reflectionSaved ? 'default' : 'pointer' }}>
                    {reflectionSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 transition-opacity duration-500" style={{ opacity: feedbackVisible ? 1 : 0 }}>
                {result.score >= 60 && nextLevelUrl ? (
                  <>
                    <Link href={nextLevelUrl} className="w-full py-4 font-bold text-sm tracking-wide text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] btn-primary">Next Level →</Link>
                    <button onClick={handleReset} className="w-full rounded-full py-4 font-bold text-sm" style={{ border: '1.5px solid rgba(74,144,226,0.3)', color: 'rgba(74,144,226,0.5)', cursor: 'pointer' }}>Try Again</button>
                  </>
                ) : (
                  <>
                    {result.score < 60 && <p className="text-xs text-center font-mono" style={{ color: '#999999' }}>Score 60 or higher to advance.</p>}
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
