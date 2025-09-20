'use client'

/**
 * Auth redirect handler to manage post-authentication redirects
 * Prevents WebSocket connection issues after OAuth redirects
 */

import { useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'

export function AuthRedirectHandler() {
  // const router = useRouter()
  // const searchParams = useSearchParams()

  // useEffect(() => {
  //   // Check if we just completed an auth redirect
  //   const authSuccess = searchParams.get('auth_success')
    
  //   if (authSuccess) {
  //     // Remove the auth_success parameter from URL without triggering a full reload
  //     const url = new URL(window.location.href)
  //     url.searchParams.delete('auth_success')
      
  //     // Use replace to avoid adding to browser history
  //     window.history.replaceState({}, '', url.toString())
      
  //     // Force a gentle refresh to reset WebSocket connections
  //     setTimeout(() => {
  //       router.refresh()
  //     }, 100)
  //   }
  // }, [searchParams, router])

  return null
}