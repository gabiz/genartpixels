'use client'

/**
 * Authentication guard utilities and higher-order components
 */

import React from 'react'
import { useAuth } from './context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LoginPrompt } from '@/components/auth/login-prompt'

/**
 * Higher-order component that requires authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireHandle?: boolean
    fallback?: React.ComponentType
  } = {}
) {
  const { requireHandle = true, fallback: Fallback } = options

  return function AuthenticatedComponent(props: P) {
    const { user, supabaseUser, loading, initialized } = useAuth()

    if (!initialized || loading) {
      return Fallback ? <Fallback /> : <LoadingSpinner />
    }

    if (!supabaseUser) {
      return <LoginPrompt />
    }

    if (requireHandle && !user) {
      // User is authenticated but doesn't have a handle
      // This will be handled by the ProtectedRoute component
      return <div>Please create a handle to continue</div>
    }

    return <Component {...props} />
  }
}

/**
 * Hook to check if user has specific permissions
 */
export function useAuthGuard() {
  const { user, supabaseUser, loading, initialized } = useAuth()

  return {
    isAuthenticated: !!supabaseUser,
    hasHandle: !!user,
    isLoading: loading || !initialized,
    canAccessProtectedRoute: !!supabaseUser && !!user,
    requiresLogin: !supabaseUser,
    requiresHandle: !!supabaseUser && !user,
  }
}

/**
 * Component that conditionally renders content based on auth state
 */
interface AuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  requireHandle?: boolean
  loadingFallback?: React.ReactNode
}

export function AuthGate({
  children,
  fallback,
  requireAuth = false,
  requireHandle = false,
  loadingFallback,
}: AuthGateProps) {
  const { user, supabaseUser, loading, initialized } = useAuth()

  if (!initialized || loading) {
    return <>{loadingFallback || <LoadingSpinner />}</>
  }

  if (requireAuth && !supabaseUser) {
    return <>{fallback || <LoginPrompt />}</>
  }

  if (requireHandle && !user) {
    return <>{fallback || <div>Handle required</div>}</>
  }

  return <>{children}</>
}