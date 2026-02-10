/**
 * DuplicateWarningDialog Component
 * 
 * Shows similar entries when duplicates are detected
 * User can review and decide to proceed or cancel
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Eye, Calendar } from "lucide-react"
import type { SimilarEntry } from "@/lib/api/kb/duplicates"

interface DuplicateWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  similarEntries: SimilarEntry[]
  newEntryTitle: string
}

export function DuplicateWarningDialog({
  isOpen,
  onClose,
  onProceed,
  similarEntries,
  newEntryTitle
}: DuplicateWarningDialogProps) {
  const [viewingEntry, setViewingEntry] = useState<SimilarEntry | null>(null)

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return "text-red-600 bg-red-50 border-red-200"
    if (score >= 0.75) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.9) return "Very Similar"
    if (score >= 0.75) return "Similar"
    return "Somewhat Similar"
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown date"
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const handleProceed = () => {
    onProceed()
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDialogTitle>Similar Entries Found</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            We found {similarEntries.length} {similarEntries.length === 1 ? 'entry' : 'entries'} that 
            {similarEntries.length === 1 ? ' is' : ' are'} similar to "{newEntryTitle}". 
            Review {similarEntries.length === 1 ? 'it' : 'them'} to avoid creating duplicates.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {similarEntries.map((entry, index) => (
              <div 
                key={entry.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {entry.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {entry.type}
                      </Badge>
                      {entry.category && (
                        <Badge variant="outline" className="text-xs">
                          {entry.category.replace('_', ' ')}
                        </Badge>
                      )}
                      {entry.created_at && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Similarity Score */}
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold px-2 py-1 rounded border ${getSimilarityColor(entry.similarity_score)}`}>
                      {Math.round(entry.similarity_score * 100)}% match
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getSimilarityLabel(entry.similarity_score)}
                    </div>
                  </div>
                </div>

                {/* Content Snippet */}
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                  {entry.content_snippet}
                  {entry.content_snippet.length >= 200 && '...'}
                </div>

                {/* View Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingEntry(entry)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Full Entry
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-left text-xs text-gray-500">
            💡 Tip: Consider updating an existing entry instead of creating a duplicate
          </div>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleProceed} className="bg-yellow-600 hover:bg-yellow-700">
            Save Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* Full Entry View Modal (optional - simplified for now) */}
      {viewingEntry && (
        <AlertDialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{viewingEntry.title}</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{viewingEntry.type}</Badge>
                  {viewingEntry.category && (
                    <Badge variant="outline">{viewingEntry.category}</Badge>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-[500px]">
              <div className="whitespace-pre-wrap text-sm text-gray-700 p-4 bg-gray-50 rounded border">
                {viewingEntry.content_snippet}
              </div>
            </ScrollArea>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialog>
  )
}
