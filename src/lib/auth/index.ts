/**
 * Authentication module exports
 */

// Context and hooks
export { AuthProvider, useAuth } from './context'

// Types
export type { 
  User, 
  AuthState, 
  AuthContextType, 
  HandleCreationRequest,
  HandleCreationResponse 
} from './types'

// Re-export AuthProvider type from config as AuthProviderType to avoid naming conflict
export type { AuthProvider as AuthProviderType } from './config'

// Configuration
export { AUTH_PROVIDERS, AUTH_CONFIG } from './config'

// Guards and utilities
export { withAuth, useAuthGuard, AuthGate } from './guards'

// Components
export { ProtectedRoute } from '@/components/auth/protected-route'
export { LoginPrompt } from '@/components/auth/login-prompt'