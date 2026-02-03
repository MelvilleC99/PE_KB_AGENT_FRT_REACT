import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SimpleKBTable } from "@/components/admin/simple-kb-table"
import { ViewEntryModal } from "@/components/admin/view-entry-modal"
import { FilterBar } from "@/components/admin/filter-bar"
import { getKBEntries, archiveKBEntry, syncKBEntry } from "@/lib/api/kb"
import { Plus, RefreshCw } from "lucide-react"
import type { KBEntry } from "@/lib/types/kb"

export function FirebasePage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<KBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<KBEntry | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("")

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

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = !typeFilter || entry.type === typeFilter
    const matchesCategory = !categoryFilter || entry.category === categoryFilter || entry.metadata?.category === categoryFilter
    const matchesUserType = !userTypeFilter || entry.userType === userTypeFilter || entry.metadata?.userType === userTypeFilter
    
    return matchesSearch && matchesType && matchesCategory && matchesUserType
  })

  // Handlers
  const handleView = (entry: KBEntry) => {
    setSelectedEntry(entry)
    setViewModalOpen(true)
  }

  const handleEdit = (entry: KBEntry) => {
    // Navigate to edit page
    window.location.href = `/add-entry?edit=${entry.id}`
  }

  const handleDelete = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    if (!confirm(`Archive "${entry.title}"?\n\nThis will move it to the archive.`)) return

    try {
      const result = await archiveKBEntry(entryId)
      
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
          <CardTitle>{filteredEntries.length} Entries</CardTitle>
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

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Loading entries...</p>
            </div>
          ) : (
            <SimpleKBTable
              entries={filteredEntries}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSync={handleSync}
              syncingEntryId={syncing}
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
    </div>
  )
}
