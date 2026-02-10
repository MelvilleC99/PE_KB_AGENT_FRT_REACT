export interface KBEntry {
  id?: string
  type: "definition" | "error" | "how_to"
  title: string
  category: string
  subcategory?: string
  severity?: "critical" | "high" | "medium" | "low"
  tags?: string[]
  content: string | { // Can be structured string or legacy object format
    [key: string]: any // Dynamic based on type
  }
  rawFormData?: any // Store original form data for editing/viewing
  metadata?: {
    [key: string]: any
  }
  createdAt?: string | Date
  updatedAt?: string | Date
  usageCount?: number
  author?: string // Legacy field, use createdBy instead
  
  // Audit trail: Creation
  createdBy?: string // User ID (agent_id or uid)
  createdByEmail?: string
  createdByName?: string
  
  // Audit trail: Last modification
  lastModifiedBy?: string // User ID
  lastModifiedByEmail?: string
  lastModifiedByName?: string
  lastModifiedAt?: string | Date
  
  // Audit trail: Archive/Delete
  archivedBy?: string // User ID
  archivedByEmail?: string
  archivedByName?: string
  archivedAt?: string | Date
  archivedReason?: string
  
  vectorStatus?: 'pending' | 'synced' | 'failed'
  lastSyncedAt?: string | Date | null
  vectorDeletedAt?: string | Date | null
  vectorDeleteReason?: string
  syncError?: string
  syncHistory?: Array<{
    action: 'vector_synced' | 'vector_deleted' | 'vector_sync_failed'
    timestamp: Date
    reason?: string
    error?: string
  }>
}

export interface KBTemplate {
  id: string
  name: string
  description: string
  fields: KBTemplateField[]
}

export interface KBTemplateField {
  key: string
  label: string
  type: "text" | "textarea" | "select" | "multiselect" | "code" | "file"
  required: boolean
  placeholder?: string
  options?: string[] | Array<{value: string, label: string}>
  accept?: string // for file inputs
  showIf?: {field: string, value: string} // conditional field display
  helpText?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  kbSources?: KBSource[]
}

export interface KBSource {
  entry: KBEntry
  confidence: number
  matchedContent: string
}

export interface KBStats {
  totalEntries: number
  mostUsedEntry: {
    title: string
    usageCount: number
  }
  recentlyAdded: number
  needsUpdate: number
}
