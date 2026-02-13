import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { RotateCcw, Trash2, ArrowLeft, Archive, X, Loader2 } from "lucide-react"
import { getArchivedKBEntries, restoreKBEntry, permanentlyDeleteKBEntry } from "@/lib/api/kb"

interface ArchivedEntry {
  id: string
  title: string
  type: string
  metadata?: {
    category?: string
    userType?: string
    product?: string
    tags?: string
  }
  archivedAt: Date
  vectorStatus: string
}

export function ArchivePage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<ArchivedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

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
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)))
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (count === 0) return

    if (!confirm(`⚠️ PERMANENTLY DELETE ${count} entries?\n\nThis action CANNOT be undone. These entries will be completely removed forever.`)) return

    setBulkDeleting(true)

    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id => permanentlyDeleteKBEntry(id))
      )

      const deleted = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = count - deleted

      exitSelectionMode()

      toast({
        title: failed > 0 ? 'Bulk delete partially complete' : 'Bulk delete complete',
        description: `Permanently deleted ${deleted} of ${count} entries${failed > 0 ? `, ${failed} failed` : ''}`,
        variant: failed > 0 ? 'destructive' : undefined
      })

      fetchArchivedEntries()
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

  useEffect(() => {
    fetchArchivedEntries()
  }, [])

  const fetchArchivedEntries = async () => {
    try {
      setLoading(true)
      const data = await getArchivedKBEntries()
      setEntries(data as ArchivedEntry[])
    } catch (error) {
      console.error("Failed to fetch archived entries:", error)
      toast({
        title: "Error",
        description: "Failed to load archived entries",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    if (confirm(`Restore "${entry.title}" back to the knowledge base?`)) {
      try {
        setProcessing(entryId)
        const result = await restoreKBEntry(entryId)
        
        if (result.success) {
          setEntries(entries.filter(e => e.id !== entryId))
          toast({
            title: "Entry restored",
            description: `"${entry.title}" has been restored to the knowledge base.`
          })
        } else {
          toast({
            title: "Restore failed",
            description: result.error || "Failed to restore the entry.",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Restore error",
          description: "An error occurred while restoring the entry.",
          variant: "destructive"
        })
      } finally {
        setProcessing(null)
      }
    }
  }

  const handlePermanentDelete = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    if (confirm(`⚠️ PERMANENTLY DELETE "${entry.title}"?\n\nThis action CANNOT be undone. The entry will be completely removed forever.`)) {
      try {
        setProcessing(entryId)
        const result = await permanentlyDeleteKBEntry(entryId)
        
        if (result.success) {
          setEntries(entries.filter(e => e.id !== entryId))
          toast({
            title: "Entry permanently deleted",
            description: `"${entry.title}" has been permanently deleted.`
          })
        } else {
          toast({
            title: "Delete failed",
            description: result.error || "Failed to delete the entry.",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Delete error",
          description: "An error occurred while deleting the entry.",
          variant: "destructive"
        })
      } finally {
        setProcessing(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading archived entries...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-8 w-8" />
              Archived Entries
            </h1>
            <p className="text-muted-foreground">
              Manage archived knowledge base entries. You can restore entries or permanently delete them.
            </p>
          </div>
          {entries.length > 0 && (
            selectionMode ? (
              <Button variant="outline" onClick={exitSelectionMode}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectionMode(true)} className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Bulk Delete
              </Button>
            )
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Archive Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{entries.length}</div>
                <div className="text-sm text-muted-foreground">Total Archived</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {entries.filter(e => e.type === 'definition').length}
                </div>
                <div className="text-sm text-muted-foreground">Definitions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {entries.filter(e => e.type === 'how_to').length}
                </div>
                <div className="text-sm text-muted-foreground">How-To Guides</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archived Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Entries</CardTitle>
          <CardDescription>
            {entries.length} archived entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Action Bar */}
          {selectionMode && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size === 0
                  ? 'Select entries to permanently delete'
                  : `${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'} selected`}
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
                  {bulkDeleting ? 'Deleting...' : `Delete Forever (${selectedIds.size})`}
                </Button>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No archived entries</p>
              <p className="text-sm">Archived entries will appear here</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={entries.length > 0 && selectedIds.size === entries.length ? true : selectedIds.size > 0 ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Archived Date</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className={selectionMode && selectedIds.has(entry.id) ? "bg-blue-50" : ""}>
                      {selectionMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(entry.id)}
                            onCheckedChange={() => toggleSelect(entry.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{entry.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(entry.metadata?.category || 'uncategorized').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.archivedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(entry.id)}
                            disabled={processing === entry.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermanentDelete(entry.id)}
                            disabled={processing === entry.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Forever
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
    </div>
  )
}
