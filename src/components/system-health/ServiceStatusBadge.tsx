import { Badge } from "@/components/ui/badge"
import { ServiceHealth } from "./SystemHealthCard"

interface ServiceStatusBadgeProps {
  service: ServiceHealth
}

export function ServiceStatusBadge({ service }: ServiceStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-600 text-white hover:bg-green-700'
      case 'degraded': return 'bg-yellow-600 text-white hover:bg-yellow-700'
      case 'down': return 'bg-red-600 text-white hover:bg-red-700'
      default: return 'bg-gray-600 text-white hover:bg-gray-700'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        className={`text-xs capitalize min-w-[70px] justify-center ${getStatusColor(service.status)}`}
        title={service.message}
      >
        {service.status}
      </Badge>
      {service.response_time_ms !== undefined && service.response_time_ms !== null && (
        <span className="text-xs text-gray-500 font-mono w-[60px] text-right">
          {service.response_time_ms.toFixed(0)}ms
        </span>
      )}
    </div>
  )
}
