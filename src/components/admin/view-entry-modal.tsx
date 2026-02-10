
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Tag, User, X, FileText, Code2 } from "lucide-react"
import type { KBEntry } from "@/lib/types/kb"

interface ViewEntryModalProps {
  entry: KBEntry | null
  isOpen: boolean
  onClose: () => void
}

export function ViewEntryModal({ entry, isOpen, onClose }: ViewEntryModalProps) {
  const [viewMode, setViewMode] = useState<'form' | 'vector'>('form')
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !entry) return null

  // Function to render form-style view based on entry type
  const renderFormView = () => {
    const formData = entry.rawFormData || {}
    
    // If no rawFormData, show the vector content without the confusing message
    if (!entry.rawFormData || Object.keys(formData).length === 0) {
      return (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Entry Content</h4>
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
            {typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content, null, 2)}
          </pre>
        </div>
      )
    }
    
    if (entry.type === 'error') {
      return (
        <div className="space-y-6 max-w-none">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Issue/Error Entry</h2>
            
            {/* Issue Title */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-red-700 mb-2">Issue Title</label>
              <div className="bg-white border border-red-200 rounded p-3 text-gray-800">
                {formData.issue_title || entry.title || 'Not specified'}
              </div>
            </div>

            {/* Issue Description */}
            {formData.issue_description && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-red-700 mb-2">Issue Description</label>
                <div className="bg-white border border-red-200 rounded p-3 text-gray-800">
                  {formData.issue_description}
                </div>
              </div>
            )}

            {/* Error Code */}
            {formData.error_code && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-red-700 mb-2">Error Code</label>
                <div className="bg-white border border-red-200 rounded p-3 text-gray-800 font-mono">
                  {formData.error_code}
                </div>
              </div>
            )}

            {/* Causes & Solutions */}
            {formData.causes && Array.isArray(formData.causes) && formData.causes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-red-700 mb-3">Causes & Solutions</label>
                <div className="space-y-4">
                  {formData.causes.map((cause: any, index: number) => (
                    <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                          Cause {index + 1}
                        </span>
                      </div>
                      
                      {cause.cause_description && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-red-600 mb-1">What's the cause?</label>
                          <div className="bg-red-50 border border-red-100 rounded p-2 text-sm">
                            {cause.cause_description}
                          </div>
                        </div>
                      )}
                      
                      {cause.solution && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-red-600 mb-1">Solution</label>
                          <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                            {cause.solution}
                          </div>
                        </div>
                      )}
                      
                      {cause.related_help && (
                        <div>
                          <label className="block text-xs font-medium text-red-600 mb-1">Related Help</label>
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                            {cause.related_help}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Handle other entry types (definition, how_to)
    if (entry.type === 'definition') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Definition Entry</h2>
            
            {Object.entries(formData).map(([key, value]) => {
              if (!value) return null
              
              return (
                <div key={key} className="mb-4">
                  <label className="block text-sm font-semibold text-blue-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <div className="bg-white border border-blue-200 rounded p-3 text-gray-800">
                    {String(value)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (entry.type === 'how_to') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-4">How-To Entry</h2>
            
            {/* Handle steps specially */}
            {Object.entries(formData).map(([key, value]) => {
              if (!value) return null
              
              if (key === 'steps' && Array.isArray(value)) {
                return (
                  <div key={key} className="mb-4">
                    <label className="block text-sm font-semibold text-green-700 mb-3">Steps</label>
                    <div className="space-y-3">
                      {value.map((step: any, index: number) => (
                        <div key={index} className="bg-white border border-green-200 rounded p-3">
                          <div className="font-medium text-green-700 mb-2">Step {index + 1}</div>
                          {Object.entries(step).map(([stepKey, stepValue]) => {
                            if (!stepValue) return null
                            return (
                              <div key={stepKey} className="mb-2">
                                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                  {stepKey.replace(/_/g, ' ')}:
                                </span>
                                <div className="mt-1 text-sm text-gray-700">{String(stepValue)}</div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              
              return (
                <div key={key} className="mb-4">
                  <label className="block text-sm font-semibold text-green-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <div className="bg-white border border-green-200 rounded p-3 text-gray-800">
                    {String(value)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Fallback for unknown types
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-medium mb-3">Form Data</h3>
          {Object.entries(formData).map(([key, value]) => (
            <div key={key} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <div className="bg-white border rounded p-2 text-sm">
                {Array.isArray(value) ? JSON.stringify(value, null, 2) : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatDate = (date: string | Date | any | undefined) => {
    if (!date) return 'Not set'
    
    let dateObj: Date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date instanceof Date) {
      dateObj = date
    } else if (date._seconds) {
      // Firebase timestamp object
      dateObj = new Date(date._seconds * 1000)
    } else {
      return 'Invalid date'
    }
    
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col relative">
          <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
            <CardTitle className="text-xl font-bold pr-8">{entry.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6 overflow-y-auto flex-1 max-h-full">
            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{entry.type}</Badge>
                  <Badge variant="outline">{entry.category?.replace('_', ' ')}</Badge>
                  {entry.severity && (
                    <Badge variant={entry.severity === 'critical' ? 'destructive' : 'default'}>
                      {entry.severity}
                    </Badge>
                  )}
                </div>
                
                {entry.subcategory && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Subcategory: </span>
                    <span className="text-sm">{entry.subcategory.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3 text-sm">
                {/* Created info */}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-medium">Created: {formatDate(entry.createdAt)}</span>
                    {entry.createdByName && (
                      <span className="text-xs text-gray-600">
                        by {entry.createdByName}
                        {entry.createdByEmail && ` (${entry.createdByEmail})`}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Last edited info */}
                {entry.lastModifiedAt && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium">Last edited: {formatDate(entry.lastModifiedAt)}</span>
                      {entry.lastModifiedByName && (
                        <span className="text-xs text-gray-600">
                          by {entry.lastModifiedByName}
                          {entry.lastModifiedByEmail && ` (${entry.lastModifiedByEmail})`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Usage count */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Usage: {entry.usageCount || 0} times</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Tags:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sync History */}
            {entry.syncHistory && entry.syncHistory.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Sync History:</span>
                </div>
                <div className="space-y-2">
                  {entry.syncHistory.map((historyItem, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded">
                      <span className={`font-medium ${
                        historyItem.action === 'vector_synced' ? 'text-green-600' :
                        historyItem.action === 'vector_deleted' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {historyItem.action.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-600">
                        {formatDate(historyItem.timestamp)}
                      </span>
                      {historyItem.reason && (
                        <span className="text-gray-500 text-xs">
                          ({historyItem.reason.replace(/_/g, ' ')})
                        </span>
                      )}
                      {historyItem.error && (
                        <span className="text-red-500 text-xs">
                          Error: {historyItem.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Entry Content</h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'form' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('form')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Form View
                  </Button>
                  <Button
                    variant={viewMode === 'vector' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('vector')}
                    className="flex items-center gap-2"
                  >
                    <Code2 className="h-4 w-4" />
                    Vector Content
                  </Button>
                </div>
              </div>
              
              {viewMode === 'form' ? (
                /* Form PDF-like View */
                renderFormView()
              ) : (
                /* Vector Database Content */
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Vector Database Content (What LLM Sees)</h4>
                  <div className="bg-white border rounded p-3">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {entry.rawFormData ? 
                        // Generate structured content from rawFormData (same as what gets stored in VectorDB)
                        (() => {
                          if (entry.type === 'error' && entry.rawFormData) {
                            let structured = entry.title + '\n\n';
                            if (entry.rawFormData.issue_description) {
                              structured += 'Issue Description:\n' + entry.rawFormData.issue_description + '\n\n';
                            }
                            if (entry.rawFormData.error_code) {
                              structured += 'Error Code: ' + entry.rawFormData.error_code + '\n\n';
                            }
                            if (entry.rawFormData.causes && Array.isArray(entry.rawFormData.causes)) {
                              structured += 'Troubleshooting:\n\n';
                              entry.rawFormData.causes.forEach((cause: any, index: number) => {
                                if (cause.cause_description) {
                                  structured += `Cause ${index + 1}:\n${cause.cause_description}\n\n`;
                                }
                                if (cause.solution) {
                                  structured += `Solution:\n${cause.solution}\n\n`;
                                }
                                if (cause.related_help) {
                                  structured += `Related Help: ${cause.related_help}\n\n`;
                                }
                                if (index < entry.rawFormData.causes.length - 1) {
                                  structured += '---\n\n';
                                }
                              });
                            }
                            return structured.trim();
                          }
                          // Fallback for other types or legacy entries
                          return typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content, null, 2);
                        })()
                        : 
                        // Fallback for entries without rawFormData
                        (typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content, null, 2))
                      }
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the structured content that gets stored in the vector database for LLM retrieval. 
                    The embeddings are created from clean text (no headers) for better semantic search.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
