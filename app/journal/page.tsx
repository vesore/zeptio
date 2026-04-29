import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { CLARITY_LEVELS } from '@/src/lib/game/clarity-levels'
import { CONSTRAINTS_LEVELS } from '@/src/lib/game/constraints-levels'
import { STRUCTURE_LEVELS } from '@/src/lib/game/structure-levels'
import { DEBUG_LEVELS } from '@/src/lib/game/debug-levels'

// ── Key Rules ──────────────────────────────────────────────────────────────

const KEY_RULES: Record<string, string[]> = {
  clarity: [
    'Clear prompts get clear answers.',
    'Specificity is kindness to the AI.',
    'Know your audience before you write.',
    'Context changes everything.',
    'Details unlock better outputs.',
    'Preparation beats improvisation.',
    'Constraints define the solution.',
    'Precision is a skill, not an accident.',
    'Simple language travels further.',
    'Mastery is clarity under pressure.',
  ],
  constraints: [
    'Limits force creativity.',
    'Less words, more thought.',
    'Removing options reveals solutions.',
    'The best constraint is self-imposed.',
    'Work within the box before thinking outside it.',
    'Efficiency is a form of respect.',
    'Constraints are a superpower.',
    'The tightest prompts get the sharpest answers.',
    'Simplicity is the ultimate sophistication.',
    'True mastery shows in what you leave out.',
  ],
  structure: [
    'Structure is invisible when done right.',
    'Format shapes the answer.',
    'Tables reveal patterns words hide.',
    'Balance creates credibility.',
    'Sentences have architecture.',
    'A clear structure guides clear thinking.',
    'Ranked lists force prioritization.',
    'Data needs a container.',
    'Before and after shows transformation.',
    'The best prompt is a blueprint.',
  ],
  debug: [
    'Vague prompts get vague answers.',
    'Ambiguity is the enemy of output.',
    'Contradictions confuse, clarity converts.',
    'Bias in prompt means bias in output.',
    'Impossible constraints produce impossible results.',
    'Missing context is a silent killer.',
    'Creativity and rules can coexist.',
    'Specificity is the antidote to confusion.',
    'One goal per prompt.',
    'The best debugger is a fresh read.',
  ],
  mastery: [
    'All skills work together or not at all.',
    'Combine clarity and constraints for precision.',
    'Structure your way out of ambiguity.',
    'Debug before you send.',
    'Control every variable.',
    'Consistency is the mark of mastery.',
    'The master prompt has no wasted words.',
    'Real problems need real precision.',
    'Reusability is the highest form of efficiency.',
    'You are the prompt engineer.',
  ],
}

// World config
const WORLDS = [
  { id: 'clarity',     name: 'Clarity',     accent: '#4AE27A', accentRgb: '0,255,136',   levels: CLARITY_LEVELS     },
  { id: 'constraints', name: 'Constraints', accent: '#B87333', accentRgb: '184,115,51',  levels: CONSTRAINTS_LEVELS },
  { id: 'structure',   name: 'Structure',   accent: '#8B8FA8', accentRgb: '139,143,168', levels: STRUCTURE_LEVELS   },
  { id: 'debug',       name: 'Debug',       accent: '#C84B1F', accentRgb: '200,75,31',   levels: DEBUG_LEVELS       },
]

// SVG score graph dimensions
const GRAPH_W = 300
const GRAPH_H = 80
const PAD = { l: 20, r: 12, t: 8, b: 20 }

function buildScoreGraph(
  scores: number[], // best score per level, index 0-9
  accent: string,
  accentRgb: string,
): string {
  const n = scores.length
  if (n === 0) return ''
  const innerW = GRAPH_W - PAD.l - PAD.r
  const innerH = GRAPH_H - PAD.t - PAD.b

  const points = scores.map((s, i) => {
    const x = PAD.l + (i / Math.max(n - 1, 1)) * innerW
    const y = PAD.t + innerH - (s / 100) * innerH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pointsStr = points.join(' ')
  const fillPoints = [
    `${PAD.l},${PAD.t + innerH}`,
    ...points,
    `${PAD.l + innerW},${PAD.t + innerH}`,
  ].join(' ')

  return `
    <svg viewBox="0 0 ${GRAPH_W} ${GRAPH_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:${GRAPH_H}px">
      <!-- Horizontal guide lines -->
      <line x1="${PAD.l}" y1="${PAD.t}" x2="${GRAPH_W - PAD.r}" y2="${PAD.t}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="${PAD.l}" y1="${PAD.t + innerH * 0.5}" x2="${GRAPH_W - PAD.r}" y2="${PAD.t + innerH * 0.5}" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="3,4"/>
      <line x1="${PAD.l}" y1="${PAD.t + innerH}" x2="${GRAPH_W - PAD.r}" y2="${PAD.t + innerH}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <!-- Y labels -->
      <text x="${PAD.l - 4}" y="${PAD.t + 3}" text-anchor="end" font-size="7" font-family="monospace" fill="rgba(255,255,255,0.25)">100</text>
      <text x="${PAD.l - 4}" y="${PAD.t + innerH * 0.5 + 3}" text-anchor="end" font-size="7" font-family="monospace" fill="rgba(255,255,255,0.25)">50</text>
      <text x="${PAD.l - 4}" y="${PAD.t + innerH + 3}" text-anchor="end" font-size="7" font-family="monospace" fill="rgba(255,255,255,0.25)">0</text>
      <!-- Area fill -->
      <polygon points="${fillPoints}" fill="rgba(${accentRgb},0.08)"/>
      <!-- Line -->
      <polyline points="${pointsStr}" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
      <!-- Dots -->
      ${points.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number)
        const s = scores[i]
        const dotColor = s >= 80 ? '#00FF88' : s >= 60 ? accent : '#C84B1F'
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${dotColor}" opacity="${s > 0 ? 1 : 0.2}"/>`
      }).join('')}
    </svg>
  `
}

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all xp_ledger rows (for first vs best)
  const [
    { data: allXpRows },
    { data: reflectionRows },
  ] = await Promise.all([
    supabase
      .from('xp_ledger')
      .select('level_id, level, world, score')
      .eq('user_id', user.id)
      .order('id', { ascending: true }), // oldest first (approximates created_at order)
    supabase
      .from('reflections')
      .select('level_id, world, reflection, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Build per-world data structures
  type LevelAttempt = { first: number; best: number }
  const worldData = new Map<string, Map<number, LevelAttempt>>()
  for (const w of WORLDS) worldData.set(w.id, new Map())

  for (const row of allXpRows ?? []) {
    const worldMap = worldData.get(row.world)
    if (!worldMap) continue
    const existing = worldMap.get(row.level)
    const score = row.score ?? 0
    if (!existing) {
      worldMap.set(row.level, { first: score, best: score })
    } else {
      worldMap.set(row.level, { first: existing.first, best: Math.max(existing.best, score) })
    }
  }

  return (
    <main
      className="min-h-screen w-full max-w-full overflow-x-hidden pb-16"
      style={{ background: '#FFFFFF', color: '#1A1A1A' }}
    >
      <style>{`
        @keyframes glowPulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Holographic grid bg */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,200,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.02) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="pt-6 pb-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-mono transition-colors duration-200 hover:text-[#00FF88]"
            style={{ color: '#999999' }}
          >
            ← Home
          </Link>
          <h1
            className="text-2xl font-black tracking-widest uppercase font-mono"
            style={{
              color: '#E2A04A',
              textShadow: '0 0 16px rgba(226,160,74,0.5)',
            }}
          >
            Journal
          </h1>
          <div style={{ width: '48px' }} />
        </div>

        <div className="w-full h-px mb-8" style={{ background: '#F5F5F5' }} />

        {/* ── Score Graphs ── */}
        <section aria-label="Score graphs by world">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-5" style={{ color: '#888888' }}>
            Progress by World
          </h2>
          <div className="flex flex-col gap-6">
            {WORLDS.map((world) => {
              const levelMap = worldData.get(world.id)!
              const scores = world.levels.map(l => levelMap.get(l.id)?.best ?? 0)
              const hasAny = scores.some(s => s > 0)
              const graphSvg = buildScoreGraph(scores, world.accent, world.accentRgb)

              return (
                <div
                  key={world.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: `rgba(${world.accentRgb},0.04)`,
                    border: `1px solid rgba(${world.accentRgb},0.15)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: world.accent }}>
                      {world.name}
                    </p>
                    {hasAny && (
                      <p className="text-xs font-mono tabular-nums" style={{ color: '#999999' }}>
                        avg {Math.round(scores.filter(s => s > 0).reduce((a, b) => a + b, 0) / scores.filter(s => s > 0).length)}/100
                      </p>
                    )}
                  </div>
                  {hasAny ? (
                    <div
                      aria-label={`${world.name} score graph`}
                      dangerouslySetInnerHTML={{ __html: graphSvg }}
                    />
                  ) : (
                    <p className="text-xs font-mono text-center py-4" style={{ color: '#BBBBBB' }}>
                      No attempts yet
                    </p>
                  )}
                  {/* X-axis labels */}
                  {hasAny && (
                    <div className="flex justify-between mt-1 px-5">
                      {world.levels.map((_, i) => (
                        <span key={i} className="text-[7px] font-mono tabular-nums" style={{ color: '#BBBBBB' }}>
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="w-full h-px my-8" style={{ background: '#F5F5F5' }} />

        {/* ── First vs Best Attempts ── */}
        <section aria-label="First vs best attempts">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-5" style={{ color: '#888888' }}>
            First vs Best Attempt
          </h2>
          <div className="flex flex-col gap-4">
            {WORLDS.map((world) => {
              const levelMap = worldData.get(world.id)!
              const completedLevels = world.levels.filter(l => (levelMap.get(l.id)?.best ?? 0) >= 60)
              if (completedLevels.length === 0) return null

              return (
                <div
                  key={world.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid rgba(${world.accentRgb},0.15)` }}
                >
                  <div
                    className="px-4 py-2 flex items-center"
                    style={{ background: `rgba(${world.accentRgb},0.08)` }}
                  >
                    <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: world.accent }}>
                      {world.name}
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {completedLevels.map((level) => {
                      const attempt = levelMap.get(level.id)!
                      const improved = attempt.best > attempt.first

                      return (
                        <div key={level.id} className="px-4 py-3 flex items-center gap-4">
                          <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: `rgba(${world.accentRgb},0.15)`, border: `1px solid rgba(${world.accentRgb},0.3)` }}>
                            <span className="text-[9px] font-mono font-bold" style={{ color: world.accent }}>
                              {world.levels.indexOf(level) + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono truncate" style={{ color: '#666666' }}>
                              {level.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center">
                              <p className="text-[8px] font-mono" style={{ color: '#999999' }}>First</p>
                              <p className="text-sm font-black tabular-nums" style={{
                                color: attempt.first >= 80 ? '#00FF88' : attempt.first >= 60 ? world.accent : '#C84B1F',
                              }}>
                                {attempt.first}
                              </p>
                            </div>
                            {improved && (
                              <span className="text-xs" style={{ color: '#BBBBBB' }}>→</span>
                            )}
                            {improved && (
                              <div className="text-center">
                                <p className="text-[8px] font-mono" style={{ color: '#999999' }}>Best</p>
                                <p className="text-sm font-black tabular-nums" style={{
                                  color: attempt.best >= 80 ? '#00FF88' : attempt.best >= 60 ? world.accent : '#C84B1F',
                                }}>
                                  {attempt.best}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {WORLDS.every(w => (worldData.get(w.id)?.size ?? 0) === 0) && (
              <p className="text-xs font-mono text-center py-4" style={{ color: '#BBBBBB' }}>
                Complete some levels to see your progress here.
              </p>
            )}
          </div>
        </section>

        <div className="w-full h-px my-8" style={{ background: '#F5F5F5' }} />

        {/* ── Key Rules Collection ── */}
        <section aria-label="Unlocked key rules">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-5" style={{ color: '#888888' }}>
            Key Rules Unlocked
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORLDS.map((world) => {
              const levelMap = worldData.get(world.id)!
              const unlockedRules = world.levels
                .map((l, i) => ({ level: l, index: i, rule: KEY_RULES[world.id]?.[i] }))
                .filter(({ level }) => (levelMap.get(level.id)?.best ?? 0) >= 60)

              return unlockedRules.map(({ index, rule }) => (
                <div
                  key={`${world.id}-${index}`}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: `rgba(${world.accentRgb},0.05)`,
                    border: `1px solid rgba(${world.accentRgb},0.2)`,
                  }}
                >
                  <p className="text-[8px] font-mono uppercase tracking-wider mb-1" style={{ color: `rgba(${world.accentRgb},0.6)` }}>
                    {world.name} · Level {index + 1}
                  </p>
                  <p className="text-sm font-bold leading-snug" style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>
                    &ldquo;{rule}&rdquo;
                  </p>
                </div>
              ))
            })}
          </div>
          {WORLDS.every(w => (worldData.get(w.id)?.size ?? 0) === 0) && (
            <p className="text-xs font-mono text-center py-4" style={{ color: '#BBBBBB' }}>
              Complete levels to unlock key rules.
            </p>
          )}
        </section>

        <div className="w-full h-px my-8" style={{ background: '#F5F5F5' }} />

        {/* ── Reflections ── */}
        <section aria-label="Your reflections">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-5" style={{ color: '#888888' }}>
            Reflections
          </h2>
          {reflectionRows && reflectionRows.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reflectionRows.map((r, i) => {
                const world = WORLDS.find(w => w.id === r.world)
                const levelNum = world
                  ? world.levels.findIndex(l => l.id === r.level_id) + 1
                  : null
                const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                return (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[8px] font-mono uppercase tracking-wider"
                        style={{ color: world ? world.accent : 'rgba(255,255,255,0.3)', opacity: 0.7 }}>
                        {world?.name ?? r.world}{levelNum ? ` · Level ${levelNum}` : ''}
                      </p>
                      <p className="text-[8px] font-mono" style={{ color: '#BBBBBB' }}>{date}</p>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {r.reflection}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs font-mono text-center py-4" style={{ color: '#BBBBBB' }}>
              Your reflections will appear here after you complete levels.
            </p>
          )}
        </section>

      </div>
    </main>
  )
}
