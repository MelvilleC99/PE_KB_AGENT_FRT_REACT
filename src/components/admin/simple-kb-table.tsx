
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Upload, Trash2, MoreHorizontal, Loader } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { KBEntry } from "@/lib/types/kb"

interface KBEntryWithStatus extends KBEntry {
  vectorStatus: 'pending' | 'synced' | 'failed';
  lastSyncedAt?: Date;
  syncError?: string;
}

interface SimpleKBTableProps {
  entries: KBEntryWithStatus[]
  onEdit?: (entry: KBEntry) => void
  onDelete?: (entryId: string) => void
  onView?: (entry: KBEntry) => void
  onSync?: (entry: KBEntry) => void
  syncingEntryId?: string | null
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (column: string) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

const formatDate = (date: any): string => {
  if (!date) return '-'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export function SimpleKBTable({ entries, onEdit, onDelete, onView, onSync, syncingEntryId, sortBy, sortOrder, onSort, selectedIds, onSelectionChange }: SimpleKBTableProps) {
  const selectable = !!onSelectionChange && !!selectedIds

  const allVisibleSelected = selectable && entries.length > 0 && entries.every(e => e.id && selectedIds.has(e.id))
  const someSelected = selectable && entries.some(e => e.id && selectedIds.has(e.id))

  const toggleSelectAll = () => {
    if (!onSelectionChange) return
    if (allVisibleSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(entries.map(e => e.id!).filter(Boolean)))
    }
  }

  const toggleSelect = (entryId: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(entryId)) {
      next.delete(entryId)
    } else {
      next.add(entryId)
    }
    onSelectionChange(next)
  }

  const SortableHeader = ({ column, children }: { column: string, children: React.ReactNode }) => (
    <TableHead 
      onClick={() => onSort?.(column)}
      className={onSort ? "cursor-pointer hover:bg-gray-50 select-none" : ""}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </TableHead>
  )
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No entries found
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
            )}
            <SortableHeader column="title">Title</SortableHeader>
            <SortableHeader column="type">Type</SortableHeader>
            <SortableHeader column="category">Category</SortableHeader>
            <SortableHeader column="createdBy">Created By</SortableHeader>
            <SortableHeader column="created">Created</SortableHeader>
            <SortableHeader column="updated">Updated</SortableHeader>
            <TableHead>Vector Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className={selectable && entry.id && selectedIds?.has(entry.id) ? "bg-blue-50" : ""}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={!!entry.id && selectedIds!.has(entry.id)}
                    onCheckedChange={() => entry.id && toggleSelect(entry.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium max-w-xs">
                <div className="truncate">{entry.title}</div>
                {(entry.metadata?.tags || entry.tags) && (
                  <div className="flex gap-1 mt-1">
                    {/* Handle tags as either string or array */}
                    {typeof (entry.metadata?.tags || entry.tags) === 'string' ? (
                      (entry.metadata?.tags || entry.tags).split(',').slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))
                    ) : (
                      (entry.metadata?.tags || entry.tags || []).slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    )}
                    {((typeof (entry.metadata?.tags || entry.tags) === 'string' 
                      ? (entry.metadata?.tags || entry.tags).split(',').length 
                      : (entry.metadata?.tags || entry.tags || []).length) > 2) && (
                      <Badge variant="outline" className="text-xs">
                        +{(typeof (entry.metadata?.tags || entry.tags) === 'string' 
                          ? (entry.metadata?.tags || entry.tags).split(',').length 
                          : (entry.metadata?.tags || entry.tags || []).length) - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {(entry.metadata?.category || entry.category || 'uncategorized').replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {entry.createdByName || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(entry.createdAt)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(entry.updatedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    entry.vectorStatus === 'synced' ? 'default' :
                    entry.vectorStatus === 'failed' ? 'destructive' : 'secondary'
                  } className={
                    entry.vectorStatus === 'synced' ? 'bg-green-100 text-green-700 border-green-200' :
                    entry.vectorStatus === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                  }>
                    {entry.vectorStatus}
                  </Badge>
                  {(entry.vectorStatus === 'pending' || entry.vectorStatus === 'failed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSync?.(entry)}
                      disabled={syncingEntryId === entry.id}
                      className="h-6 px-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      title={syncingEntryId === entry.id ? "Syncing..." : (entry.vectorStatus === 'failed' ? "Retry sync to vector database" : "Sync to vector database")}
                    >
                      {syncingEntryId === entry.id ? (
                        <Loader className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      {syncingEntryId === entry.id ? "Syncing..." : (entry.vectorStatus === 'failed' ? "Retry" : "Sync")}
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView?.(entry)}
                    className="h-8 w-8 p-0"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Entry
                      </DropdownMenuItem>
                      {entry.vectorStatus === 'synced' && (
                        <DropdownMenuItem 
                          onClick={() => onSync?.(entry)}
                          disabled={syncingEntryId === entry.id}
                        >
                          {syncingEntryId === entry.id ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {syncingEntryId === entry.id ? "Re-syncing..." : "Re-sync to Vector"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(entry.id!)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archive Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
