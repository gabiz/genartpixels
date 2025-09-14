'use client'

import { FrameWithStats } from '@/lib/types'

interface FrameStatsProps {
  frame: FrameWithStats
  className?: string
  layout?: 'horizontal' | 'vertical' | 'grid'
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function FrameStats({
  frame,
  className = '',
  layout = 'horizontal',
  showLabels = true,
  size = 'md'
}: FrameStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs',
      spacing: 'space-x-2'
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      spacing: 'space-x-3'
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      spacing: 'space-x-4'
    }
  }

  const layoutClasses = {
    horizontal: `flex items-center ${sizeClasses[size].spacing}`,
    vertical: 'flex flex-col space-y-2',
    grid: 'grid grid-cols-2 gap-2'
  }

  const stats = [
    {
      key: 'likes',
      label: 'Likes',
      value: frame.stats.likes_count,
      icon: (
        <svg className={sizeClasses[size].icon} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-red-500'
    },
    {
      key: 'contributors',
      label: 'Contributors',
      value: frame.stats.contributors_count,
      icon: (
        <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-blue-500'
    },
    {
      key: 'pixels',
      label: 'Pixels',
      value: frame.stats.total_pixels,
      icon: (
        <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'text-green-500'
    },
    {
      key: 'activity',
      label: 'Last Activity',
      value: frame.stats.last_activity ? formatTimeAgo(frame.stats.last_activity) : (frame.created_at ? formatTimeAgo(frame.created_at) : 'Unknown'),
      icon: (
        <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-gray-500',
      isTime: true
    }
  ]

  const StatItem = ({ stat }: { stat: typeof stats[0] }) => (
    <div className={`flex items-center ${layout === 'vertical' || layout === 'grid' ? 'justify-start' : ''}`}>
      <div className={`${stat.color} mr-1`}>
        {stat.icon}
      </div>
      <span className={`${sizeClasses[size].text} text-gray-600 dark:text-gray-400`}>
        {stat.isTime ? stat.value : formatNumber(stat.value as number)}
        {showLabels && layout !== 'horizontal' && (
          <span className="ml-1 text-gray-500 dark:text-gray-500">
            {stat.label.toLowerCase()}
          </span>
        )}
      </span>
    </div>
  )

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {stats.map((stat) => (
        <StatItem key={stat.key} stat={stat} />
      ))}
    </div>
  )
}

// Compact version for use in previews
export function CompactFrameStats({ frame, className = '' }: { frame: FrameWithStats; className?: string }) {
  return (
    <FrameStats
      frame={frame}
      className={className}
      layout="horizontal"
      showLabels={false}
      size="sm"
    />
  )
}

// Detailed version for frame pages
export function DetailedFrameStats({ frame, className = '' }: { frame: FrameWithStats; className?: string }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Frame Statistics</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">
            {formatNumber(frame.stats.likes_count || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {formatNumber(frame.stats.contributors_count || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Contributors</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {formatNumber(frame.stats.total_pixels || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pixels Placed</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
            {frame.width}×{frame.height}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Dimensions</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Created: {frame.created_at ? new Date(frame.created_at).toLocaleDateString() : 'Unknown'}</span>
          <span>
            Last activity: {frame.stats.last_activity ? formatTimeAgo(frame.stats.last_activity) : 'None'}
          </span>
        </div>
      </div>
    </div>
  )
}