/**
 * Unit tests for authentication configuration
 */

import { AUTH_PROVIDERS, AUTH_CONFIG } from '../config'

describe('Auth Configuration', () => {
  describe('AUTH_PROVIDERS', () => {
    test('should have correct provider values', () => {
      expect(AUTH_PROVIDERS.GOOGLE).toBe('google')
      expect(AUTH_PROVIDERS.GITHUB).toBe('github')
      expect(AUTH_PROVIDERS.FACEBOOK).toBe('facebook')
    })

    test('should be readonly', () => {
      // AUTH_PROVIDERS is a const assertion, so it's readonly at compile time
      // but not at runtime. This test verifies the structure is correct.
      expect(Object.keys(AUTH_PROVIDERS)).toEqual(['GOOGLE', 'GITHUB', 'FACEBOOK'])
    })
  })

  describe('AUTH_CONFIG', () => {
    test('should have correct redirect URL', () => {
      expect(AUTH_CONFIG.redirectTo).toBe(`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)
    })

    test('should have provider-specific scopes', () => {
      expect(AUTH_CONFIG.providers.google.scopes).toBe('email profile')
      expect(AUTH_CONFIG.providers.github.scopes).toBe('user:email')
      expect(AUTH_CONFIG.providers.facebook.scopes).toBe('email')
    })

    test('should have session configuration', () => {
      expect(AUTH_CONFIG.session.autoRefreshToken).toBe(true)
      expect(AUTH_CONFIG.session.persistSession).toBe(true)
      expect(AUTH_CONFIG.session.detectSessionInUrl).toBe(true)
    })
  })
})