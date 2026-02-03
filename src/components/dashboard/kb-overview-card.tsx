import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud } from "lucide-react"

interface KBOverviewData {
  total: number
  byType: {
    how_to: { total: number; synced: number; pending: number }
    definition: { total: number; synced: number; pending: number }
    error: { total: number; synced: number; pending: number }
  }
  unusedCount: number
  lastCreated?: Date | null
}

interface KBOverviewCardProps {
  data: KBOverviewData
  loading?: boolean
}

export function KBOverviewCard({ data, loading }: KBOverviewCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Knowledge Base Overview</CardTitle>
          <Cloud className="w-5 h-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Entries */}
        <div className="flex items-center justify-between pb-3 border-b">
          <span className="text-sm font-medium text-gray-600">Total Entries</span>
          <span className="text-2xl font-bold">{data.total}</span>
        </div>

        {/* By Type */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">By Type:</div>
          
          {/* How-To */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">• How-To Guides</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{data.byType.how_to.total}</span>
              <div className="flex gap-1">
                <Badge variant="default" className="text-xs">
                  {data.byType.how_to.synced} synced
                </Badge>
                {data.byType.how_to.pending > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.byType.how_to.pending} pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Definitions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">• Definitions</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{data.byType.definition.total}</span>
              <div className="flex gap-1">
                <Badge variant="default" className="text-xs">
                  {data.byType.definition.synced} synced
                </Badge>
                {data.byType.definition.pending > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.byType.definition.pending} pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Errors */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">• Errors</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{data.byType.error.total}</span>
              <div className="flex gap-1">
                <Badge variant="default" className="text-xs">
                  {data.byType.error.synced} synced
                </Badge>
                {data.byType.error.pending > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.byType.error.pending} pending
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unused Entries */}
        {data.unusedCount > 0 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-gray-600">Unused Entries</span>
            <Badge variant="outline" className="text-xs">
              {data.unusedCount} never cited
            </Badge>
          </div>
        )}

        {/* Last Created */}
        {data.lastCreated && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-gray-600">Last Entry Created</span>
            <span className="text-sm font-medium text-gray-700">
              {formatTimeAgo(data.lastCreated)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
