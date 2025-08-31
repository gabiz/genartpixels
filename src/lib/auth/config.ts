/**
 * Authentication configuration for Supabase Auth
 * Supports Google, GitHub, and Facebook SSO providers
 */

import { Provider } from '@supabase/supabase-js'

export const AUTH_PROVIDERS = {
  GOOGLE: 'google' as Provider,
  GITHUB: 'github' as Provider,
  FACEBOOK: 'facebook' as Provider,
} as const

export const AUTH_CONFIG = {
  // Redirect URLs for OAuth flows
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  
  // Provider-specific options
  providers: {
    google: {
      scopes: 'email profile',
    },
    github: {
      scopes: 'user:email',
    },
    facebook: {
      scopes: 'email',
    },
  },
  
  // Session configuration
  session: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
} as const

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS]