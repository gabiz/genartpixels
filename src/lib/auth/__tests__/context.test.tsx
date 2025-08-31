/**
 * Unit tests for authentication context and hooks
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { validateHandle } from '@/lib/validation'
import { AUTH_PROVIDERS, AUTH_CONFIG } from '../config'
import { AuthProvider, useAuth } from '../context'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

// Get the mocked supabase for test setup
const { supabase: mockSupabase } = jest.requireMock('@/lib/supabase/client')

// Mock fetch for handle creation
global.fetch = jest.fn()

// Test component to access auth context
function TestComponent() {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="initialized">{auth.initialized.toString()}</div>
      <div data-testid="user">{auth.user ? auth.user.handle : 'null'}</div>
      <div data-testid="supabase-user">{auth.supabaseUser ? auth.supabaseUser.id : 'null'}</div>
    </div>
  )
}

describe('AuthProvider and useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  test('should validate handles correctly', () => {
    expect(validateHandle('valid_handle')).toBe(true)
    expect(validateHandle('test123')).toBe(true)
    expect(validateHandle('user-name')).toBe(true)
    expect(validateHandle('ab')).toBe(false) // Too short
    expect(validateHandle('a'.repeat(21))).toBe(false) // Too long
    expect(validateHandle('user@name')).toBe(false) // Invalid character
    expect(validateHandle('')).toBe(false) // Empty
    expect(validateHandle('user name')).toBe(false) // Space
  })

  test('should have correct auth configuration', () => {
    expect(AUTH_PROVIDERS.GOOGLE).toBe('google')
    expect(AUTH_PROVIDERS.GITHUB).toBe('github')
    expect(AUTH_PROVIDERS.FACEBOOK).toBe('facebook')
    
    expect(AUTH_CONFIG.redirectTo).toContain('/auth/callback')
    expect(AUTH_CONFIG.providers.google.scopes).toBe('email profile')
    expect(AUTH_CONFIG.providers.github.scopes).toBe('user:email')
    expect(AUTH_CONFIG.providers.facebook.scopes).toBe('email')
    
    expect(AUTH_CONFIG.session.autoRefreshToken).toBe(true)
    expect(AUTH_CONFIG.session.persistSession).toBe(true)
    expect(AUTH_CONFIG.session.detectSessionInUrl).toBe(true)
  })

  test('should initialize with loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('initialized')).toHaveTextContent('false')

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })
  })

  test('should handle no session on initialization', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('supabase-user')).toHaveTextContent('null')
    })
  })

  test('should handle session with user profile', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }

    const mockUserProfile = {
      id: 'test-user-id',
      handle: 'test_user',
      email: 'test@example.com',
      pixels_available: 100,
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null,
          }),
        })),
      })),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('test_user')
      expect(screen.getByTestId('supabase-user')).toHaveTextContent('test-user-id')
    })
  })

  test('should handle session without user profile', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // User not found
          }),
        })),
      })),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('supabase-user')).toHaveTextContent('test-user-id')
    })
  })

  test('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})