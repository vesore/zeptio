import 'server-only'
import { Resend } from 'resend'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function sendBetaSignupNotification(name: string, email: string): Promise<void> {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: 'Zeptio <contact@zeptio.app>',
    to: 'thebedtimelover@gmail.com',
    subject: `New beta tester: ${name}`,
    text: `New beta tester: ${name} - ${email}`,
  })
  if (error) throw new Error(`Beta signup notification failed: ${error.message}`)
}
