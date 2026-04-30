import Link from 'next/link'

export default function SupportPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#EFEFEF' }}>
      <div className="max-w-md w-full text-center flex flex-col items-center gap-8">

        <p className="font-mono font-bold tracking-widest text-sm uppercase" style={{ color: '#4A90E2' }}>Zeptio LLC</p>

        <div>
          <h1 className="text-4xl font-black tracking-tight mb-4" style={{ color: '#1A1A1A' }}>
            We&apos;re here to help.
          </h1>
          <p className="text-lg" style={{ color: '#666666' }}>
            Having trouble? Reach out and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <a
          href="mailto:contact@zeptio.app"
          className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-base transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2]"
          style={{ backgroundColor: '#4A90E2', color: '#FFFFFF' }}
        >
          contact@zeptio.app
        </a>

        <p className="text-xs font-mono" style={{ color: '#BBBBBB' }}>© 2026 Zeptio LLC. All rights reserved.</p>

        <div className="flex gap-6 text-sm pt-4" style={{ color: '#999999' }}>
          <Link href="/privacy" className="hover:text-[#4A90E2] transition-colors duration-200">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#4A90E2] transition-colors duration-200">Terms of Service</Link>
        </div>

      </div>
    </main>
  )
}
