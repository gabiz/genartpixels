/**
 * Integration tests for authentication flow
 * Tests the complete SSO and handle creation flow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { validateHandle } from '@/lib/validation'
import { AUTH_PROVIDERS } from '../config'
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

// Mock fetch for API calls
global.fetch = jest.fn()

// Test component that uses auth functionality
function AuthIntegrationTest() {
  const { signIn, signOut, createHandle, user, supabaseUser, loading, initialized } = useAuth()
  const [handleInput, setHandleInput] = React.useState('')
  const [status, setStatus] = React.useState('')

  const handleSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      setStatus(`Signing in with ${provider}...`)
      await signIn(provider)
      setStatus(`Signed in with ${provider}`)
    } catch (error) {
      setStatus(`Error: ${error}`)
    }
  }

  const handleSignOut = async () => {
    try {
      setStatus('Signing out...')
      await signOut()
      setStatus('Signed out')
    } catch (error) {
      setStatus(`Error: ${error}`)
    }
  }

  const handleCreateHandle = async () => {
    try {
      setStatus('Creating handle...')
      const result = await createHandle(handleInput)
      setStatus(result.success ? 'Handle created' : `Error: ${result.error}`)
    } catch (error) {
      setStatus(`Error: ${error}`)
    }
  }

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="initialized">{initialized.toString()}</div>
      <div data-testid="has-supabase-user">{(!!supabaseUser).toString()}</div>
      <div data-testid="has-user-profile">{(!!user).toString()}</div>
      <div data-testid="user-handle">{user?.handle || 'none'}</div>
      <div data-testid="status">{status}</div>

      <button data-testid="signin-google" onClick={() => handleSignIn('google')}>
        Sign in with Google
      </button>
      <button data-testid="signin-github" onClick={() => handleSignIn('github')}>
        Sign in with GitHub
      </button>
      <button data-testid="signin-facebook" onClick={() => handleSignIn('facebook')}>
        Sign in with Facebook
      </button>
      <button data-testid="signout" onClick={handleSignOut}>
        Sign Out
      </button>

      <input
        data-testid="handle-input"
        value={handleInput}
        onChange={(e) => setHandleInput(e.target.value)}
        placeholder="Enter handle"
      />
      <button data-testid="create-handle" onClick={handleCreateHandle}>
        Create Handle
      </button>
    </div>
  )
}

describe('Authentication Integration Tests', () => {
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

    // Mock fetch
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  test('should have valid auth configuration for integration', () => {
    expect(AUTH_PROVIDERS.GOOGLE).toBe('google')
    expect(AUTH_PROVIDERS.GITHUB).toBe('github')
    expect(AUTH_PROVIDERS.FACEBOOK).toBe('facebook')
  })

  test('should validate handles for integration flow', () => {
    expect(validateHandle('test_user')).toBe(true)
    expect(validateHandle('valid123')).toBe(true)
    expect(validateHandle('user-name')).toBe(true)
    expect(validateHandle('abc')).toBe(false) // Too short
    expect(validateHandle('a'.repeat(21))).toBe(false) // Too long
    expect(validateHandle('user@name')).toBe(false) // Invalid character
  })

  test('should initialize auth context correctly', async () => {
    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    // Should start loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('initialized')).toHaveTextContent('false')

    // Should finish initialization
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })

    // Should not have user initially
    expect(screen.getByTestId('has-supabase-user')).toHaveTextContent('false')
    expect(screen.getByTestId('has-user-profile')).toHaveTextContent('false')
  })

  test('should handle SSO sign-in flow', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })

    // Test Google sign-in
    fireEvent.click(screen.getByTestId('signin-google'))
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Signed in with google')
    })

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
        scopes: 'email profile',
      },
    })
  })

  test('should handle SSO sign-in error', async () => {
    const error = new Error('OAuth failed')
    mockSupabase.auth.signInWithOAuth.mockRejectedValue(error)

    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })

    fireEvent.click(screen.getByTestId('signin-github'))
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Error: Error: OAuth failed')
    })
  })

  test('should handle sign-out flow', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
    })

    fireEvent.click(screen.getByTestId('signout'))
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Signed out')
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  test('should handle handle creation flow with authenticated user', async () => {
    // Mock authenticated user
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      access_token: 'mock-access-token',
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
            error: { code: 'PGRST116' }, // User not found (needs handle)
          }),
        })),
      })),
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        user: {
          id: 'test-user-id',
          handle: 'test_handle',
          email: 'test@example.com',
          pixels_available: 100,
        },
      }),
    })

    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByTestId('has-supabase-user')).toHaveTextContent('true')
    })

    // Enter handle and create
    fireEvent.change(screen.getByTestId('handle-input'), {
      target: { value: 'test_handle' },
    })
    fireEvent.click(screen.getByTestId('create-handle'))
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Handle created')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/create-handle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ handle: 'test_handle' }),
    })
  })

  test('should handle handle creation error with authenticated user', async () => {
    // Mock authenticated user
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
            error: { code: 'PGRST116' }, // User not found (needs handle)
          }),
        })),
      })),
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: 'Handle already taken',
      }),
    })

    render(
      <AuthProvider>
        <AuthIntegrationTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByTestId('has-supabase-user')).toHaveTextContent('true')
    })

    fireEvent.change(screen.getByTestId('handle-input'), {
      target: { value: 'taken_handle' },
    })
    fireEvent.click(screen.getByTestId('create-handle'))
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Error: Handle already taken')
    })
  })

  test('should handle complete authentication flow', async () => {
    // Mock successful session with user profile
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }

    const mockUserProfile = {
      id: 'test-user-id',
      handle: 'existing_user',
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
        <AuthIntegrationTest />
      </AuthProvider>
    )

    // Should load user profile
    await waitFor(() => {
      expect(screen.getByTestId('has-supabase-user')).toHaveTextContent('true')
      expect(screen.getByTestId('has-user-profile')).toHaveTextContent('true')
      expect(screen.getByTestId('user-handle')).toHaveTextContent('existing_user')
    })
  })

  // Note: Full integration tests with real OAuth flows and database
  // are tested through the test page at /test/auth which allows manual testing
  // of the complete authentication flow including OAuth redirects
})