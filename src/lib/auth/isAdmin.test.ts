import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAdmin } from './isAdmin'

afterEach(() => vi.unstubAllEnvs())

describe('isAdmin', () => {
  it('matches the configured admin email, ignoring case and whitespace', () => {
    vi.stubEnv('ADMIN_EMAIL', ' Admin@Example.com ')
    expect(isAdmin({ email: 'admin@example.com' })).toBe(true)
    expect(isAdmin({ email: 'ADMIN@example.com' })).toBe(true)
  })

  it('rejects other users', () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com')
    expect(isAdmin({ email: 'someone@example.com' })).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })

  it('fails closed when ADMIN_EMAIL is not set', () => {
    vi.stubEnv('ADMIN_EMAIL', '')
    expect(isAdmin({ email: undefined })).toBe(false)
    expect(isAdmin({ email: '' })).toBe(false)
    expect(isAdmin({ email: 'admin@example.com' })).toBe(false)
  })

  it('rejects a user with no email even when ADMIN_EMAIL is set', () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.com')
    expect(isAdmin({ email: null })).toBe(false)
    expect(isAdmin({})).toBe(false)
  })
})
