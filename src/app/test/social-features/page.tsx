'use client'

import { useState } from 'react'
import { 
  LikeButton, 
  ReportButton, 
  Leaderboard, 
  FrameStats, 
  DetailedFrameStats 
} from '@/components/frames'
import { PixelInfoTooltip } from '@/components/canvas'
import { FrameWithStats } from '@/lib/types'

// Mock frame data for testing
const mockFrame: FrameWithStats = {
  id: 'frame-123',
  handle: 'view-test',
  title: 'Test Collaborative Frame',
  description: 'A test frame for demonstrating social features',
  keywords: ['test', 'social', 'demo'],
  owner_handle: 'viewtester',
  width: 64,
  height: 64,
  permissions: 'open',
  is_frozen: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stats: {
    frame_id: 'frame-123',
    contributors_count: 15,
    total_pixels: 1250,
    likes_count: 42,
    last_activity: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  }
}

export default function SocialFeaturesTestPage() {
  const [showPixelTooltip, setShowPixelTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const handleShowPixelInfo = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setShowPixelTooltip(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Social Features Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing all social engagement features for Gen Art Pixels
          </p>
        </div>

        {/* Like and Report Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Like & Report Buttons
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Small:</span>
              <LikeButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                initialLiked={false}
                initialLikesCount={mockFrame.stats.likes_count}
                size="sm"
              />
              <ReportButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                frameTitle={mockFrame.title}
                size="sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium:</span>
              <LikeButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                initialLiked={true}
                initialLikesCount={mockFrame.stats.likes_count}
                size="md"
              />
              <ReportButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                frameTitle={mockFrame.title}
                size="md"
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Large:</span>
              <LikeButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                initialLiked={false}
                initialLikesCount={mockFrame.stats.likes_count}
                size="lg"
              />
              <ReportButton
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                frameTitle={mockFrame.title}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Frame Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Frame Statistics
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Horizontal Layout
              </h3>
              <FrameStats frame={mockFrame} layout="horizontal" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Vertical Layout
              </h3>
              <FrameStats frame={mockFrame} layout="vertical" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Grid Layout
              </h3>
              <FrameStats frame={mockFrame} layout="grid" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Detailed Stats
              </h3>
              <DetailedFrameStats frame={mockFrame} />
            </div>
          </div>
        </div>

        {/* Pixel Info Tooltip */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pixel Info Tooltip
          </h2>
          
          <div className="relative">
            <div 
              className="w-64 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600"
              onClick={handleShowPixelInfo}
            >
              <span className="text-gray-500 dark:text-gray-400">
                Click to show pixel info tooltip
              </span>
            </div>

            {showPixelTooltip && (
              <PixelInfoTooltip
                frameOwnerHandle={mockFrame.owner_handle}
                frameHandle={mockFrame.handle}
                x={62}
                y={32}
                visible={showPixelTooltip}
                onClose={() => setShowPixelTooltip(false)}
                className="absolute"
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y
                }}
              />
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Leaderboard />
        </div>

        {/* API Testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            API Testing
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Test API Endpoints
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <strong>Like API:</strong> POST/GET /api/frames/{mockFrame.owner_handle}/{mockFrame.handle}/like
                </div>
                <div>
                  <strong>Report API:</strong> POST /api/frames/{mockFrame.owner_handle}/{mockFrame.handle}/report
                </div>
                <div>
                  <strong>Pixel Info API:</strong> GET /api/frames/{mockFrame.owner_handle}/{mockFrame.handle}/pixel?x=0&y=0
                </div>
                <div>
                  <strong>Leaderboard API:</strong> GET /api/leaderboard?type=frames&period=week&limit=10
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  fetch(`/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}/like`)
                    .then(res => res.json())
                    .then(data => console.log('Like status:', data))
                    .catch(err => console.error('Error:', err))
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Like Status API
              </button>

              <button
                onClick={() => {
                  fetch(`/api/frames/${mockFrame.owner_handle}/${mockFrame.handle}/pixel?x=62&y=32`)
                    .then(res => res.json())
                    .then(data => console.log('Pixel info:', data))
                    .catch(err => console.error('Error:', err))
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Pixel Info API
              </button>

              <button
                onClick={() => {
                  fetch('/api/leaderboard?type=frames&period=week&limit=5')
                    .then(res => res.json())
                    .then(data => console.log('Leaderboard:', data))
                    .catch(err => console.error('Error:', err))
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test Leaderboard API
              </button>

              <button
                onClick={() => {
                  console.log('Check browser console for API responses')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Check Console
              </button>
            </div>
          </div>
        </div>

        {/* Feature Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Implementation Status
          </h2>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Like/Unlike functionality for frames</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Reporting system for offensive content</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Contributor attribution display (click pixel to see contributor)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Frame statistics display and leaderboard components</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Integration with existing frame viewer and dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}