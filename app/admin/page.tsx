import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { isAdmin } from '@/src/lib/auth/isAdmin'
import WaitlistTable from './_components/WaitlistTable'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    redirect('/dashboard')
  }

  // waitlist has no user-facing RLS policies; read it with the service role.
  const { data: rows } = await createAdminClient()
    .from('waitlist')
    .select('id, name, email, created_at, accepted_nda, status')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen py-12 px-6" style={{ background: '#EFEFEF' }}>
      <div className="max-w-5xl mx-auto">
        <p className="font-mono font-bold tracking-widest text-sm uppercase mb-8" style={{ color: '#4A90E2' }}>
          Zeptio Admin
        </p>
        <WaitlistTable rows={rows ?? []} />
      </div>
    </main>
  )
}
