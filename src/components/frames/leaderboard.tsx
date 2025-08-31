'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface LeaderboardFrame {
  id: string
  handle: string
  title: string
  owner_handle: string
  contributors_count: number
  total_pixels: number
  likes_count: number
  last_activity: string
  created_at: string
  rank: number
}

interface LeaderboardUser {
  handle: string
  frames_created: number
  frames_contributed_to: number
  total_pixels_placed: number
  frames_liked: number
  rank: number
}

type LeaderboardType = 'frames' | 'users'
type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all'

interface LeaderboardProps {
  initialType?: LeaderboardType
  initialPeriod?: LeaderboardPeriod
  limit?: number
  className?: string
}

export function Leaderboard({
  initialType = 'frames',
  initialPeriod = 'week',
  limit = 10,
  className = ''
}: LeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>(initialType)
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod)
  const [frames, setFrames] = useState<LeaderboardFrame[]>([])
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/leaderboard?type=${type}&period=${period}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const result = await response.json()
      
      if (result.success) {
        if (result.data.frames) {
          setFrames(result.data.frames)
        }
        if (result.data.users) {
          setUsers(result.data.users)
        }
      } else {
        setError(result.error || 'Failed to load leaderboard')
      }
    } catch (err) {
      setError('Failed to load leaderboard')
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [type, period, limit])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-yellow-500">🥇</span>
      case 2:
        return <span className="text-gray-400">🥈</span>
      case 3:
        return <span className="text-amber-600">🥉</span>
      default:
        return <span className="text-gray-500 font-medium">#{rank}</span>
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Leaderboard
        </h3>

        {/* Type and Period Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setType('frames')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                type === 'frames'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Frames
            </button>
            <button
              onClick={() => setType('users')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                type === 'users'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Users
            </button>
          </div>

          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            {(['day', 'week', 'month', 'all'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <svg className="w-6 h-6 animate-spin text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="ml-2 text-gray-500">Loading leaderboard...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>
            <button
              onClick={fetchLeaderboard}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {type === 'frames' && frames.length > 0 && (
              <>
                {frames.map((frame) => (
                  <div
                    key={frame.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 text-center">
                        {getRankIcon(frame.rank)}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/${frame.owner_handle}/${frame.handle}`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {frame.title}
                        </Link>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by @{frame.owner_handle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {formatNumber(frame.likes_count)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {formatNumber(frame.contributors_count)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {formatNumber(frame.total_pixels)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {type === 'users' && users.length > 0 && (
              <>
                {users.map((user) => (
                  <div
                    key={user.handle}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 text-center">
                        {getRankIcon(user.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          @{user.handle}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span title="Frames created">
                          📝 {formatNumber(user.frames_created)}
                        </span>
                        <span title="Pixels placed">
                          🎨 {formatNumber(user.total_pixels_placed)}
                        </span>
                        <span title="Frames contributed to">
                          🤝 {formatNumber(user.frames_contributed_to)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {((type === 'frames' && frames.length === 0) || (type === 'users' && users.length === 0)) && !loading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No {type} found for this period
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}