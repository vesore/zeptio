import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { sendNDANotification, sendNDACopy } from '@/src/lib/email'

export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; signature?: unknown; wantsCopy?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, signature, wantsCopy } = body

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  if (typeof signature !== 'string' || !signature.trim()) {
    return NextResponse.json({ error: 'signature is required' }, { status: 400 })
  }

  /* Save to waitlist */
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from('waitlist').upsert(
    {
      name:         name.trim(),
      email:        email.trim().toLowerCase(),
      accepted_nda: true,
      signature:    signature.trim(),
    },
    { onConflict: 'email' },
  )

  if (dbError) {
    console.error('[api/nda] db error:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const acceptedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  /* Send admin notification */
  try {
    await sendNDANotification(name.trim(), email.trim().toLowerCase(), acceptedAt, !!wantsCopy)
  } catch (err) {
    console.error('[api/nda] notification email error:', err)
    // Non-fatal — DB write succeeded, don't block the user
  }

  /* Send NDA copy to user if requested */
  if (wantsCopy) {
    try {
      await sendNDACopy(name.trim(), email.trim().toLowerCase(), acceptedAt)
    } catch (err) {
      console.error('[api/nda] copy email error:', err)
      // Non-fatal
    }
  }

  return NextResponse.json({ ok: true })
}
