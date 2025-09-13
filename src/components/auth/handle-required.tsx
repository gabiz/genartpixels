/**
 * Handle Required Component
 * Wrapper component that shows handle selection when user needs to create one
 */

'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/context'
import { HandleSelection } from '@/components/user/handle-selection'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AuthSuccess } from './auth-success'

interface HandleRequiredProps {
  children: React.ReactNode
}

export function HandleRequired({ children }: HandleRequiredProps) {
  const { user, supabaseUser, loading, initialized } = useAuth()

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show handle selection if user is authenticated but doesn't have a handle
  if (supabaseUser && !user) {
    const handleComplete = () => {
      // Check localStorage for redirect URL
      const redirectTo = localStorage.getItem('auth_redirect')
      
      if (redirectTo && redirectTo !== window.location.pathname) {
        localStorage.removeItem('auth_redirect') // Clean up
        // const redirectUrl = new URL(redirectTo, window.location.origin)
        const redirectUrl = new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL)
        redirectUrl.searchParams.set('auth_success', Date.now().toString())
        window.location.replace(redirectUrl.toString())
      } else {
        // Clear the redirect if we're already on the target page
        localStorage.removeItem('auth_redirect')
      }
      // If no redirect, the component will re-render with the user data
    }
    
    return <HandleSelection onComplete={handleComplete} />
  }

  // Show children if user has a handle or is not authenticated
  return <>{children}</>
}