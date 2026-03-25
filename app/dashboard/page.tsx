import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

const WORLDS: { id: string; name: string; description: string; icon: string; href?: string }[] = [
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Cut through ambiguity. Define the problem before you solve it.',
    icon: '◎',
    href: '/dashboard/clarity',
  },
  {
    id: 'constraints',
    name: 'Constraints',
    description: 'Work within limits. Great solutions thrive under pressure.',
    icon: '⬡',
  },
  {
    id: 'structure',
    name: 'Structure',
    description: 'Build with intention. Organize thinking into lasting systems.',
    icon: '▦',
  },
  {
    id: 'debug',
    name: 'Debug',
    description: 'Find the break. Trace errors back to their root cause.',
    icon: '⟁',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-[#E8FF47] font-mono font-bold tracking-widest text-sm uppercase">
          Zeptio
        </span>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm font-mono">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-[#E8FF47]/40 px-3 py-1.5 text-xs font-mono tracking-widest uppercase text-white/60 transition-colors duration-200 hover:border-[#E8FF47] hover:text-[#E8FF47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Welcome */}
        <div className="mb-14">
          <p className="text-[#E8FF47] font-mono text-sm tracking-widest uppercase mb-3">
            Welcome back
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            {user.email}
          </h1>
          <p className="mt-3 text-white/50 text-lg">
            Choose a world to enter.
          </p>
        </div>

        {/* 2×2 World Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WORLDS.map((world) => {
            const cardClass = "group relative text-left rounded-2xl border border-white/10 bg-white/5 p-7 transition-all duration-200 hover:border-[#E8FF47]/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
            const inner = (
              <>
                <span className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-[#E8FF47]/0 via-[#E8FF47]/60 to-[#E8FF47]/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-2xl text-[#E8FF47] mb-1 leading-none">
                      {world.icon}
                    </p>
                    <h2 className="text-xl font-semibold mt-3 mb-2 group-hover:text-[#E8FF47] transition-colors duration-200">
                      {world.name}
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {world.description}
                    </p>
                  </div>
                  <span className="mt-1 text-white/20 group-hover:text-[#E8FF47] transition-colors duration-200 text-lg shrink-0">
                    →
                  </span>
                </div>
              </>
            )
            return world.href ? (
              <Link key={world.id} href={world.href} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <button key={world.id} className={cardClass}>
                {inner}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
