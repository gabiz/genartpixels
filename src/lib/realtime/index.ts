/**
 * Real-time collaboration exports for Gen Art Pixels
 */

export { RealtimeManager, realtimeManager } from './manager'
export type { RealtimeManagerConfig, ConnectionState } from './manager'

export {
  useFrameRealtime,
  useRealtimeConnection,
  useFrameBroadcast,
  useFrameStateUpdates,
  useOfflineDetection
} from './hooks'