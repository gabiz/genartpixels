/**
 * Unit tests for authentication guards and utilities
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { validateHandle } from '@/lib/validation'
import { withAuth, useAuthGuard, AuthGate } from '../guards'
import { AuthProvider } from '../context'

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

// Mock components
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

jest.mock('@/components/auth/login-prompt', () => ({
  LoginPrompt: () => <div data-testid="login-prompt">Please log in</div>,
}))

// Test components
function TestComponent() {
  return <div data-testid="protected-content">Protected Content</div>
}

function TestAuthGuardHook() {
  const guard = useAuthGuard()
  return (
    <div>
      <div data-testid="is-authenticated">{guard.isAuthenticated.toString()}</div>
      <div data-testid="has-handle">{guard.hasHandle.toString()}</div>
      <div data-testid="is-loading">{guard.isLoading.toString()}</div>
      <div data-testid="can-access">{guard.canAccessProtectedRoute.toString()}</div>
      <div data-testid="requires-login">{guard.requiresLogin.toString()}</div>
      <div data-testid="requires-handle">{guard.requiresHandle.toString()}</div>
    </div>
  )
}

describe('Authentication Guards', () => {
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

  test('should validate authentication requirements', () => {
    // Test handle validation which is used in auth guards
    expect(validateHandle('valid_handle')).toBe(true)
    expect(validateHandle('test123')).toBe(true)
    expect(validateHandle('user-name')).toBe(true)
    expect(validateHandle('abc')).toBe(false) // Too short (3 chars)
    expect(validateHandle('')).toBe(false) // Empty
    expect(validateHandle('user@name')).toBe(false) // Invalid character
  })

  describe('useAuthGuard hook', () => {
    test('should return correct guard state for unauthenticated user', async () => {
      render(
        <AuthProvider>
          <TestAuthGuardHook />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })
      
      // Check unauthenticated state
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('has-handle')).toHaveTextContent('false')
      expect(screen.getByTestId('can-access')).toHaveTextContent('false')
      expect(screen.getByTestId('requires-login')).toHaveTextContent('true')
      expect(screen.getByTestId('requires-handle')).toHaveTextContent('false')
    })

    test('should return correct guard state for authenticated user without handle', async () => {
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
          <TestAuthGuardHook />
        </AuthProvider>
      )

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      })
      
      // Check authenticated but no handle state
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('has-handle')).toHaveTextContent('false')
      expect(screen.getByTestId('can-access')).toHaveTextContent('false')
      expect(screen.getByTestId('requires-login')).toHaveTextContent('false')
      expect(screen.getByTestId('requires-handle')).toHaveTextContent('true')
    })
  })

  describe('AuthGate component', () => {
    test('should show loading fallback during initialization', () => {
      render(
        <AuthProvider>
          <AuthGate loadingFallback={<div data-testid="custom-loading">Custom Loading</div>}>
            <TestComponent />
          </AuthGate>
        </AuthProvider>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
    })

    test('should show children when no auth required', async () => {
      render(
        <AuthProvider>
          <AuthGate requireAuth={false}>
            <TestComponent />
          </AuthGate>
        </AuthProvider>
      )

      expect(await screen.findByTestId('protected-content')).toBeInTheDocument()
    })

    test('should show fallback when auth required but not authenticated', async () => {
      render(
        <AuthProvider>
          <AuthGate 
            requireAuth={true} 
            fallback={<div data-testid="auth-required">Auth Required</div>}
          >
            <TestComponent />
          </AuthGate>
        </AuthProvider>
      )

      expect(await screen.findByTestId('auth-required')).toBeInTheDocument()
    })
  })

  describe('withAuth HOC', () => {
    test('should show loading during initialization', () => {
      const WrappedComponent = withAuth(TestComponent)
      
      render(
        <AuthProvider>
          <WrappedComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    test('should show login prompt when not authenticated', async () => {
      const WrappedComponent = withAuth(TestComponent)
      
      render(
        <AuthProvider>
          <WrappedComponent />
        </AuthProvider>
      )

      expect(await screen.findByTestId('login-prompt')).toBeInTheDocument()
    })

    test('should use custom fallback component', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Fallback</div>
      const WrappedComponent = withAuth(TestComponent, { fallback: CustomFallback })
      
      render(
        <AuthProvider>
          <WrappedComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    })
  })
})