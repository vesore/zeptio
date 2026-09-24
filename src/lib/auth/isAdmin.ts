import 'server-only'

/** Fails closed: no ADMIN_EMAIL configured (or no user email) means no admin. */
export function isAdmin(user: { email?: string | null } | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const email = user?.email?.trim().toLowerCase()
  return Boolean(adminEmail && email && email === adminEmail)
}
