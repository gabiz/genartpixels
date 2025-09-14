'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, AuthContextType, AuthState, HandleCreationResponse } from './types'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    loading: true,
    initialized: false,
  })
  
  // Fetch user profile from your own table
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    // global safety net
    const handleGlobalError = () => {
      // if (mounted) {
        setState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
        }))
      // }
    }

    window.addEventListener("error", handleGlobalError)
    window.addEventListener("unhandledrejection", handleGlobalError)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // not found
        throw error
      }
      console.log("user", data)
      return data as User
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true
  
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
  
        if (!mounted) return
  
        if (user) {
          const userProfile = await fetchUserProfile(user)
          setState({
            user: userProfile,
            supabaseUser: user,
            loading: false,
            initialized: true,
          })
        } else {
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            initialized: true,
          })
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
        if (mounted) {
          setState({
            user: null,
            supabaseUser: null,
            loading: false, // 👈 make sure loading is cleared
            initialized: true,
          })
        }
      }
    }
  
    init()
  
    // const { data: subscription } = supabase.auth.onAuthStateChange(
    //   async (_event, session) => {
    //     try {
    //       if (!mounted) return
    //       if (session?.user) {
    //         const userProfile = await fetchUserProfile(session.user)
    //         setState({
    //           user: userProfile,
    //           supabaseUser: session.user,
    //           loading: false,
    //           initialized: true,
    //         })
    //       } else {
    //         setState({
    //           user: null,
    //           supabaseUser: null,
    //           loading: false,
    //           initialized: true,
    //         })
    //       }
    //     } catch (err) {
    //       console.error("Error in onAuthStateChange:", err)
    //       if (mounted) {
    //         setState({
    //           user: null,
    //           supabaseUser: null,
    //           loading: false,
    //           initialized: true,
    //         })
    //       }
    //     }
    //   }
    // )
      
    return () => {
      mounted = false
      // subscription.subscription.unsubscribe()
    }
  }, [fetchUserProfile])
  
  // Sign in
  const signIn = useCallback(async (provider: 'google' | 'github' | 'facebook') => {
    console.log("login in callback", `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Create handle
  const createHandle = useCallback(async (handle: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.supabaseUser) return { success: false, error: 'No authenticated user found' }

    try {
      const response = await fetch('/api/auth/create-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // cookies carry auth
        body: JSON.stringify({ handle }),
      })

      const result: HandleCreationResponse = await response.json()

      if (result.success && result.user) {
        setState(prev => ({ ...prev, user: result.user! }))
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to create handle' }
      }
    } catch (error) {
      console.error('Error creating handle:', error)
      return { success: false, error: 'Network error' }
    }
  }, [state.supabaseUser])

  // Refresh profile
  const refreshUser = useCallback(async () => {
    if (!state.supabaseUser) return
    const userProfile = await fetchUserProfile(state.supabaseUser)
    setState(prev => ({ ...prev, user: userProfile }))
  }, [state.supabaseUser, fetchUserProfile])

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    createHandle,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}