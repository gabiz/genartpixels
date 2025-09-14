'use client'

import { Suspense } from 'react'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function AuthContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Gen Art Pixels
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to start creating and collaborating on pixel art
          </p>
        </div>
        
        <LoginPrompt />
        
        <div className="mt-8 text-center">
          <a 
            href={redirectTo} 
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Back to previous page
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <AuthContent />
    </Suspense>
  )
}