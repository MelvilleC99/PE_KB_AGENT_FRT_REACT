// Chat types

export type FeedbackType = 'positive' | 'negative' | null

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Array<{
    title: string
    confidence?: number
    entry_type?: string
    parent_entry_id?: string
    entry_id?: string
  }>
  classificationConfidence?: number
  requiresEscalation?: boolean
  feedback?: FeedbackType
  
  // Debug fields for test agent
  enhancedQuery?: string
  queryMetadata?: {
    category?: string
    intent?: string
    tags?: string[]
  }
  searchAttempts?: string[]
  debugMetrics?: {
    query_text?: string
    query_type?: string
    classification_confidence?: number
    enhanced_query?: string
    query_category?: string
    query_intent?: string
    query_tags?: string[]
    search_execution?: {
      filters_applied: Record<string, string>
      documents_scanned: number
      documents_matched: number
      documents_returned: number
      similarity_threshold: number
      embedding_time_ms: number
      search_time_ms: number
      rerank_time_ms: number
    }
    search_attempts?: Array<{ 
      attempt: number
      filters: Record<string, string>
      results_count: number 
    }>
    sources_found?: number
    sources_used?: number
    best_confidence?: number
    retrieved_chunks?: Array<{
      title: string
      entry_type: string
      similarity_score: number
      rerank_score?: number
    }>
    total_time_ms?: number
    classification_time_ms?: number
    query_intelligence_time_ms?: number
    response_generation_time_ms?: number
    cost_breakdown?: {
      embedding_cost: number
      query_intelligence_cost: number
      response_generation_cost: number
      total_cost: number
      embedding_tokens: number
      query_intelligence_input_tokens: number
      query_intelligence_output_tokens: number
      response_input_tokens: number
      response_output_tokens: number
      total_tokens: number
    }
    escalated?: boolean
    escalation_reason?: string
    escalation_type?: string
  }
  // Context debug is separate from debugMetrics
  contextDebug?: {
    conversation_context: string
    message_count: number
    has_summary: boolean
    context_length: number
    recent_sources_used: string[]
    available_related_documents: string[]
  }
}
