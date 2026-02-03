
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { CATEGORIES, KB_TEMPLATES, USER_TYPES } from "@/lib/template-loader"

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: string
  onTypeFilterChange: (type: string) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
  userTypeFilter: string
  onUserTypeFilterChange: (userType: string) => void
  onClearFilters: () => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  userTypeFilter,
  onUserTypeFilterChange,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters = searchQuery || typeFilter || categoryFilter || userTypeFilter

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {KB_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userTypeFilter} onValueChange={onUserTypeFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All user types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All user types</SelectItem>
            {USER_TYPES.map((userType) => (
              <SelectItem key={userType.value} value={userType.value}>
                {userType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="icon" onClick={onClearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
