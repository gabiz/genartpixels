/**
 * Not found page for frame routes
 * Displayed when a frame doesn't exist or user doesn't have permission to view it
 */

import Link from 'next/link'

export default function FrameNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Frame Not Found
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The frame you&apos;re looking for doesn&apos;t exist, has been deleted, or you don&apos;t have permission to view it.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            Browse All Frames
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Looking for something specific?</p>
            <Link
              href="/search"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try searching for frames
            </Link>
          </div>
        </div>
        
        {/* <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Create Your Own Frame
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Start your own collaborative pixel art project and invite others to contribute.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Frame
          </Link>
        </div> */}
      </div>
    </div>
  )
}