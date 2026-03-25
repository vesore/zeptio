import { createClient } from '@/src/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const supabase = await createClient()

  // PKCE flow: email confirmation / OAuth
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/dashboard`)
  }

  // OTP / magic-link flow
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    })
    if (!error) return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
