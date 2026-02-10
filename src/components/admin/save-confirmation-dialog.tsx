/**
 * SaveConfirmationDialog Component
 * 
 * Shows warning when saving edited entries
 * Includes checkbox for resync option
 */

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Zap, Clock } from "lucide-react"

interface SaveConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (shouldResync: boolean) => void
  entryTitle: string
  contentChanged: boolean
}

export function SaveConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  entryTitle,
  contentChanged
}: SaveConfirmationDialogProps) {
  const [shouldResync, setShouldResync] = useState(contentChanged)

  const handleConfirm = () => {
    onConfirm(shouldResync)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Save Changes to "{entryTitle}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how to handle vector database synchronization.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Resync Option */}
        <div className="space-y-4 py-4">
          <div 
            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => setShouldResync(!shouldResync)}
          >
            <Checkbox 
              checked={shouldResync}
              onCheckedChange={setShouldResync}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Resync to Vector Database</span>
              </div>
              <p className="text-sm text-gray-600">
                Delete old vectors and create new embeddings with updated content.
                Takes ~15-30 seconds.
              </p>
            </div>
          </div>

          {!shouldResync && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Entry will be marked as "Pending Sync". You can manually sync later from the table.
              </AlertDescription>
            </Alert>
          )}

          {shouldResync && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                The save will take longer while vectors are being regenerated.
              </AlertDescription>
            </Alert>
          )}

          {/* Smart Recommendation */}
          {contentChanged && !shouldResync && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Recommended:</strong> Content was changed - resync is recommended for accurate search results.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {shouldResync ? 'Save & Resync' : 'Save Only'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
