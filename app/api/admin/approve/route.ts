import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'vesorestyle@gmail.com'

export async function POST(request: NextRequest) {
  // Auth check — only admin can call this
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Invite the user — sends a magic-link style invite email
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)

  if (inviteError && !inviteError.message.includes('already been registered')) {
    console.error('[admin/approve] invite error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Mark as approved in waitlist
  const { error: updateError } = await supabase
    .from('waitlist')
    .update({ status: 'approved' })
    .eq('email', email)

  if (updateError) {
    console.error('[admin/approve] update error:', updateError)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
