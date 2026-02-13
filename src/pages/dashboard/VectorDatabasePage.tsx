import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Eye, Trash2, Database, X, Loader2 } from "lucide-react"
import { getVectorEntries, deleteVectorEntry } from "@/lib/api/kb"

interface VectorEntry {
  entry_id: string
  title: string
  content_preview?: string
  metadata: {
    type?: string
    category?: string
    userType?: string
    createdAt?: string
    is_chunk?: boolean
    chunk_section?: string
    chunk_position?: string
    parent_title?: string
    total_chunks?: number
    [key: string]: any
  }
}

export function VectorDatabasePage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<VectorEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewingEntry, setViewingEntry] = useState<VectorEntry | null>(null)
  const [selectedType, setSelectedType] = useState('all')

  // Filter entries
  const filteredEntries = selectedType === 'all'
    ? entries
    : entries.filter(e => (e.metadata?.entryType || e.metadata?.type) === selectedType)

  // Bulk selection mode
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (entryId: string) => {
    const next = new Set(selectedIds)
    if (next.has(entryId)) {
      next.delete(entryId)
    } else {
      next.add(entryId)
    }
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEntries.map(e => e.entry_id)))
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (count === 0) return

    // Deduplicate by parent ID so we don't call delete multiple times for chunks of the same entry
    const parentIds = new Set<string>()
    for (const id of selectedIds) {
      const parentId = id.includes('_chunk_') ? id.split('_chunk_')[0] : id
      parentIds.add(parentId)
    }

    if (!confirm(`Delete ${count} vector entries (${parentIds.size} unique documents) from AstraDB?\n\nThis cannot be undone.`)) return

    setBulkDeleting(true)

    try {
      const results = await Promise.allSettled(
        Array.from(parentIds).map(id => deleteVectorEntry(id))
      )

      const deleted = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = parentIds.size - deleted

      exitSelectionMode()

      toast({
        title: failed > 0 ? 'Bulk delete partially complete' : 'Bulk delete complete',
        description: `Deleted ${deleted} of ${parentIds.size} documents${failed > 0 ? `, ${failed} failed` : ''}`,
        variant: failed > 0 ? 'destructive' : undefined
      })

      loadVectors()
    } catch (error) {
      toast({
        title: 'Bulk delete error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  // Load vectors
  const loadVectors = async () => {
    setLoading(true)
    try {
      const result = await getVectorEntries(100)
      
      if (result.success) {
        setEntries(result.entries || [])
      } else {
        toast({
          title: "Error loading vectors",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to load vectors:', error)
      toast({
        title: "Failed to load",
        description: "Could not connect to backend",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete vector
  const handleDelete = async (entryId: string) => {
    console.log('🗑️ DELETE CALLED FOR:', entryId)
    
    const entry = entries.find(e => e.entry_id === entryId)
    const isChunk = entry?.metadata?.is_chunk || entryId.includes('_chunk_')
    const totalChunks = entry?.metadata?.total_chunks || 1
    const title = entry?.metadata?.parent_title || entry?.title || 'this entry'
    
    let message = `Delete "${title}" from vector database?\n\n`
    
    if (isChunk && totalChunks > 1) {
      message = `⚠️ WARNING: This will delete ALL ${totalChunks} chunks for:\n"${title}"\n\nContinue?`
    }

    if (!confirm(message)) {
      console.log('❌ Delete cancelled by user')
      return
    }

    // Prevent duplicate calls
    if (deleting) {
      console.log('⚠️ Delete already in progress, ignoring duplicate call')
      return
    }
    
    setDeleting(entryId)

    try {
      console.log('🔄 Sending DELETE request for:', entryId)
      
      const result = await deleteVectorEntry(entryId)
      
      if (result.success) {
        // Extract parent ID to remove all related chunks
        const parentId = entryId.includes('_chunk_') 
          ? entryId.split('_chunk_')[0] 
          : entryId
        
        // Optimistically remove from UI immediately
        setEntries(prev => prev.filter(e => {
          const eParentId = e.entry_id.includes('_chunk_')
            ? e.entry_id.split('_chunk_')[0]
            : e.entry_id
          return eParentId !== parentId
        }))
        
        toast({
          title: "✅ Deleted",
          description: `Removed ${result.chunks_deleted || 1} vector(s)`
        })
        
        // Reload after a delay to verify
        setTimeout(() => loadVectors(), 1000)
      } else {
        toast({
          title: "❌ Delete failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast({
        title: "❌ Error",
        description: "Failed to delete",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    loadVectors()
  }, [])

  // Type counts
  const typeCounts = entries.reduce((acc, entry) => {
    const type = entry.metadata?.entryType || entry.metadata?.type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8" />
            Vector Database
          </h1>
          <p className="text-gray-600">Manage vector embeddings in AstraDB</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadVectors} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectionMode ? (
            <Button variant="outline" onClick={exitSelectionMode}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setSelectionMode(true)} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Bulk Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>{entries.length} Vector Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All ({entries.length})
            </Button>
            <Button
              variant={selectedType === 'how_to' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('how_to')}
            >
              How-To ({typeCounts['how_to'] || 0})
            </Button>
            <Button
              variant={selectedType === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('error')}
            >
              Errors ({typeCounts['error'] || 0})
            </Button>
            <Button
              variant={selectedType === 'definition' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('definition')}
            >
              Definitions ({typeCounts['definition'] || 0})
            </Button>
          </div>

          {/* Bulk Action Bar */}
          {selectionMode && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size === 0
                  ? 'Select vectors to delete'
                  : `${selectedIds.size} ${selectedIds.size === 1 ? 'vector' : 'vectors'} selected`}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting || selectedIds.size === 0}
                >
                  {bulkDeleting ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading vectors...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No vectors found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={filteredEntries.length > 0 && selectedIds.size === filteredEntries.length ? true : selectedIds.size > 0 ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.entry_id} className={selectionMode && selectedIds.has(entry.entry_id) ? "bg-blue-50" : ""}>
                      {selectionMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(entry.entry_id)}
                            onCheckedChange={() => toggleSelect(entry.entry_id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div>{entry.title}</div>
                        {entry.content_preview && (
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.content_preview.substring(0, 80)}...
                          </div>
                        )}
                        {entry.metadata?.is_chunk && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {entry.metadata.chunk_section} ({entry.metadata.chunk_position})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.metadata?.entryType || entry.metadata?.type || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.metadata?.category || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingEntry(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              await handleDelete(entry.entry_id)
                            }}
                            disabled={deleting !== null}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === entry.entry_id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {viewingEntry && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" 
          onClick={() => setViewingEntry(null)}
        >
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{viewingEntry.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingEntry(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Entry ID</div>
                <div className="text-sm font-mono">{viewingEntry.entry_id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Content</div>
                <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {viewingEntry.content_preview}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Metadata</div>
                <pre className="p-4 bg-gray-50 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(viewingEntry.metadata, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
