export default function BrandAboutSection() {
  return (
    <div className="w-full flex flex-col gap-5">

      {/* Eyebrow */}
      <p className="text-xs font-bold tracking-widest uppercase text-center" style={{ color: '#4A90E2' }}>
        Why we built this
      </p>

      {/* Origin story */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#444444' }}>
          We kept watching smart people get frustrating results from AI. It wasn&apos;t a capability
          issue — they just weren&apos;t being taught how to communicate with the tool.
        </p>
      </div>

      {/* Pull quote */}
      <div
        className="rounded-2xl px-6 py-5 text-center"
        style={{ background: '#F0F7FF', border: '1px solid #D0E6FF' }}
      >
        <p className="text-base font-bold leading-snug" style={{ color: '#4A90E2' }}>
          Prompt engineering isn&apos;t a technical skill.
        </p>
        <p className="text-base font-bold leading-snug" style={{ color: '#4A90E2' }}>
          It&apos;s a communication skill.
        </p>
      </div>

      {/* Three pillars */}
      <div className="flex flex-col gap-3">
        {[
          {
            heading: 'A practice, not a course',
            body: 'Our team spent years studying how people learn new skills and what makes learning stick. Zeptio isn’t something you finish — it’s something you build.',
          },
          {
            heading: 'A shift in thinking',
            body: 'People who use Zeptio don’t just get better at prompting. They start thinking differently about how they communicate with AI entirely — from passive use to active engineering.',
          },
          {
            heading: 'Real confidence',
            body: 'That shift creates more than better outputs. It creates the confidence to solve problems faster, explore ideas deeper, and trust your ability to work with the most powerful technology yet.',
          },
        ].map(({ heading, body }) => (
          <div
            key={heading}
            className="rounded-2xl px-5 py-4"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            <p className="text-sm font-black mb-1" style={{ color: '#1A1A1A' }}>{heading}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#888888' }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Closing line */}
      <p className="text-sm font-semibold text-center leading-snug" style={{ color: '#666666' }}>
        When people communicate with AI effectively,<br />
        they stop guessing and start creating.
      </p>

    </div>
  )
}
