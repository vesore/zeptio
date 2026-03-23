'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/src/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <main
      style={{ backgroundColor: '#1a1a2e' }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#E8FF47',
                  brandAccent: '#d4eb3e',
                  brandButtonText: '#1a1a2e',
                  inputBackground: '#0f0f1a',
                  inputBorder: '#2e2e4a',
                  inputBorderFocus: '#E8FF47',
                  inputText: '#ffffff',
                  inputPlaceholder: '#6b6b8a',
                  messageText: '#ffffff',
                  anchorTextColor: '#E8FF47',
                  anchorTextHoverColor: '#d4eb3e',
                  dividerBackground: '#2e2e4a',
                },
                radii: {
                  borderRadiusButton: '8px',
                  inputBorderRadius: '8px',
                },
              },
            },
          }}
          redirectTo={
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : '/auth/callback'
          }
          providers={['google', 'github']}
        />
      </div>
    </main>
  )
}
