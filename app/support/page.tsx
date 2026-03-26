import Link from 'next/link'

export default function SupportPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-8">

        <p className="font-mono font-bold tracking-widest text-sm uppercase" style={{ color: '#E8FF47' }}>Zeptio</p>

        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-4">
            We&apos;re here to help.
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Having trouble? Reach out and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <a
          href="mailto:contact@zeptio.app"
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-base transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
          style={{ backgroundColor: '#E8FF47', color: '#0d0d1a' }}
        >
          contact@zeptio.app
        </a>

        <div className="flex gap-6 text-sm pt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/privacy" className="hover:text-[#E8FF47] transition-colors duration-200">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#E8FF47] transition-colors duration-200">Terms of Service</Link>
        </div>

      </div>
    </main>
  )
}
