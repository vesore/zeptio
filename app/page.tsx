import Link from 'next/link'
import DemoSection from '@/src/components/landing/DemoSection'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-[#E8FF47] font-mono font-bold tracking-widest text-sm uppercase">
          Zeptio
        </span>
        <Link
          href="/auth/login"
          className="rounded-lg border border-[#E8FF47]/40 px-3 py-1.5 text-xs font-mono tracking-widest uppercase text-white/60 transition-colors duration-200 hover:border-[#E8FF47] hover:text-[#E8FF47]"
        >
          Sign in
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="mb-20 max-w-2xl">
          <p className="text-[#E8FF47] font-mono text-sm tracking-widest uppercase mb-5">
            Learn to prompt. Level up.
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Small words.<br />
            <span className="text-[#E8FF47]">Massive results.</span>
          </h1>
          <p className="text-white/50 text-xl leading-relaxed mb-10">
            Zeptio teaches you to write better AI prompts through fast, focused games.
            Progress through four worlds, earn XP, and watch vague ideas become precise instructions.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E8FF47] px-7 py-3.5 text-sm font-mono font-bold tracking-widest uppercase text-[#1a1a2e] transition-all duration-200 hover:bg-white"
          >
            Get Started →
          </Link>
        </div>

        {/* Live Demo Section */}
        <div className="mb-4">
          <p className="text-[#E8FF47] font-mono text-sm tracking-widest uppercase mb-2">
            See it in action
          </p>
          <h2 className="text-2xl font-bold">Watch someone learn in real time.</h2>
        </div>
        <DemoSection />

        {/* Worlds teaser */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '◎', name: 'Clarity' },
            { icon: '⬡', name: 'Constraints' },
            { icon: '▦', name: 'Structure' },
            { icon: '⟁', name: 'Debug' },
          ].map((w) => (
            <div
              key={w.name}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center"
            >
              <p className="font-mono text-xl text-[#E8FF47] mb-2">{w.icon}</p>
              <p className="text-sm font-semibold text-white/60">{w.name}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
