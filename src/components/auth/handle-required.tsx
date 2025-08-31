/**
 * Handle Required Component
 * Wrapper component that shows handle selection when user needs to create one
 */

'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/context'
import { HandleSelection } from '@/components/user/handle-selection'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
    return <HandleSelection />
  }

  // Show children if user has a handle or is not authenticated
  return <>{children}</>
}