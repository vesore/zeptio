import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendBetaSignupNotification } from '@/src/lib/email'

export async function POST(request: NextRequest) {
  let body: { firstName?: unknown; lastName?: unknown; email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firstName, lastName, email } = body

  if (typeof firstName !== 'string' || !firstName.trim()) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 })
  }
  if (typeof lastName !== 'string' || !lastName.trim()) {
    return NextResponse.json({ error: 'Last name is required' }, { status: 400 })
  }
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const name = `${firstName.trim()} ${lastName.trim()}`
  const normalizedEmail = email.trim().toLowerCase()
  const supabase = createAdminClient()

  // Create auth user — email already confirmed, ready to sign in immediately
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: 'Zeptio2026',
    email_confirm: true,
  })

  if (authError) {
    // User already exists — tell client to redirect to login
    const msg = authError.message.toLowerCase()
    if (
      msg.includes('already') ||
      msg.includes('exists') ||
      (authError as { status?: number }).status === 422
    ) {
      return NextResponse.json({ exists: true })
    }
    console.error('[api/waitlist] auth error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Save to waitlist
  const { error: waitlistError } = await supabase.from('waitlist').upsert(
    {
      name,
      email: normalizedEmail,
      accepted_nda: true,
      signature: normalizedEmail,
    },
    { onConflict: 'email' },
  )
  if (waitlistError) {
    console.error('[api/waitlist] waitlist db error:', waitlistError)
  }

  // Seed profile row
  if (authData.user?.id) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: authData.user.id, email: normalizedEmail, name },
      { onConflict: 'id' },
    )
    if (profileError) {
      console.error('[api/waitlist] profile db error:', profileError)
    }
  }

  // Notify admin (non-fatal)
  try {
    await sendBetaSignupNotification(name, normalizedEmail)
  } catch (err) {
    console.error('[api/waitlist] notification email error:', err)
  }

  return NextResponse.json({ ok: true })
}
