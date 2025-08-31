'use client'

import { FrameWithStats } from '@/lib/types'
import { FramePreview } from './frame-preview'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FrameGridProps {
  frames: FrameWithStats[]
  loading?: boolean
  error?: string | null
  className?: string
}

export function FrameGrid({ frames, loading = false, error = null, className = '' }: FrameGridProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading frames...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-12 ${className}`}>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <AlertDescription>
            <strong>Error loading frames:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (frames.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">No frames found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search criteria or create a new frame to get started.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {frames.map((frame) => (
        <FramePreview
          key={frame.id}
          frame={frame}
          className="h-full"
        />
      ))}
    </div>
  )
}