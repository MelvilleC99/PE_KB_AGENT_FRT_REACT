import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"
import { SimpleKBTable } from "@/components/admin/simple-kb-table"
import { ViewEntryModal } from "@/components/admin/view-entry-modal"
import { EditEntryDialog } from "@/components/admin/edit-entry-dialog"
import { FilterBar } from "@/components/admin/filter-bar"
import { Checkbox } from "@/components/ui/checkbox"
import { getKBEntries, archiveKBEntry, deleteVectorEntry, syncKBEntry } from "@/lib/api/kb"
import { Plus, RefreshCw, Trash2, X, Loader2 } from "lucide-react"
import type { KBEntry } from "@/lib/types/kb"

export function FirebasePage() {
  const { toast } = useToast()
  const { user } = useUser() // Get current user for audit trail
  const [entries, setEntries] = useState<KBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<KBEntry | null>(null)
  
  // Bulk selection mode
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const [alsoDeleteVectors, setAlsoDeleteVectors] = useState(true)

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("")
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>("updated")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch entries
  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const data = await getKBEntries()
      setEntries(data)
    } catch (error) {
      console.error("Failed to fetch entries:", error)
      toast({
        title: "Error",
        description: "Failed to load entries",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort entries
  const filteredAndSortedEntries = (() => {
    // First filter
    let filtered = entries.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = !typeFilter || entry.type === typeFilter
      const matchesCategory = !categoryFilter || entry.category === categoryFilter || entry.metadata?.category === categoryFilter
      const matchesUserType = !userTypeFilter || entry.userType === userTypeFilter || entry.metadata?.userType === userTypeFilter
      
      return matchesSearch && matchesType && matchesCategory && matchesUserType
    })
    
    // Then sort
    return filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '')
          break
        case 'category':
          const catA = a.metadata?.category || a.category || ''
          const catB = b.metadata?.category || b.category || ''
          comparison = catA.localeCompare(catB)
          break
        case 'createdBy':
          comparison = (a.createdByName || '').localeCompare(b.createdByName || '')
          break
        case 'created':
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          comparison = createdA - createdB
          break
        case 'updated':
        default:
          const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          comparison = updatedA - updatedB
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  })()

  // Handlers
  const handleView = (entry: KBEntry) => {
    setSelectedEntry(entry)
    setViewModalOpen(true)
  }

  const handleEdit = (entry: KBEntry) => {
    setSelectedEntry(entry)
    setEditModalOpen(true)
  }

  const handleDelete = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    if (!confirm(`Archive "${entry.title}"?\n\nThis will move it to the archive.`)) return

    try {
      // Archive with audit trail
      const result = await archiveKBEntry(entryId, {
        archivedBy: user?.agent_id || user?.uid || 'anonymous',
        archivedByEmail: user?.email || 'unknown@example.com',
        archivedByName: user?.full_name || 'Anonymous User',
        reason: 'User archived from Firebase page'
      })
      
      if (result.success) {
        setEntries(entries.filter(e => e.id !== entryId))
        toast({
          title: "Entry archived",
          description: `"${entry.title}" has been archived.`
        })
      } else {
        toast({
          title: "Archive failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive entry",
        variant: "destructive"
      })
    }
  }

  const handleSync = async (entry: KBEntry) => {
    if (!entry.id) return

    setSyncing(entry.id)

    try {
      const result = await syncKBEntry(entry.id)

      if (result.success) {
        toast({
          title: "✅ Synced to Vector DB",
          description: `Created ${result.chunks_created || 1} vector(s)`
        })
        
        // Update entry status in local state
        setEntries(entries.map(e => 
          e.id === entry.id 
            ? { ...e, vectorStatus: 'synced' as const, lastSyncedAt: new Date() }
            : e
        ))
      } else {
        toast({
          title: "❌ Sync failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: "❌ Error",
        description: "Failed to sync entry",
        variant: "destructive"
      })
    } finally {
      setSyncing(null)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setTypeFilter("")
    setCategoryFilter("")
    setUserTypeFilter("")
  }
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleBulkArchive = async () => {
    const count = selectedIds.size
    if (count === 0) return

    const syncedCount = entries.filter(e => e.id && selectedIds.has(e.id) && e.vectorStatus === 'synced').length

    const message = alsoDeleteVectors && syncedCount > 0
      ? `Archive ${count} entries and delete ${syncedCount} vector embedding(s)?`
      : `Archive ${count} entries?`

    if (!confirm(message + '\n\nThis action cannot be easily undone.')) return

    setBulkArchiving(true)
    const auditInfo = {
      archivedBy: user?.agent_id || user?.uid || 'anonymous',
      archivedByEmail: user?.email || 'unknown@example.com',
      archivedByName: user?.full_name || 'Anonymous User',
      reason: 'Bulk archive from Firebase page'
    }

    try {
      // Archive all selected entries in parallel
      const archiveResults = await Promise.allSettled(
        Array.from(selectedIds).map(id => archiveKBEntry(id, auditInfo))
      )

      const archived = archiveResults.filter(r => r.status === 'fulfilled' && r.value.success).length
      const archiveFailed = count - archived

      // Delete vectors for synced entries if opted in
      let vectorsDeleted = 0
      if (alsoDeleteVectors) {
        const syncedIds = entries
          .filter(e => e.id && selectedIds.has(e.id) && e.vectorStatus === 'synced')
          .map(e => e.id!)

        if (syncedIds.length > 0) {
          const vectorResults = await Promise.allSettled(
            syncedIds.map(id => deleteVectorEntry(id))
          )
          vectorsDeleted = vectorResults.filter(r => r.status === 'fulfilled' && r.value.success).length
        }
      }

      // Remove archived entries from state and exit selection mode
      setEntries(prev => prev.filter(e => !e.id || !selectedIds.has(e.id) || archiveResults[Array.from(selectedIds).indexOf(e.id)].status !== 'fulfilled'))
      exitSelectionMode()

      // Show summary toast
      const parts: string[] = []
      parts.push(`Archived ${archived} of ${count} entries`)
      if (vectorsDeleted > 0) parts.push(`deleted ${vectorsDeleted} vector(s)`)
      if (archiveFailed > 0) parts.push(`${archiveFailed} failed`)

      toast({
        title: archiveFailed > 0 ? 'Bulk archive partially complete' : 'Bulk archive complete',
        description: parts.join(', '),
        variant: archiveFailed > 0 ? 'destructive' : undefined
      })

      // Refresh to get accurate state
      loadEntries()
    } catch (error) {
      toast({
        title: 'Bulk archive error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setBulkArchiving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Firebase Entries</h1>
          <p className="text-gray-600">Manage knowledge base entries in Firebase</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadEntries} variant="outline" disabled={loading}>
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
              Bulk Archive
            </Button>
          )}
          <Button asChild>
            <Link to="/add-entry">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredAndSortedEntries.length} Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            userTypeFilter={userTypeFilter}
            onUserTypeFilterChange={setUserTypeFilter}
            onClearFilters={handleClearFilters}
          />

          {/* Bulk Action Bar — shown when in selection mode */}
          {selectionMode && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                {selectedIds.size === 0
                  ? 'Select entries to archive'
                  : `${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'} selected`}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <Checkbox
                    checked={alsoDeleteVectors}
                    onCheckedChange={(checked) => setAlsoDeleteVectors(!!checked)}
                  />
                  Also delete vectors
                </label>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkArchive}
                  disabled={bulkArchiving || selectedIds.size === 0}
                >
                  {bulkArchiving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  {bulkArchiving ? 'Archiving...' : `Archive Selected (${selectedIds.size})`}
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading entries...</p>
            </div>
          ) : (
            <SimpleKBTable
              entries={filteredAndSortedEntries}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSync={handleSync}
              syncingEntryId={syncing}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              {...(selectionMode ? { selectedIds, onSelectionChange: setSelectedIds } : {})}
            />
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <ViewEntryModal
        entry={selectedEntry}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedEntry(null)
        }}
      />

      {/* Edit Modal */}
      <EditEntryDialog
        entry={selectedEntry}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedEntry(null)
        }}
        onSaved={() => {
          loadEntries() // Refresh entries after save
        }}
      />
    </div>
  )
}
