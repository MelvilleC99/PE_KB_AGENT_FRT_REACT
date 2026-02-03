import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { ServiceStatusBadge } from "./ServiceStatusBadge"
import { formatTimeAgo } from "./utils"
import { checkSystemHealth } from "@/lib/api/system"

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  message: string
  response_time_ms?: number | null
  model?: string
  dimensions?: number | null
}

export interface SystemHealthData {
  timestamp: number
  overall_status: 'healthy' | 'degraded' | 'down'
  services: {
    redis: ServiceHealth
    firebase: ServiceHealth
    astra: ServiceHealth
    openai_chat: ServiceHealth
    openai_embeddings: ServiceHealth
  }
  summary: {
    total: number
    healthy: number
    degraded: number
    down: number
  }
}

export function SystemHealthCard() {
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check immediately on mount
    checkHealth()
    
    // Then check every 5 minutes (300000ms)
    const interval = setInterval(checkHealth, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    setChecking(true)
    setError(null)
    
    try {
      const data = await checkSystemHealth()
      
      if (data.error) {
        setError(data.error)
      } else {
        setHealth(data)
        setLastChecked(Date.now())
      }
    } catch (err) {
      console.error('Health check failed:', err)
      setError('Unable to connect to backend')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-600 text-white hover:bg-green-700'
      case 'degraded': return 'bg-yellow-600 text-white hover:bg-yellow-700'
      case 'down': return 'bg-red-600 text-white hover:bg-red-700'
      default: return 'bg-gray-600 text-white hover:bg-gray-700'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !health) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm">System Health</CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={checkHealth}
            disabled={checking}
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            ❌ {error}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={checkHealth}
            disabled={checking}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">System Health</CardTitle>
          {health && (
            <Badge className={getOverallStatusBadge(health.overall_status)}>
              {health.overall_status}
            </Badge>
          )}
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={checkHealth}
          disabled={checking}
          title="Refresh system health"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {health && Object.entries(health.services).map(([name, service]) => (
            <div key={name} className="flex justify-between items-center">
              <span className="text-sm capitalize">
                {name.replace('_', ' ')}
              </span>
              <ServiceStatusBadge service={service} />
            </div>
          ))}
        </div>

        {/* Last Checked */}
        {lastChecked && (
          <p className="text-xs text-gray-500 mt-3">
            Last checked: {formatTimeAgo(lastChecked)}
          </p>
        )}

        {/* Error Message */}
        {error && health && (
          <p className="text-xs text-yellow-600 mt-2">
            ⚠️ {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
