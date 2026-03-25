import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import AgreementForm from '@/src/components/onboarding/AgreementForm'

async function acceptBeta() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase.from('beta_agreements').upsert(
    { user_id: user.id, accepted_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  redirect('/dashboard')
}

const TERMS = [
  {
    title: 'Keep it confidential.',
    body: "Zeptio is not publicly available yet. Please don't share screenshots, recordings, or details about the app on social media, forums, or in public conversations.",
  },
  {
    title: 'Expect rough edges.',
    body: "This is early software. Things will break, change, and occasionally disappear. That's part of the process — thank you for your patience.",
  },
  {
    title: 'Your feedback is the point.',
    body: "Found a bug? Tell us. Have an idea? Share it. Not sure what something does? Ask. Your input directly shapes what Zeptio becomes.",
  },
  {
    title: 'No public comparisons.',
    body: "Please don't compare or review Zeptio publicly while it's in beta. Wait until we're ready to make noise together.",
  },
  {
    title: 'This is a trust agreement.',
    body: "This isn't a legal document — it's an honest request. We're sharing something we care about with you early. We're trusting you to respect that.",
  },
]

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Already agreed — skip to dashboard
  const { data: existing } = await supabase
    .from('beta_agreements')
    .select('accepted_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/dashboard')

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <p className="text-center font-mono font-bold tracking-widest text-sm uppercase mb-8" style={{ color: '#E8FF47' }}>
          Zeptio
        </p>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6" style={{ backgroundColor: '#12122a' }}>
            <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'rgba(232,255,71,0.7)' }}>
              Private Beta
            </p>
            <h1 className="text-2xl font-bold text-white mb-2">
              Before you play — a quick word.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
              You&apos;ve been invited to test Zeptio before it&apos;s ready for the world.
              In exchange for early access, we need a few things from you.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Terms list */}
          <div className="px-8 py-6 flex flex-col gap-5" style={{ backgroundColor: '#12122a' }}>
            {TERMS.map((term, i) => (
              <div key={i} className="flex gap-4">
                <span
                  className="font-mono text-xs font-bold shrink-0 mt-0.5 tabular-nums"
                  style={{ color: 'rgba(232,255,71,0.5)' }}
                >
                  0{i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{term.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>{term.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Form */}
          <div className="px-8 py-6" style={{ backgroundColor: '#0f0f22' }}>
            <AgreementForm acceptAction={acceptBeta} />
          </div>
        </div>

        {/* Sign out escape hatch */}
        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Not the right time?{' '}
          <a
            href="/auth/login"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-white/50"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Sign out
          </a>
        </p>
      </div>
    </main>
  )
}
