import 'server-only'
import { Resend } from 'resend'

const NDA_TEXT = `BETA TESTER NON-DISCLOSURE AGREEMENT

This Beta Tester Non-Disclosure Agreement ("Agreement") is entered into as of the date of electronic signature below, between Zeptio LLC, an Ohio Limited Liability Company ("Company"), and the individual whose name appears in the signature block below ("Beta Tester").

1. CONFIDENTIALITY

Beta Tester acknowledges that during participation in the Zeptio closed beta program, they may be exposed to non-public information including, without limitation, unreleased features, product roadmaps, source code, data, business strategies, user data, pricing, and other proprietary or sensitive materials (collectively, "Confidential Information"). Beta Tester agrees to hold all Confidential Information in strict confidence and shall not disclose, share, publish, or transmit any Confidential Information to any third party without the prior written consent of the Company.

2. NO SCREENSHOTS OR RECORDINGS

Beta Tester expressly agrees not to capture, record, publish, share, post, or otherwise distribute screenshots, screen recordings, photographs, audio recordings, or any other visual or audio reproduction of the Zeptio platform, its interface, content, levels, or features — publicly or privately — including but not limited to social media, forums, group chats, or any other digital medium, without express written permission from the Company.

3. NON-COMPETE AND NON-DERIVATION

Beta Tester agrees that they will not use knowledge, ideas, pedagogical methodologies, game mechanics, level structures, user experience patterns, or other insights gained through participation in the Zeptio beta program to design, develop, build, contribute to, or advise any competing product or service that teaches, trains, or gamifies AI prompting, prompt engineering, or related skills. This restriction shall apply for a period of twelve (12) months following the conclusion of Beta Tester's participation in the beta program.

4. FEEDBACK LICENSE

Any feedback, suggestions, bug reports, feature requests, ideas, or other input provided by Beta Tester to the Company ("Feedback") may be incorporated into, used to improve, or otherwise leveraged by Zeptio without restriction, compensation, attribution, or obligation of any kind. Beta Tester hereby irrevocably assigns to the Company all rights, title, and interest in and to any Feedback.

5. BINDING AGREEMENT

Beta Tester acknowledges that this Agreement constitutes a legally binding contract. By entering their full name in the signature field and clicking "I Accept & Request Access," Beta Tester affirms that they have read and fully understood this Agreement and agree to be bound by all of its terms and conditions. An electronic signature is considered valid and enforceable to the same extent as a handwritten signature under applicable law.

6. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the federal and state courts located in the State of Delaware.

7. TERM AND SURVIVAL

This Agreement is effective upon electronic signature and shall remain in full force and effect for the duration of Beta Tester's participation in the Zeptio beta program and for a period of two (2) years thereafter with respect to any Confidential Information received during the beta period. Sections 1, 2, 3, 4, and 6 shall survive termination of this Agreement.

8. REMEDIES

Beta Tester acknowledges that any breach of this Agreement may cause irreparable harm to the Company for which monetary damages may be an inadequate remedy, and that the Company shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior or contemporaneous negotiations, representations, warranties, or agreements, whether written or oral, relating thereto. This Agreement may not be modified except by a written instrument signed by both parties.`

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function sendNDANotification(
  name: string,
  email: string,
  date: string,
  wantsCopy: boolean,
): Promise<void> {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: 'Zeptio <contact@zeptio.app>',
    to: 'thebedtimelover@gmail.com',
    subject: `New Zeptio NDA Acceptance - ${name}`,
    text: [
      'New NDA acceptance received.',
      '',
      `Name:               ${name}`,
      `Email:              ${email}`,
      `Date/Time:          ${date}`,
      `Email copy sent:    ${wantsCopy ? 'Yes' : 'No'}`,
    ].join('\n'),
  })
  if (error) throw new Error(`Admin notify failed: ${error.message}`)
}

export async function sendNDACopy(name: string, email: string, date: string): Promise<void> {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: 'Zeptio <contact@zeptio.app>',
    to: email,
    subject: 'Your Zeptio Beta NDA — Signed Copy',
    text: [
      `Hi ${name},`,
      '',
      'Here is your signed copy of the Zeptio Beta Tester Non-Disclosure Agreement.',
      '',
      `Signed by: ${name}`,
      `Date/Time: ${date}`,
      '',
      '─'.repeat(60),
      '',
      NDA_TEXT,
    ].join('\n'),
  })
  if (error) throw new Error(`NDA copy failed: ${error.message}`)
}
