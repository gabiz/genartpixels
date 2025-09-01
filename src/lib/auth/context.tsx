'use client'

/**
 * Authentication context provider for managing user state
 * Handles SSO authentication, user session management, and handle creation
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { AUTH_PROVIDERS, AUTH_CONFIG } from './config'
import type { AuthContextType, AuthState, User, HandleCreationResponse } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    loading: true,
    initialized: false,
  })

  // Handle redirect for users who already have accounts - DISABLED DUE TO WEBSOCKET ISSUES
  // useEffect(() => {
  //   // Only run this effect once when the user is fully loaded
  //   if (state.initialized && state.user && !state.loading) {
  //     const redirectTo = localStorage.getItem('auth_redirect')
  //     console.log('Checking for redirect:', redirectTo, 'current path:', window.location.pathname)
      
  //     if (redirectTo && redirectTo !== window.location.pathname) {
  //       console.log('Redirecting to:', redirectTo)
  //       localStorage.removeItem('auth_redirect')
        
  //       // Use replace to avoid WebSocket issues and don't keep in history
  //       setTimeout(() => {
  //         const redirectUrl = new URL(redirectTo, window.location.origin)
  //         redirectUrl.searchParams.set('auth_success', Date.now().toString())
  //         window.location.replace(redirectUrl.toString())
  //       }, 100)
  //     } else if (redirectTo) {
  //       // We're already on the target page, just clean up
  //       console.log('Already on target page, cleaning up redirect')
  //       localStorage.removeItem('auth_redirect')
  //     }
  //   }
  // }, [state.initialized, state.user, state.loading])

  // Fetch user profile from our users table
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    console.log('fetchUserProfile called for user:', supabaseUser.id)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.log('fetchUserProfile error:', error.code, error.message)
        if (error.code === 'PGRST116') {
          // User not found in our users table - they need to create a handle
          return null
        }
        throw error
      }

      console.log('fetchUserProfile success:', data.handle)
      return data as User
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }, [])



  // Initialize auth state and set up auth listener
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, initialized: true }))
          }
          return
        }

        if (session?.user && mounted) {
          const userProfile = await fetchUserProfile(session.user)
          setState({
            user: userProfile,
            supabaseUser: session.user,
            loading: false,
            initialized: true,
          })
        } else if (mounted) {
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            initialized: true,
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }))
        }
      }
    }

    initializeAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session?.user)
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Fetching user profile for SIGNED_IN')
          const userProfile = await fetchUserProfile(session.user)
          setState({
            user: userProfile,
            supabaseUser: session.user,
            loading: false,
            initialized: true,
          })
        } else if (event === 'SIGNED_OUT') {
          console.log('Handling SIGNED_OUT')
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            initialized: true,
          })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Handling TOKEN_REFRESHED')
          // Refresh user profile on token refresh
          const userProfile = await fetchUserProfile(session.user)
          setState(prev => ({
            ...prev,
            user: userProfile,
            supabaseUser: session.user,
          }))
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  // Sign in with OAuth provider
  const signIn = useCallback(async (provider: 'google' | 'github' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: AUTH_PROVIDERS[provider.toUpperCase() as keyof typeof AUTH_PROVIDERS],
        options: {
          redirectTo: AUTH_CONFIG.redirectTo,
          scopes: AUTH_CONFIG.providers[provider]?.scopes,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [])

  // Create user handle after SSO authentication
  const createHandle = useCallback(async (handle: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.supabaseUser) {
      return { success: false, error: 'No authenticated user found' }
    }

    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Include authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/auth/create-handle', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ handle }),
      })

      const result: HandleCreationResponse = await response.json()

      if (result.success && result.user) {
        // Update local state with new user profile
        setState(prev => ({
          ...prev,
          user: result.user!,
        }))
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to create handle' }
      }
    } catch (error) {
      console.error('Error creating handle:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }, [state.supabaseUser])

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (!state.supabaseUser) return

    try {
      const userProfile = await fetchUserProfile(state.supabaseUser)
      setState(prev => ({
        ...prev,
        user: userProfile,
      }))
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [state.supabaseUser, fetchUserProfile])

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signOut,
    createHandle,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}