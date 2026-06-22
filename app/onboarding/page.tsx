'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('zeptio_onboarded')) {
      router.replace('/dashboard')
    }
  }, [router])

  function handleLetsPlay() {
    localStorage.setItem('zeptio_onboarded', 'true')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <p className="font-mono font-bold tracking-widest text-base uppercase" style={{ color: '#4A90E2' }}>
          Zeptio
        </p>

        <div className="w-full rounded-3xl p-8 flex flex-col gap-6" style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col gap-1">
            <h1 className="fredoka text-4xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
              Welcome to Zeptio
            </h1>
            <p className="text-base" style={{ color: '#666666' }}>
              Here&apos;s how it works.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {[
              { icon: '✍️', text: 'Write the best prompt you can' },
              { icon: '🤖', text: 'AI scores your response' },
              { icon: '⚡', text: 'Earn XP and climb the leaderboard' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-4">
                <span
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-xl flex-shrink-0"
                  style={{ background: '#F0F7FF' }}
                >
                  {icon}
                </span>
                <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleLetsPlay}
            className="w-full py-4 text-lg font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2 btn-primary"
          >
            Let&apos;s Play
          </button>
        </div>
      </div>
    </main>
  )
}
