
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
}

export function SimpleKBTable({ entries, onEdit, onDelete, onView, onSync, syncingEntryId }: SimpleKBTableProps) {
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
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>User Type</TableHead>
            <TableHead>Vector Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
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
              <TableCell>
                <Badge variant={
                  entry.metadata?.userType === 'internal' ? 'default' :
                  entry.metadata?.userType === 'external' ? 'secondary' : 'outline'
                } className={
                  entry.metadata?.userType === 'internal' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  entry.metadata?.userType === 'external' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }>
                  {entry.metadata?.userType || 'unknown'}
                </Badge>
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
