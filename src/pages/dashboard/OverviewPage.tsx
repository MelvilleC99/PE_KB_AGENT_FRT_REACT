import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, getDocs } from "firebase/firestore"
import { MetricCard } from "@/components/dashboard/metric-card"
import { KBOverviewCard } from "@/components/dashboard/kb-overview-card"
import { DateRangeFilter, type DateRange, getDateRangeLabel } from "@/components/dashboard/date-range-filter"
import { SystemHealthCard } from "@/components/system-health/SystemHealthCard"
import { 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Ticket
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardMetrics {
  queries: { total: number }
  confidence: { average: number }
  feedback: {
    positive: number
    negative: number
    agentFailures: number
    ticketsRaised: number
  }
  kb: {
    total: number
    byType: {
      how_to: { total: number; synced: number; pending: number }
      definition: { total: number; synced: number; pending: number }
      error: { total: number; synced: number; pending: number }
    }
    unusedCount: number
    lastCreated: string | null
  }
  cost: {
    total: number | null
    tokens: number | null
  }
}

export function OverviewPage() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [dateRange])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const end = new Date()
      const start = new Date()
      
      switch (dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0)
          break
        case '7d':
          start.setDate(end.getDate() - 7)
          break
        case '30d':
          start.setDate(end.getDate() - 30)
          break
        case '90d':
          start.setDate(end.getDate() - 90)
          break
      }

      console.log(`📊 Fetching dashboard metrics for ${dateRange}`)

      // Fetch all collections directly from client
      const [
        kbStatsSnapshot,
        responseFeedbackSnapshot,
        agentFailuresSnapshot,
        kbEntriesSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'kb_stats')),
        getDocs(collection(db, 'response_feedback')),
        getDocs(collection(db, 'agent_failures')),
        getDocs(collection(db, 'kb_entries'))
      ])

      console.log(`✅ Fetched: ${kbStatsSnapshot.size} kb_stats, ${responseFeedbackSnapshot.size} feedback`)

      // Filter kb_stats by date
      const kbStatsFiltered = kbStatsSnapshot.docs.filter(doc => {
        const data = doc.data()
        const lastUsed = data.last_used
        if (!lastUsed) return false
        try {
          const date = new Date(lastUsed)
          return date >= start && date <= end
        } catch {
          return false
        }
      })

      // Filter response_feedback by date
      const feedbackFiltered = responseFeedbackSnapshot.docs.filter(doc => {
        const data = doc.data()
        const timestamp = data.timestamp
        if (!timestamp) return false
        try {
          const date = new Date(timestamp)
          return date >= start && date <= end
        } catch {
          return false
        }
      })

      // Filter agent_failures by date
      const failuresFiltered = agentFailuresSnapshot.docs.filter(doc => {
        const data = doc.data()
        const timestamp = data.timestamp
        if (!timestamp) return false
        try {
          const date = new Date(timestamp)
          return date >= start && date <= end
        } catch {
          return false
        }
      })

      // Process queries
      const totalQueries = kbStatsFiltered.reduce((sum, doc) => {
        return sum + (doc.data().usage_count || 0)
      }, 0)

      // Process confidence
      const confidenceScores = feedbackFiltered
        .map(doc => doc.data().confidence_score)
        .filter(score => typeof score === 'number')
      
      const avgConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0

      // Process feedback
      const positiveFeedback = feedbackFiltered.filter(
        doc => doc.data().feedback_type === 'positive'
      ).length
      
      const negativeFeedback = feedbackFiltered.filter(
        doc => doc.data().feedback_type === 'negative'
      ).length

      // Process agent failures
      const agentFailureCount = failuresFiltered.length
      
      const ticketsRaised = failuresFiltered.filter(
        doc => doc.data().ticket_created === true
      ).length

      // Process KB entries
      const kbEntries = kbEntriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const totalEntries = kbEntries.length
      
      const byType = {
        how_to: {
          total: kbEntries.filter((e: any) => e.type === 'how_to').length,
          synced: kbEntries.filter((e: any) => e.type === 'how_to' && e.vectorStatus === 'synced').length,
          pending: kbEntries.filter((e: any) => e.type === 'how_to' && e.vectorStatus !== 'synced').length
        },
        definition: {
          total: kbEntries.filter((e: any) => e.type === 'definition').length,
          synced: kbEntries.filter((e: any) => e.type === 'definition' && e.vectorStatus === 'synced').length,
          pending: kbEntries.filter((e: any) => e.type === 'definition' && e.vectorStatus !== 'synced').length
        },
        error: {
          total: kbEntries.filter((e: any) => e.type === 'error').length,
          synced: kbEntries.filter((e: any) => e.type === 'error' && e.vectorStatus === 'synced').length,
          pending: kbEntries.filter((e: any) => e.type === 'error' && e.vectorStatus !== 'synced').length
        }
      }

      // Count unused entries
      const usedEntryIds = new Set(kbStatsFiltered.map(doc => doc.data().parent_entry_id).filter(Boolean))
      const unusedCount = kbEntries.filter((e: any) => !usedEntryIds.has(e.id)).length

      // Get last created entry
      const sortedEntries = kbEntries
        .filter((e: any) => e.createdAt)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt)
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt)
          return bTime.getTime() - aTime.getTime()
        })
      
      const lastCreated = sortedEntries.length > 0 
        ? (sortedEntries[0].createdAt?.toDate?.() || new Date(sortedEntries[0].createdAt)).toISOString()
        : null

      setMetrics({
        queries: { total: totalQueries },
        confidence: { average: avgConfidence },
        feedback: {
          positive: positiveFeedback,
          negative: negativeFeedback,
          agentFailures: agentFailureCount,
          ticketsRaised: ticketsRaised
        },
        kb: {
          total: totalEntries,
          byType,
          unusedCount,
          lastCreated
        },
        cost: {
          total: null,
          tokens: null
        }
      })

      console.log(`✅ Metrics loaded: ${totalQueries} queries`)

    } catch (error: any) {
      console.error('Failed to load metrics:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard metrics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-600"
    if (confidence >= 0.5) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Overview of your knowledge base</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Top Row - 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Queries */}
        <MetricCard
          title="Total Queries"
          value={metrics?.queries.total || 0}
          subtitle={getDateRangeLabel(dateRange)}
          icon={MessageSquare}
          iconColor="text-blue-600"
        />

        {/* Cost & Tokens */}
        <MetricCard
          title="Cost & Tokens"
          value="Coming Soon"
          subtitle="Cost tracking in development"
          icon={DollarSign}
          iconColor="text-green-600"
        />

        {/* Average Confidence */}
        <MetricCard
          title="Average Confidence"
          value={`${((metrics?.confidence.average || 0) * 100).toFixed(1)}%`}
          subtitle={getDateRangeLabel(dateRange)}
          icon={TrendingUp}
          iconColor={getConfidenceColor(metrics?.confidence.average || 0)}
        />

        {/* Feedback Summary */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Feedback Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Positive</span>
              </div>
              <span className="font-bold">{metrics?.feedback.positive || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">Negative</span>
              </div>
              <span className="font-bold">{metrics?.feedback.negative || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-600" />
                <span className="text-gray-600">Agent Failures</span>
              </div>
              <span className="font-bold">{metrics?.feedback.agentFailures || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-purple-600" />
                <span className="text-gray-600">Tickets Raised</span>
              </div>
              <span className="font-bold">{metrics?.feedback.ticketsRaised || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - 2 Large Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KB Overview */}
        <KBOverviewCard
          data={{
            total: metrics?.kb.total || 0,
            byType: metrics?.kb.byType || {
              how_to: { total: 0, synced: 0, pending: 0 },
              definition: { total: 0, synced: 0, pending: 0 },
              error: { total: 0, synced: 0, pending: 0 }
            },
            unusedCount: metrics?.kb.unusedCount || 0,
            lastCreated: metrics?.kb.lastCreated ? new Date(metrics.kb.lastCreated) : null
          }}
          loading={loading}
        />

        {/* System Health */}
        <SystemHealthCard />
      </div>
    </div>
  )
}
