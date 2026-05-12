'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Phase = 'intro' | 'playing' | 'scored'
type Category = 'role' | 'task' | 'context' | 'constraint' | 'format' | 'tone'

interface Piece {
  id: string
  text: string
  category: Category
}

interface DragState {
  piece: Piece
  fromType: 'tray' | 'board'
  fromIndex: number
  ghostX: number
  ghostY: number
}

interface ScoreResult {
  total: number
  multiplier: number
  breakdown: { label: string; points: number }[]
}

const CAT: Record<Category, { color: string; label: string }> = {
  role:       { color: '#60A5FA', label: 'Role' },
  task:       { color: '#B87333', label: 'Task' },
  context:    { color: '#A78BFA', label: 'Context' },
  constraint: { color: '#F472B6', label: 'Constraint' },
  format:     { color: '#4ADE80', label: 'Format' },
  tone:       { color: '#FBBF24', label: 'Tone' },
}

const ALL_CATS = Object.entries(CAT) as [Category, { color: string; label: string }][]

const PIECES: Piece[] = [
  { id: 'r1',  text: 'You are a',                   category: 'role' },
  { id: 'r2',  text: 'customer service rep',         category: 'role' },
  { id: 't1',  text: 'Write',                        category: 'task' },
  { id: 't2',  text: 'an apology email',             category: 'task' },
  { id: 'c1',  text: 'about a shipping delay',       category: 'context' },
  { id: 'c2',  text: 'for a premium customer',       category: 'context' },
  { id: 'cn1', text: 'Keep it under 100 words',      category: 'constraint' },
  { id: 'cn2', text: 'Include a discount offer',     category: 'constraint' },
  { id: 'f1',  text: 'Use bullet points',            category: 'format' },
  { id: 'tn1', text: 'in a warm, professional tone', category: 'tone' },
  { id: 't3',  text: 'Translate to Spanish',         category: 'task' },
  { id: 'f2',  text: 'as a table',                   category: 'format' },
]

const LEVEL = {
  title: 'Customer Email',
  mission: 'Write a polite customer service email explaining a shipping delay',
  maxSlots: 6,
  totalSlots: 8,
}

const COPPER = '#B87333'
const BG     = '#0A0A0F'
const CARD   = '#12121A'
const SURF   = '#1A1A24'

function calcScore(slots: (Piece | null)[]): ScoreResult {
  const placed = slots.filter(Boolean) as Piece[]
  if (!placed.length) return { total: 0, multiplier: 1, breakdown: [] }

  const bd: ScoreResult['breakdown'] = []
  const base = placed.length * 100
  bd.push({ label: `${placed.length} piece${placed.length !== 1 ? 's' : ''} placed`, points: base })

  const cats = new Set(placed.map(p => p.category))
  let mul = 1
  if (cats.size >= 5) mul = 4
  else if (cats.size === 4) mul = 3
  else if (cats.size === 3) mul = 2

  let syn = 0
  if (cats.has('role') && cats.has('task'))         { syn += 150; bd.push({ label: 'Role + Task synergy',             points: 150 }) }
  if (cats.has('constraint') && cats.has('format')) { syn += 100; bd.push({ label: 'Constraint + Format synergy',     points: 100 }) }
  if (cats.has('context'))                          { syn += 75;  bd.push({ label: 'Context bonus',                   points: 75  }) }
  if (cats.has('tone'))                             { syn += 50;  bd.push({ label: 'Tone bonus',                      points: 50  }) }
  if (mul > 1) bd.push({ label: `${mul}× combo multiplier`, points: (base + syn) * (mul - 1) })

  return { total: (base + syn) * mul, multiplier: mul, breakdown: bd }
}

function PieceChip({ piece }: { piece: Piece }) {
  const c = CAT[piece.category]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 12px', borderRadius: 8,
      background: c.color + '18',
      border: `1.5px solid ${c.color}55`,
      fontSize: 13, fontFamily: "'Space Mono', 'Courier New', monospace",
      color: '#E8E8F0', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: c.color,
        flexShrink: 0, boxShadow: `0 0 5px ${c.color}`,
        display: 'inline-block',
      }} />
      {piece.text}
    </div>
  )
}

export default function PromptBuilderPage() {
  const [phase, setPhase]   = useState<Phase>('intro')
  const [slots, setSlots]   = useState<(Piece | null)[]>(Array(LEVEL.totalSlots).fill(null))
  const [tray, setTray]     = useState<(Piece | null)[]>([...PIECES])
  const [drag, setDrag]     = useState<DragState | null>(null)
  const [dropTgt, setDropTgt] = useState<{ type: 'board' | 'tray'; index: number } | null>(null)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; angle: number }[]>([])
  const [shaking, setShaking]   = useState(false)
  const [comboText, setComboText] = useState<string | null>(null)
  const [landed, setLanded]     = useState<Set<number>>(new Set())
  const [result, setResult]     = useState<ScoreResult | null>(null)

  const pid    = useRef(0)
  const slotsR = useRef(slots)
  const trayR  = useRef(tray)
  useEffect(() => { slotsR.current = slots }, [slots])
  useEffect(() => { trayR.current  = tray  }, [tray])

  // Global pointer listeners during a drag
  useEffect(() => {
    if (!drag) return

    let local: { type: 'board' | 'tray'; index: number } | null = null

    function burst(x: number, y: number, color: string) {
      const np = Array.from({ length: 10 }, (_, i) => ({
        id: ++pid.current, x, y, color, angle: (i / 10) * 360,
      }))
      setParticles(p => [...p, ...np])
      setTimeout(() => setParticles(p => p.filter(pt => !np.some(n => n.id === pt.id))), 700)
    }

    function onMove(e: PointerEvent) {
      setDrag(d => d ? { ...d, ghostX: e.clientX, ghostY: e.clientY } : null)
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const sEl = el?.closest('[data-slot]') as HTMLElement | null
      const tEl = el?.closest('[data-tray]') as HTMLElement | null
      if (sEl?.dataset.slot != null) {
        local = { type: 'board', index: +sEl.dataset.slot }
      } else if (tEl?.dataset.tray != null) {
        local = { type: 'tray', index: +tEl.dataset.tray }
      } else {
        local = null
      }
      setDropTgt(local)
    }

    function onUp(e: PointerEvent) {
      const dt = local
      const dr = drag
      if (dt && dr) {
        const { piece, fromType, fromIndex } = dr
        const ns = [...slotsR.current]
        const nt = [...trayR.current]

        if (dt.type === 'board' && dt.index < LEVEL.maxSlots) {
          const displaced = ns[dt.index]
          if (fromType === 'tray') {
            nt[fromIndex] = displaced  // return displaced piece to tray slot (or null)
            ns[dt.index] = piece
          } else {
            ns[fromIndex] = displaced
            ns[dt.index] = piece
          }
          setSlots([...ns])
          setTray([...nt])

          burst(e.clientX, e.clientY, CAT[piece.category].color)

          const idx = dt.index
          setLanded(prev => { const n = new Set(prev); n.add(idx); return n })
          setTimeout(() => setLanded(prev => { const n = new Set(prev); n.delete(idx); return n }), 500)

          const sc = calcScore(ns)
          if (sc.multiplier >= 3) {
            setComboText(`${sc.multiplier}× COMBO!`)
            setShaking(true)
            setTimeout(() => { setShaking(false); setComboText(null) }, 1300)
          }
        } else if (dt.type === 'tray') {
          if (fromType === 'board') {
            ns[fromIndex] = null
            if (nt[dt.index] === null) {
              nt[dt.index] = piece
            } else {
              const ei = nt.findIndex(p => p === null)
              if (ei >= 0) nt[ei] = piece
            }
            setSlots([...ns])
            setTray([...nt])
          } else if (dt.index !== fromIndex) {
            const tmp = nt[dt.index]; nt[dt.index] = piece; nt[fromIndex] = tmp
            setTray([...nt])
          }
        }
      }
      setDrag(null)
      setDropTgt(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag])

  function startDrag(e: React.PointerEvent, piece: Piece, fromType: 'tray' | 'board', idx: number) {
    e.preventDefault()
    setDrag({ piece, fromType, fromIndex: idx, ghostX: e.clientX, ghostY: e.clientY })
  }

  function submit() { setResult(calcScore(slots)); setPhase('scored') }

  function retry() {
    setSlots(Array(LEVEL.totalSlots).fill(null))
    setTray([...PIECES])
    setResult(null)
    setPhase('playing')
  }

  const placed  = slots.slice(0, LEVEL.maxSlots).filter(Boolean) as Piece[]
  const preview = placed.map(p => p.text).join(' ')
  const liveScore = calcScore(slots)

  return (
    <main style={{ background: BG, minHeight: '100dvh', color: '#E8E8F0', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');

        @keyframes slot-pulse {
          0%,100% { border-color: #2A2A38; box-shadow: 0 0 0 0 rgba(184,115,51,0.1); }
          50%     { border-color: #3A3A52; box-shadow: 0 0 0 4px rgba(184,115,51,0.06); }
        }
        @keyframes land {
          0%   { transform: scale(1.14); }
          55%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes particle-burst {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx),var(--dy)) scale(0); opacity: 0; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-7px) rotate(-0.8deg); }
          30%     { transform: translateX(7px) rotate(0.8deg); }
          50%     { transform: translateX(-4px); }
          70%     { transform: translateX(4px); }
          85%     { transform: translateX(-2px); }
        }
        @keyframes combo-pop {
          0%   { transform: scale(0.4) translateY(24px); opacity: 0; }
          45%  { transform: scale(1.18) translateY(-6px); opacity: 1; }
          70%  { transform: scale(0.94) translateY(0); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes score-slide {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes score-appear {
          from { transform: scale(0.75); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .slot-empty  { animation: slot-pulse 2.2s ease-in-out infinite; }
        .just-landed { animation: land 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .game-shake  { animation: shake 0.55s ease; }
        .score-item  { animation: score-slide 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .score-total { animation: score-appear 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s both; }
      `}</style>

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.x, top: p.y,
            width: 7, height: 7, borderRadius: '50%',
            background: p.color,
            pointerEvents: 'none', zIndex: 500,
            '--dx': `${Math.cos((p.angle * Math.PI) / 180) * 64}px`,
            '--dy': `${Math.sin((p.angle * Math.PI) / 180) * 64}px`,
            animation: 'particle-burst 0.65s ease-out forwards',
          } as React.CSSProperties}
        />
      ))}

      {/* Combo overlay */}
      {comboText && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 400,
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 52, fontWeight: 900,
            color: COPPER,
            textShadow: `0 0 32px ${COPPER}, 0 0 64px ${COPPER}88`,
            letterSpacing: 2,
            animation: 'combo-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            {comboText}
          </span>
        </div>
      )}

      {/* Drag ghost — pointer-events:none makes it transparent to elementFromPoint */}
      {drag && (
        <div style={{
          position: 'fixed',
          left: drag.ghostX - 80,
          top: drag.ghostY - 20,
          pointerEvents: 'none', zIndex: 1000,
          transform: 'rotate(5deg) scale(1.07)',
          filter: `drop-shadow(0 0 14px ${CAT[drag.piece.category].color}cc) drop-shadow(0 4px 10px rgba(0,0,0,0.6))`,
        }}>
          <PieceChip piece={drag.piece} />
        </div>
      )}

      {/* ─── CONTENT ─────────────────────────────────────── */}
      <div
        className={shaking ? 'game-shake' : ''}
        style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}
      >

        {/* ══ INTRO ══════════════════════════════════════════ */}
        {phase === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 28, paddingTop: 40, paddingBottom: 40 }}>
            <Link href="/dashboard" style={{
              alignSelf: 'flex-start',
              color: '#555', fontSize: 12, fontFamily: "'Space Mono', monospace",
              textDecoration: 'none',
            }}>
              ← Dashboard
            </Link>

            {/* Heading */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 700,
                letterSpacing: 5, color: COPPER, textTransform: 'uppercase', marginBottom: 14,
                textShadow: `0 0 10px ${COPPER}88`,
              }}>
                Block Blast Mode
              </div>
              <h1 style={{
                fontFamily: "'Orbitron', monospace", fontSize: 40, fontWeight: 900, lineHeight: 1.08,
                background: `linear-gradient(135deg, #FFFFFF 0%, ${COPPER} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: 12,
              }}>
                PROMPT<br />BUILDER
              </h1>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#666', lineHeight: 1.7, margin: 0 }}>
                Drag & drop fragments to assemble<br />the perfect AI prompt
              </p>
            </div>

            {/* Level card */}
            <div style={{ width: '100%', background: CARD, borderRadius: 16, padding: '18px 20px', border: '1px solid #1E1E2E' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 10 }}>LEVEL 1 · CUSTOMER EMAIL</div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0 }}>
                {LEVEL.mission}
              </p>
            </div>

            {/* Category legend */}
            <div style={{ width: '100%', background: CARD, borderRadius: 16, padding: '18px 20px', border: '1px solid #1E1E2E' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 14, textAlign: 'center' }}>PIECE CATEGORIES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 8px' }}>
                {ALL_CATS.map(([key, cfg]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />
                    <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#999' }}>{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring cheat-sheet */}
            <div style={{ width: '100%', background: CARD, borderRadius: 16, padding: '18px 20px', border: '1px solid #1E1E2E' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 4, color: '#444', marginBottom: 14, textAlign: 'center' }}>SCORING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['100 pts', 'per piece placed'],
                  ['3 categories', '2× multiplier'],
                  ['4 categories', '3× multiplier'],
                  ['5+ categories', '4× multiplier'],
                  ['+150 pts', 'Role + Task synergy'],
                  ['+100 pts', 'Constraint + Format synergy'],
                  ['+75 pts', 'Context bonus'],
                  ['+50 pts', 'Tone bonus'],
                ].map(([key, val], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: COPPER }}>{key}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#555' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Play button */}
            <button
              onClick={() => setPhase('playing')}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, #C9874A 0%, ${COPPER} 45%, #8B5A2B 100%)`,
                boxShadow: `0 0 28px ${COPPER}60, 0 6px 18px rgba(0,0,0,0.55)`,
                fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 900, letterSpacing: 4,
                color: '#FFF5EE', textTransform: 'uppercase',
              }}
            >
              PLAY
            </button>
          </div>
        )}

        {/* ══ GAME BOARD ═════════════════════════════════════ */}
        {phase === 'playing' && (
          <div style={{ paddingTop: 16 }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 18 }}>
              <Link href="/dashboard" style={{ color: '#555', fontSize: 12, fontFamily: "'Space Mono', monospace", textDecoration: 'none' }}>
                ← back
              </Link>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 4, color: '#444' }}>
                LEVEL 1
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 700, color: COPPER, textShadow: `0 0 10px ${COPPER}88` }}>
                {liveScore.total.toLocaleString()}
              </span>
            </div>

            {/* Mission */}
            <div style={{ background: CARD, borderRadius: 14, padding: '14px 18px', marginBottom: 16, border: '1px solid #1E1E2E' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 4, color: '#444', marginBottom: 7 }}>MISSION</div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0 }}>
                {LEVEL.mission}
              </p>
            </div>

            {/* Board: 2-col, 4-row grid (8 slots, 6 active) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {Array.from({ length: LEVEL.totalSlots }, (_, i) => {
                const piece       = slots[i]
                const isActive    = i < LEVEL.maxSlots
                const isOver      = dropTgt?.type === 'board' && dropTgt.index === i
                const isLanded    = landed.has(i)
                const isDragSrc   = drag?.fromType === 'board' && drag.fromIndex === i

                if (!isActive) {
                  return (
                    <div key={i} style={{
                      height: 66, borderRadius: 10,
                      background: '#0D0D12', border: '1.5px dashed #1A1A22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.3,
                    }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: '#2A2A38', letterSpacing: 2 }}>LOCKED</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={i}
                    data-slot={i}
                    className={piece && !isDragSrc ? (isLanded ? 'just-landed' : '') : 'slot-empty'}
                    onPointerDown={piece && !drag ? e => startDrag(e, piece, 'board', i) : undefined}
                    style={{
                      height: 66, borderRadius: 10, cursor: piece && !isDragSrc ? 'grab' : 'default',
                      background: piece && !isDragSrc
                        ? CAT[piece.category].color + '14'
                        : isOver ? '#1C1C2A' : SURF,
                      border: `1.5px solid ${
                        piece && !isDragSrc ? CAT[piece.category].color + '50'
                        : isOver ? COPPER + '80'
                        : '#2A2A38'
                      }`,
                      display: 'flex', alignItems: 'center', padding: '0 11px',
                      opacity: isDragSrc ? 0.25 : 1,
                      transition: 'border-color 0.12s, background 0.12s',
                      touchAction: 'none',
                    }}
                  >
                    {piece && !isDragSrc ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', overflow: 'hidden' }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', background: CAT[piece.category].color,
                          flexShrink: 0, boxShadow: `0 0 5px ${CAT[piece.category].color}`,
                        }} />
                        <span style={{
                          fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#D4D4E8',
                          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {piece.text}
                        </span>
                        <span style={{
                          fontSize: 8, fontFamily: "'Orbitron', monospace",
                          color: CAT[piece.category].color + '90', flexShrink: 0, letterSpacing: 1,
                        }}>
                          {CAT[piece.category].label.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                    ) : !piece ? (
                      <div style={{ width: '100%', textAlign: 'center', fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#2A2A3A' }}>
                        {i + 1}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Prompt preview */}
            <div style={{ background: CARD, borderRadius: 12, padding: '12px 16px', marginBottom: 12, border: '1px solid #1E1E2E', minHeight: 58 }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 4, color: '#444', marginBottom: 8 }}>PROMPT PREVIEW</div>
              {preview ? (
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#BBBBCC', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{preview}&rdquo;
                </p>
              ) : (
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#333', margin: 0 }}>
                  Drop pieces above to assemble your prompt…
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={placed.length === 0}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                cursor: placed.length > 0 ? 'pointer' : 'not-allowed',
                background: placed.length > 0
                  ? `linear-gradient(135deg, #C9874A 0%, ${COPPER} 45%, #8B5A2B 100%)`
                  : '#14141E',
                boxShadow: placed.length > 0 ? `0 0 22px ${COPPER}50, 0 4px 14px rgba(0,0,0,0.45)` : 'none',
                fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3,
                color: placed.length > 0 ? '#FFF5EE' : '#2A2A3A',
                marginBottom: 20, transition: 'all 0.2s',
              }}
            >
              {placed.length > 0 ? `SUBMIT  ${placed.length} / ${LEVEL.maxSlots}` : 'PLACE PIECES TO SUBMIT'}
            </button>

            {/* Fragment tray */}
            <div style={{ background: CARD, borderRadius: 16, padding: '16px', border: '1px solid #1E1E2E' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 4, color: '#444', marginBottom: 14, textAlign: 'center' }}>
                FRAGMENT TRAY · DRAG TO BOARD
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tray.map((piece, i) => {
                  const isSrc  = drag?.fromType === 'tray' && drag.fromIndex === i
                  const isOver = dropTgt?.type === 'tray' && dropTgt.index === i && piece !== null
                  return (
                    <div
                      key={piece?.id ?? `empty-${i}`}
                      data-tray={i}
                      onPointerDown={piece && !drag ? e => startDrag(e, piece, 'tray', i) : undefined}
                      style={{
                        opacity: piece ? (isSrc ? 0.2 : 1) : 0,
                        pointerEvents: piece && !isSrc ? 'auto' : 'none',
                        touchAction: 'none', cursor: piece ? 'grab' : 'default',
                        transform: isOver ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.1s',
                        visibility: piece ? 'visible' : 'hidden',
                      }}
                    >
                      {piece && <PieceChip piece={piece} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ SCORE SCREEN ═══════════════════════════════════ */}
        {phase === 'scored' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, paddingBottom: 40, gap: 24 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: 5, color: '#444' }}>SCORE BREAKDOWN</div>

            {/* Score ring */}
            <div className="score-total" style={{
              width: 128, height: 128, borderRadius: '50%',
              background: `radial-gradient(circle, ${COPPER}20 0%, transparent 68%)`,
              border: `3px solid ${COPPER}`,
              boxShadow: `0 0 40px ${COPPER}55, 0 0 80px ${COPPER}22`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 30, fontWeight: 900, color: COPPER, lineHeight: 1 }}>
                {result.total.toLocaleString()}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#555', marginTop: 4 }}>pts</div>
            </div>

            {result.multiplier > 1 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 24,
                background: COPPER + '18', border: `1.5px solid ${COPPER}44`,
              }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 900, color: COPPER }}>
                  {result.multiplier}× COMBO
                </span>
              </div>
            )}

            {/* Line items */}
            <div style={{ width: '100%', background: CARD, borderRadius: 16, padding: '20px', border: '1px solid #1E1E2E', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {result.breakdown.map((item, i) => (
                <div
                  key={i}
                  className="score-item"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animationDelay: `${i * 0.09}s`,
                  }}
                >
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#777' }}>{item.label}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: COPPER, fontWeight: 700 }}>
                    +{item.points.toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{ height: 1, background: '#1E1E2A', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: '#888', letterSpacing: 2 }}>TOTAL</span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, color: COPPER, fontWeight: 900 }}>
                  {result.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Assembled prompt */}
            {preview && (
              <div style={{ width: '100%', background: CARD, borderRadius: 14, padding: '16px', border: '1px solid #1E1E2E' }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 4, color: '#444', marginBottom: 8 }}>YOUR PROMPT</div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#CCCCDD', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{preview}&rdquo;
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <button
                onClick={retry}
                style={{
                  padding: '15px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, #C9874A 0%, ${COPPER} 45%, #8B5A2B 100%)`,
                  boxShadow: `0 0 24px ${COPPER}55, 0 4px 14px rgba(0,0,0,0.45)`,
                  fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700, letterSpacing: 3,
                  color: '#FFF5EE',
                }}
              >
                RETRY LEVEL
              </button>
              <button
                onClick={retry}
                style={{
                  padding: '14px 0', borderRadius: 12, border: `1.5px solid #2A2A3A`, cursor: 'pointer',
                  background: 'transparent',
                  fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3,
                  color: '#555',
                }}
              >
                NEXT LEVEL
              </button>
              <Link
                href="/dashboard"
                style={{
                  display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12,
                  border: '1px solid #1E1E2A',
                  fontFamily: "'Space Mono', monospace", fontSize: 12,
                  color: '#444', textDecoration: 'none',
                }}
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
