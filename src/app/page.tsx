import { Suspense } from 'react'
import { FrameDashboard } from '@/components/frames'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <FrameDashboard />
        </Suspense>
      </div>
    </div>
  )
}
