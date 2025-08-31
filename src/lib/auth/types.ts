/**
 * Authentication-related TypeScript types
 */

import { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  handle: string
  email: string
  avatar_url?: string
  pixels_available: number
  last_refill: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  initialized: boolean
}

export interface AuthContextType extends AuthState {
  signIn: (provider: 'google' | 'github' | 'facebook') => Promise<void>
  signOut: () => Promise<void>
  createHandle: (handle: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

export interface HandleCreationRequest {
  handle: string
}

export interface HandleCreationResponse {
  success: boolean
  user?: User
  error?: string
}