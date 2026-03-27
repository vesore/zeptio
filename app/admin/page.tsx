import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WaitlistTable from './_components/WaitlistTable'

const ADMIN_EMAIL = 'vesorestyle@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  const { data: rows } = await supabase
    .from('waitlist')
    .select('id, name, email, created_at, accepted_nda, status')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono font-bold tracking-widest text-sm uppercase mb-8" style={{ color: '#B0E020' }}>
          Zeptio Admin
        </p>
        <WaitlistTable rows={rows ?? []} />
      </div>
    </main>
  )
}
