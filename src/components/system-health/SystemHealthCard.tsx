import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ServiceStatusBadge } from "./ServiceStatusBadge"
import { formatTimeAgo } from "./utils"
import { checkSystemHealth } from "@/lib/api/system"
import { flushRedis, flushRateLimits, flushSessions } from "@/lib/api/admin/redis"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Redis flush state
  const [showFlushDialog, setShowFlushDialog] = useState(false)
  const [flushType, setFlushType] = useState<'all' | 'rate_limits' | 'sessions' | null>(null)
  const [isFlushing, setIsFlushing] = useState(false)

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
      const response = await checkSystemHealth()
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setHealth(response.data)
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

  const handleFlushClick = (type: 'all' | 'rate_limits' | 'sessions') => {
    setFlushType(type)
    setShowFlushDialog(true)
  }

  const handleFlushConfirm = async () => {
    if (!flushType) return

    setIsFlushing(true)

    try {
      let result
      let description = ''

      switch (flushType) {
        case 'rate_limits':
          result = await flushRateLimits()
          description = `Flushed ${result.deleted_count} rate limit keys`
          break
        case 'sessions':
          result = await flushSessions()
          description = `Flushed ${result.deleted_count} session keys`
          break
        case 'all':
          result = await flushRedis()
          description = 'All Redis keys flushed'
          break
      }

      toast({
        title: "✅ Redis flushed successfully",
        description,
      })

      // Refresh health check
      checkHealth()

    } catch (error) {
      console.error('Flush failed:', error)
      toast({
        title: "❌ Flush failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsFlushing(false)
      setShowFlushDialog(false)
      setFlushType(null)
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
        <div className="flex gap-1">
          {/* Redis Flush Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                title="Redis cache controls"
                disabled={isFlushing}
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFlushClick('rate_limits')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Flush Rate Limits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFlushClick('sessions')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Flush Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleFlushClick('all')}
                className="text-red-600"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Flush All Keys
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={checkHealth}
            disabled={checking}
            title="Refresh system health"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {health?.services && Object.entries(health.services).map(([name, service]) => (
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

      {/* Flush Confirmation Dialog */}
      <AlertDialog open={showFlushDialog} onOpenChange={setShowFlushDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {flushType === 'all' ? '⚠️ Flush All Redis Keys?' : 'Flush Redis Cache?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {flushType === 'all' && (
                <span className="text-red-600 font-semibold">
                  This will delete ALL keys in Redis including rate limits, sessions, and context. This action cannot be undone.
                </span>
              )}
              {flushType === 'rate_limits' && (
                <span>
                  This will reset all rate limit counters. Users will be able to make new queries immediately.
                </span>
              )}
              {flushType === 'sessions' && (
                <span>
                  This will clear all session context and conversation history from cache. Active sessions will need to rebuild context.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFlushing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFlushConfirm}
              disabled={isFlushing}
              className={flushType === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isFlushing ? 'Flushing...' : 'Flush Cache'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
