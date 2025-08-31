/**
 * Simple realtime test utilities
 */

import { supabase } from '@/lib/supabase/client'

export async function testRealtimeConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    let isResolved = false
    let subscriptionStatus = 'PENDING'
    
    const testChannel = supabase
      .channel('test-connection', {
        config: {
          broadcast: { self: true, ack: false }
        }
      })
      .on('broadcast', { event: 'test' }, ({ payload }) => {
        console.log('✓ Test broadcast received:', payload)
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(true)
        }
      })

    const cleanup = () => {
      try {
        supabase.removeChannel(testChannel)
      } catch (error) {
        console.warn('Error removing test channel:', error)
      }
    }

    testChannel.subscribe((status, err) => {
      subscriptionStatus = status
      console.log('Test channel status:', status)
      if (err) console.error('Test channel error:', err)
      
      if (status === 'SUBSCRIBED') {
        console.log('✓ Test channel subscribed, sending test message...')
        // Wait a bit before sending to ensure connection is stable
        setTimeout(() => {
          testChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'Hello realtime!', timestamp: Date.now() }
          }).then((response) => {
            console.log('Test message sent:', response)
          }).catch((error) => {
            console.error('Failed to send test message:', error)
          })
        }, 100)
      } else if (status === 'CHANNEL_ERROR') {
        const errorMessage = err?.message || 'Unknown error'
        if (!errorMessage.includes('Unknown Error on Channel')) {
          console.error('Test channel error:', err)
          if (!isResolved) {
            isResolved = true
            cleanup()
            resolve(false)
          }
        }
      } else if (status === 'TIMED_OUT') {
        console.error('Test channel timeout')
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(false)
        }
      } else if (status === 'CLOSED') {
        console.log('Test channel closed')
        if (subscriptionStatus !== 'SUBSCRIBED' && !isResolved) {
          isResolved = true
          cleanup()
          resolve(false)
        }
      }
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!isResolved) {
        console.error('Test timeout - final status:', subscriptionStatus)
        isResolved = true
        cleanup()
        resolve(false)
      }
    }, 10000)
  })
}

export async function testFrameChannel(frameId: string): Promise<boolean> {
  return new Promise((resolve) => {
    let messageReceived = false
    
    const frameChannel = supabase
      .channel(`frame:${frameId}`)
      .on('broadcast', { event: 'test_frame' }, ({ payload }) => {
        console.log('Frame test broadcast received:', payload)
        messageReceived = true
        cleanup()
        resolve(true)
      })
      .on('broadcast', { event: 'pixel_placed' }, ({ payload }) => {
        console.log('Test pixel placement received:', payload)
        messageReceived = true
        cleanup()
        resolve(true)
      })

    const cleanup = () => {
      supabase.removeChannel(frameChannel)
    }

    frameChannel.subscribe((status, err) => {
      console.log(`Frame channel status for ${frameId}:`, status, err)
      
      if (status === 'SUBSCRIBED') {
        console.log('Frame channel subscribed, sending test messages...')
        
        // Send a test frame event
        frameChannel.send({
          type: 'broadcast',
          event: 'test_frame',
          payload: { frameId, message: 'Frame channel test!' }
        })
        
        // Send a test pixel placement event
        setTimeout(() => {
          frameChannel.send({
            type: 'broadcast',
            event: 'pixel_placed',
            payload: { 
              frameId,
              pixel: {
                id: 'test-pixel',
                frame_id: frameId,
                x: 0,
                y: 0,
                color: 0xFF0000FF,
                contributor_handle: 'test-user',
                placed_at: new Date().toISOString()
              }
            }
          })
        }, 500)
        
      } else if (status === 'CHANNEL_ERROR') {
        const errorMessage = err?.message || 'Unknown error'
        if (!errorMessage.includes('Unknown Error on Channel')) {
          console.error('Frame channel error:', err)
          cleanup()
          resolve(false)
        }
      } else if (status === 'TIMED_OUT') {
        console.error('Frame channel timeout')
        cleanup()
        resolve(false)
      }
    })

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!messageReceived) {
        cleanup()
        resolve(false)
      }
    }, 5000)
  })
}