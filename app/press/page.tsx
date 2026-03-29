export const metadata = {
  title: 'Press Kit — Zeptio',
  description: 'Press kit, App Store listing copy, and media assets for Zeptio — Learn AI Prompting Through Play.',
}

const APP_DESCRIPTION = `Zeptio is a skill-building game that teaches you how to write better prompts for AI tools like ChatGPT, Claude, and Gemini — through progressively harder challenges, instant feedback, and a scoring system that rewards precision.

Each level gives you a specific creative constraint. Write clearly within it, submit your response, and receive a score from 0–100 based on how well you met the goal. A robot companion tracks your progress as you level up.

Four worlds. Four skills. One complete foundation for working with AI.

CLARITY — The Brain
Learn to write prompts that actually say what you mean. Eliminate ambiguity. Be specific. Ten levels that train the most fundamental skill in AI prompting.

CONSTRAINTS — The Gears
Learn to work within limits. Word limits, format rules, topic restrictions. The best prompts are disciplined — and discipline is a learnable skill.

STRUCTURE — The Arms
Learn to control what an AI outputs. Numbered steps, tables, JSON, before/after comparisons. When you define the structure, you get the output you actually wanted.

DEBUG — The Eyes
Learn to spot what's broken in a prompt — then fix it. Vague language, contradictions, missing context, bias, conflicting goals. The final skill that ties everything together.

→ Unlock each world by averaging 80+ across the previous one.
→ Earn points with every level. Unlock robot parts as you go.
→ No subscription. No ads. No filler content.

Zeptio is for anyone who uses AI tools and wants to get dramatically better at them — fast.`

const features = [
  {
    emoji: '🧠',
    world: 'Clarity',
    accent: '#00FF88',
    tagline: 'The Brain',
    description: 'Ten levels that train precision of thought. Players learn to eliminate ambiguity, specify audience and intent, and write prompts that get exactly the output they\'re after.',
  },
  {
    emoji: '⚙️',
    world: 'Constraints',
    accent: '#B87333',
    tagline: 'The Gears',
    description: 'Word limits, format rules, topic restrictions. Players learn that working within hard limits forces clarity — and that constrained writing is often better writing.',
  },
  {
    emoji: '🦾',
    world: 'Structure',
    accent: '#8B8FA8',
    tagline: 'The Arms',
    description: 'Numbered plans, comparison tables, JSON output, before/after formats. Players learn to control not just what an AI says, but exactly how it says it.',
  },
  {
    emoji: '👁️',
    world: 'Debug',
    accent: '#C84B1F',
    tagline: 'The Eyes',
    description: 'Players are given broken, vague, contradictory, or biased prompts — and must identify and fix every flaw. The diagnostic skill that makes all other skills sharper.',
  },
]

const keywords = [
  'AI', 'prompts', 'learning', 'game', 'productivity',
  'ChatGPT', 'writing', 'skills', 'training', 'education',
]

function Divider() {
  return (
    <div
      className="w-full h-px my-10 sm:my-14"
      style={{ background: 'linear-gradient(90deg,transparent,rgba(184,115,51,0.25),transparent)' }}
      aria-hidden="true"
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono tracking-[0.2em] uppercase mb-5" style={{ color: 'rgba(184,115,51,0.6)' }}>
      {children}
    </p>
  )
}

export default function PressPage() {
  return (
    <main
      className="min-h-screen w-full overflow-x-hidden"
      style={{ background: '#0F0F0F', color: '#E8E8E8' }}
    >
      {/* Copper radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(184,115,51,0.05) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-5 sm:px-8 py-14 sm:py-20">

        {/* ── HEADER ── */}
        <div className="mb-12 sm:mb-16">
          <p
            className="font-mono font-black tracking-widest text-lg mb-6"
            style={{ color: '#B87333', textShadow: '0 0 16px rgba(184,115,51,0.35)' }}
          >
            Zeptio
          </p>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4"
            style={{ color: '#E8E8E8' }}
          >
            Press Kit
          </h1>
          <p className="text-base font-mono" style={{ color: 'rgba(232,232,232,0.4)' }}>
            zeptio.app/press &nbsp;·&nbsp; Last updated March 2026
          </p>
        </div>

        {/* ── APP STORE LISTING ── */}
        <section aria-labelledby="listing-heading">
          <SectionLabel>App Store Listing</SectionLabel>

          <div className="flex flex-col gap-7">

            {/* Name + Subtitle */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>App Name</p>
              <p className="text-2xl font-black tracking-wide" style={{ color: '#E8E8E8' }}>Zeptio</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>Subtitle</p>
              <p className="text-lg font-bold" style={{ color: '#E8E8E8' }}>Learn AI Prompting Through Play</p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>Description</p>
              <div
                className="rounded-xl p-5 sm:p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(232,232,232,0.07)' }}
              >
                <pre
                  className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                  style={{ color: 'rgba(232,232,232,0.7)' }}
                >
                  {APP_DESCRIPTION}
                </pre>
              </div>
            </div>

            {/* Keywords */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>Keywords</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <span
                    key={kw}
                    className="text-xs font-mono rounded-lg px-3 py-1.5"
                    style={{
                      background: 'rgba(184,115,51,0.07)',
                      border: '1px solid rgba(184,115,51,0.2)',
                      color: 'rgba(184,115,51,0.8)',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </section>

        <Divider />

        {/* ── ABOUT ── */}
        <section aria-labelledby="about-heading">
          <SectionLabel>About Zeptio</SectionLabel>
          <h2 id="about-heading" className="sr-only">About Zeptio</h2>

          <div className="flex flex-col gap-5 text-base leading-relaxed" style={{ color: 'rgba(232,232,232,0.65)' }}>
            <p>
              Zeptio is an AI skills training game built on the belief that prompting is a real, learnable skill — and that the best way to learn it is by doing. Most AI tools teach you their interface. Zeptio teaches you how to think. Through a series of progressively harder challenges across four themed worlds, players develop the habits of clarity, precision, structure, and critical diagnosis that separate people who get mediocre AI output from people who get great AI output.
            </p>
            <p>
              The game is designed for professionals, students, writers, developers, and anyone who relies on AI tools in their daily work. Each world is built around a core skill, each level pushes that skill further, and a scoring engine powered by Claude provides instant, specific feedback on every submission. There are no subscriptions, no ads, and no artificial barriers — just a clean, focused experience that makes you measurably better at working with AI.
            </p>
          </div>
        </section>

        <Divider />

        {/* ── KEY FEATURES ── */}
        <section aria-labelledby="features-heading">
          <SectionLabel>Key Features</SectionLabel>
          <h2 id="features-heading" className="sr-only">Key Features</h2>

          <div className="flex flex-col gap-4">
            {features.map(f => (
              <div
                key={f.world}
                className="rounded-xl p-5 flex flex-col sm:flex-row gap-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(232,232,232,0.07)`,
                }}
              >
                <div className="flex items-start gap-4 sm:w-40 shrink-0">
                  <span className="text-2xl leading-none" aria-hidden="true">{f.emoji}</span>
                  <div>
                    <p className="font-black tracking-wider text-sm" style={{ color: f.accent }}>{f.world}</p>
                    <p className="text-xs font-mono" style={{ color: 'rgba(184,115,51,0.6)' }}>{f.tagline}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,232,232,0.55)' }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mechanics list */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              '0–100 scoring on every submission, powered by Claude',
              'Sequential unlocks — complete each world at 80+ avg to advance',
              'Robot companion that builds as you earn XP across all four worlds',
              'Streak tracking and cumulative score across the full curriculum',
              'No account required to try — waitlist for beta access',
            ].map(item => (
              <div key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#B87333', marginTop: '6px' }}
                  aria-hidden="true"
                />
                <p className="text-sm" style={{ color: 'rgba(232,232,232,0.5)' }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ── CONTACT ── */}
        <section aria-labelledby="contact-heading">
          <SectionLabel>Contact</SectionLabel>
          <h2 id="contact-heading" className="sr-only">Contact</h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>Press & Media</p>
              <a
                href="mailto:contact@zeptio.app"
                className="text-base font-bold transition-colors duration-200 hover:text-[#B87333]"
                style={{ color: '#E8E8E8' }}
              >
                contact@zeptio.app
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'rgba(232,232,232,0.3)' }}>Website</p>
              <a
                href="https://zeptio.app"
                className="text-base font-bold transition-colors duration-200 hover:text-[#B87333]"
                style={{ color: '#E8E8E8' }}
              >
                zeptio.app
              </a>
            </div>
          </div>

          <p className="mt-8 text-xs font-mono leading-relaxed" style={{ color: 'rgba(232,232,232,0.25)' }}>
            Screenshots and additional assets available on request. Zeptio is currently in closed beta.
          </p>
        </section>

        {/* ── FOOTER ── */}
        <div className="mt-16 pt-6 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(232,232,232,0.06)' }}>
          <p className="text-xs font-mono" style={{ color: 'rgba(232,232,232,0.2)' }}>
            © 2026 Zeptio
          </p>
          <a href="/" className="text-xs font-mono transition-colors duration-200 hover:text-[#B87333]"
            style={{ color: 'rgba(232,232,232,0.25)' }}>
            ← Back to Zeptio
          </a>
        </div>

      </div>
    </main>
  )
}
