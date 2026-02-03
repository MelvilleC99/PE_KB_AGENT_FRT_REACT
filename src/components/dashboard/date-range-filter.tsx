import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "lucide-react"

export type DateRange = "today" | "7d" | "30d" | "90d" | "custom"

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={(val) => onChange(val as DateRange)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="90d">Last 90 Days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function getDateRangeLabel(range: DateRange): string {
  switch (range) {
    case "today": return "Today"
    case "7d": return "Last 7 Days"
    case "30d": return "Last 30 Days"
    case "90d": return "Last 90 Days"
    case "custom": return "Custom Range"
  }
}

export function getDateRangeDates(range: DateRange): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0)
      break
    case "7d":
      start.setDate(end.getDate() - 7)
      break
    case "30d":
      start.setDate(end.getDate() - 30)
      break
    case "90d":
      start.setDate(end.getDate() - 90)
      break
    case "custom":
      // Will be handled by custom date picker
      break
  }
  
  return { start, end }
}
