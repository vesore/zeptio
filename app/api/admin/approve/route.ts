import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function POST(request: NextRequest) {
  // Auth check — only admin can call this
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { waitlist_id?: unknown; email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { waitlist_id, email } = body

  if (typeof waitlist_id !== 'number' || typeof email !== 'string') {
    return NextResponse.json({ error: 'waitlist_id and email are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Invite the user — sends a magic-link style invite email
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zeptio.app'}/auth/callback`,
  })

  if (inviteError && !inviteError.message.includes('already been registered')) {
    console.error('[admin/approve] invite error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Mark as approved in waitlist
  const { error: updateError } = await supabase
    .from('waitlist')
    .update({ status: 'approved' })
    .eq('id', waitlist_id)

  if (updateError) {
    console.error('[admin/approve] update error:', updateError)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
