/**
 * Redis Admin API
 * 
 * Endpoints for Redis cache management and monitoring
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface RedisStats {
  status: 'connected' | 'error'
  memory?: {
    used: string
    peak: string
    fragmentation_ratio: number
  }
  keys?: {
    total: number
    rate_limit: number
    context: number
    session: number
    other: number
  }
  connections?: {
    connected_clients: number
    blocked_clients: number
  }
  uptime_seconds?: number
  error?: string
  timestamp: string
}

export interface FlushResponse {
  success: boolean
  pattern?: string
  deleted_count?: number
  message?: string
  timestamp: string
}

/**
 * Get Redis statistics
 */
export async function getRedisStats(): Promise<RedisStats> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/redis/stats`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to get Redis stats:', error)
    throw error
  }
}

/**
 * Flush Redis keys by pattern
 * @param pattern - Optional pattern (e.g., "rate_limit:*", "context:*", or null for all)
 */
export async function flushRedis(pattern?: string): Promise<FlushResponse> {
  try {
    const url = pattern 
      ? `${BACKEND_URL}/api/admin/redis/flush?pattern=${encodeURIComponent(pattern)}`
      : `${BACKEND_URL}/api/admin/redis/flush`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to flush Redis: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to flush Redis:', error)
    throw error
  }
}

/**
 * Quick flush of rate limit keys only
 */
export async function flushRateLimits(): Promise<FlushResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/redis/flush-rate-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to flush rate limits: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to flush rate limits:', error)
    throw error
  }
}

/**
 * Quick flush of session context and summaries
 */
export async function flushSessions(): Promise<FlushResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/redis/flush-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to flush sessions: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to flush sessions:', error)
    throw error
  }
}
