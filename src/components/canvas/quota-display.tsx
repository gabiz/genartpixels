'use client'

/**
 * Quota display component showing user's pixel placement quota
 * Displays current quota, refill time, and visual progress indicator
 */

import React, { useState, useEffect } from 'react'
import { VALIDATION_CONSTRAINTS } from '@/lib/types'

export interface QuotaDisplayProps {
  currentQuota: number
  lastRefill: string | Date
  className?: string
}

export function QuotaDisplay({ 
  currentQuota, 
  lastRefill, 
  className = '' 
}: QuotaDisplayProps) {
  const [timeUntilRefill, setTimeUntilRefill] = useState<string>('')
  const [nextRefillTime, setNextRefillTime] = useState<Date | null>(null)

  const maxQuota = VALIDATION_CONSTRAINTS.PIXELS.MAX_PER_HOUR
  const quotaPercentage = (currentQuota / maxQuota) * 100

  // Calculate next refill time and countdown
  useEffect(() => {
    const refillDate = new Date(lastRefill)
    const nextRefill = new Date(refillDate.getTime() + VALIDATION_CONSTRAINTS.PIXELS.REFILL_INTERVAL_MS)
    setNextRefillTime(nextRefill)

    const updateCountdown = () => {
      const now = new Date()
      const timeDiff = nextRefill.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeUntilRefill('Ready for refill')
      } else {
        const minutes = Math.floor(timeDiff / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
        setTimeUntilRefill(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [lastRefill])

  const getQuotaColor = () => {
    if (quotaPercentage >= 50) return 'bg-green-500'
    if (quotaPercentage >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getQuotaStatus = () => {
    if (currentQuota === 0) return 'No pixels available'
    if (currentQuota === maxQuota) return 'Quota full'
    if (currentQuota >= maxQuota * 0.75) return 'Quota high'
    if (currentQuota >= maxQuota * 0.25) return 'Quota medium'
    return 'Quota low'
  }

  return (
    <div className={`quota-display ${className}`}>
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Pixel Quota</h3>
          <span className="text-sm font-mono text-gray-600">
            {currentQuota}/{maxQuota}
          </span>
        </div>
        <p className="text-xs text-gray-500">{getQuotaStatus()}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getQuotaColor()}`}
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
      </div>

      {/* Refill information */}
      <div className="text-xs text-gray-600">
        {currentQuota < maxQuota ? (
          <div>
            <div className="flex items-center justify-between">
              <span>Next refill:</span>
              <span className="font-mono">{timeUntilRefill}</span>
            </div>
            {nextRefillTime && (
              <div className="text-gray-500 mt-1">
                {nextRefillTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-green-600">
            ✓ Quota is full
          </div>
        )}
      </div>

      {/* Quota explanation */}
      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
        <div className="font-medium">How it works:</div>
        <div>• You get {maxQuota} pixels per hour</div>
        <div>• Quota refills automatically</div>
      </div>
    </div>
  )
}