/**
 * EditEntryDialog Component
 * 
 * Modal for editing existing KB entries
 * Uses EntryForm component for consistency
 * Handles save confirmation with resync option
 */

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"
import { EntryForm } from "@/components/kb/entry-form"
import { StandardMetadata } from "@/components/kb/standard-metadata"
import { SaveConfirmationDialog } from "./save-confirmation-dialog"
import { updateKBEntry, syncKBEntry } from "@/lib/api/kb"
import { X, Loader2, Save } from "lucide-react"
import type { KBEntry } from "@/lib/types/kb"

interface EditEntryDialogProps {
  entry: KBEntry | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function EditEntryDialog({ entry, isOpen, onClose, onSaved }: EditEntryDialogProps) {
  const { toast } = useToast()
  const { user } = useUser() // Get current user for audit trail
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [originalFormData, setOriginalFormData] = useState<Record<string, any>>({})
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Metadata state
  const [userType, setUserType] = useState("internal")
  const [product, setProduct] = useState("property_engine")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")

  // Load entry data when modal opens
  useEffect(() => {
    if (entry && isOpen) {
      // Pre-fill form with existing data
      const data = entry.rawFormData || {}
      setFormData(data)
      setOriginalFormData(data)
      
      // Pre-fill metadata
      const metadata = entry.metadata || {}
      setUserType(metadata.userType || entry.userType || "internal")
      setProduct(metadata.product || "property_engine")
      setCategory(metadata.category || entry.category || "")
      setTags(metadata.tags || entry.tags || "")
    }
  }, [entry, isOpen])

  if (!entry) return null

  const handleSaveClick = () => {
    // Show confirmation dialog
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async (shouldResync: boolean) => {
    if (!entry.id) return

    setIsSaving(true)

    try {
      // Prepare the update payload (formData + metadata + audit trail)
      // Convert tags string to array if backend expects list
      const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []
      
      const updates = {
        rawFormData: formData,
        content: JSON.stringify(formData), // Update content field
        title: extractTitle(entry.type, formData), // Extract title based on template type
        // Update metadata
        metadata: {
          entryType: entry.type,
          userType,
          product,
          category,
          tags: tagsArray  // Send as array
        },
        // Also update top-level fields for backwards compatibility
        userType,
        category,
        tags: tagsArray,  // Send as array
        // Audit trail: Last modification info
        lastModifiedBy: user?.agent_id || user?.uid || 'anonymous',
        lastModifiedByEmail: user?.email || 'unknown@example.com',
        lastModifiedByName: user?.full_name || 'Anonymous User',
        lastModifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() // Also update standard updatedAt field
      }

      console.log('🔍 UPDATE PAYLOAD:', JSON.stringify(updates, null, 2))

      // Step 1: Update Firebase entry
      const updateResult = await updateKBEntry(entry.id, updates)
      
      console.log('📡 UPDATE RESULT:', updateResult)

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update entry')
      }

      toast({
        title: "Entry updated",
        description: shouldResync 
          ? "Firebase updated. Resyncing vectors..." 
          : "Firebase updated. Remember to sync vectors."
      })

      // Step 2: Resync if requested
      if (shouldResync) {
        const syncResult = await syncKBEntry(entry.id)

        if (syncResult.success) {
          toast({
            title: "✅ Resync complete",
            description: `Created ${syncResult.chunks_created || 1} new vector(s)`
          })
        } else {
          toast({
            title: "⚠️ Resync failed",
            description: syncResult.error || "You can manually sync from the table",
            variant: "destructive"
          })
        }
      }

      // Close and refresh
      onSaved()
      onClose()

    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error saving entry",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to extract title from form data based on template
  const extractTitle = (templateType: string, data: Record<string, any>): string => {
    switch (templateType) {
      case "definition":
        return data.term || "Untitled Definition"
      case "how_to":
        return data.title || "Untitled How-To"
      case "error":
        return data.error_message || "Untitled Error"
      case "workflow":
        return data.title || "Untitled Workflow"
      default:
        return data.title || "Untitled Entry"
    }
  }

  // Check if content has changed (for smart resync recommendation)
  const hasContentChanged = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>Edit Entry: {entry.title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 h-8 w-8 p-0"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {isSaving ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Saving changes...</span>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 p-1">
                {/* Entry Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content</CardTitle>
                    <CardDescription>Edit the entry content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EntryForm
                      templateId={entry.type}
                      formData={formData}
                      onFormDataChange={setFormData}
                    />
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🏷️ Metadata</CardTitle>
                    <CardDescription>Organize and categorize this entry</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StandardMetadata
                      userType={userType}
                      onUserTypeChange={setUserType}
                      product={product}
                      onProductChange={setProduct}
                      category={category}
                      onCategoryChange={setCategory}
                      tags={tags}
                      onTagsChange={setTags}
                    />
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="mt-4 border-t pt-4">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <SaveConfirmationDialog
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        onConfirm={handleConfirmSave}
        entryTitle={entry.title}
        contentChanged={hasContentChanged()}
      />
    </>
  )
}
