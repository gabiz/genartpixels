/**
 * Auth Success Component
 * Shows a success message and continue button after authentication
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthSuccess() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    const redirect = localStorage.getItem('auth_redirect')
    setRedirectTo(redirect)
  }, [])

  const handleContinue = () => {
    if (redirectTo) {
      localStorage.removeItem('auth_redirect')
      window.location.href = redirectTo
    } else {
      window.location.href = '/'
    }
  }

  if (!redirectTo) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-green-800">Welcome to Gen Art Pixels!</CardTitle>
          <CardDescription>
            You&apos;ve successfully signed in. Ready to start creating pixel art?
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleContinue} className="w-full">
            Continue to Frame
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            You&apos;ll be taken back to where you started
          </p>
        </CardContent>
      </Card>
    </div>
  )
}