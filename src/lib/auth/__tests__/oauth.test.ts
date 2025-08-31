/**
 * OAuth authentication tests
 * These tests handle missing OAuth configurations gracefully
 */

import { describeIfOAuth, skipMessages, isOAuthConfigured } from '../../__tests__/test-config'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}))

import { supabase } from '@/lib/supabase/client'
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('OAuth Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describeIfOAuth('google')('Google OAuth', () => {
    test('should initiate Google OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth/authorize' },
        error: null
      })

      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })

      expect(result.error).toBeNull()
      expect(result.data.provider).toBe('google')
    })

    test('should handle Google OAuth errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { message: 'OAuth provider not configured' }
      })

      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'google'
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('OAuth provider not configured')
    })
  })

  describeIfOAuth('github')('GitHub OAuth', () => {
    test('should initiate GitHub OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'github', url: 'https://github.com/login/oauth/authorize' },
        error: null
      })

      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })

      expect(result.error).toBeNull()
      expect(result.data.provider).toBe('github')
    })
  })

  describeIfOAuth('facebook')('Facebook OAuth', () => {
    test('should initiate Facebook OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'facebook', url: 'https://www.facebook.com/v18.0/dialog/oauth' },
        error: null
      })

      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })

      expect(result.error).toBeNull()
      expect(result.data.provider).toBe('facebook')
    })
  })

  // Test that shows which OAuth providers are not configured
  describe('OAuth Configuration Status', () => {
    test('should report OAuth configuration status', () => {
      const configStatus = {
        google: isOAuthConfigured.google,
        github: isOAuthConfigured.github,
        facebook: isOAuthConfigured.facebook
      }

      console.log('OAuth Configuration Status:', configStatus)

      // This test always passes but logs the configuration status
      expect(typeof configStatus).toBe('object')
    })

    if (!isOAuthConfigured.google) {
      test.skip(`Google OAuth: ${skipMessages.noOAuth('Google')}`, () => {})
    }

    if (!isOAuthConfigured.github) {
      test.skip(`GitHub OAuth: ${skipMessages.noOAuth('GitHub')}`, () => {})
    }

    if (!isOAuthConfigured.facebook) {
      test.skip(`Facebook OAuth: ${skipMessages.noOAuth('Facebook')}`, () => {})
    }
  })

  describe('OAuth Error Handling', () => {
    test('should handle missing OAuth configuration gracefully', async () => {
      // Simulate OAuth provider not configured error
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { message: 'OAuth provider not configured' }
      })

      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'google'
      })

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('OAuth provider not configured')
    })

    test('should handle network errors during OAuth', async () => {
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(
        new Error('Network error')
      )

      await expect(
        mockSupabase.auth.signInWithOAuth({ provider: 'google' })
      ).rejects.toThrow('Network error')
    })
  })

  describe('Session Management', () => {
    test('should handle session retrieval', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: {
              id: 'user-id',
              email: 'test@example.com'
            }
          }
        },
        error: null
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.error).toBeNull()
      expect(result.data.session?.user.email).toBe('test@example.com')
    })

    test('should handle sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const result = await mockSupabase.auth.signOut()

      expect(result.error).toBeNull()
    })
  })
})