/**
 * Debug Analytics Component
 * 
 * Collapsible panel showing full query execution metrics for Test Agent
 * Clean, professional UI with all relevant metrics
 */

import { useState } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Database, 
  Search, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Activity,
  FileText,
  DollarSign
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Type definitions matching backend QueryExecutionMetrics
export interface SearchExecutionMetrics {
  filters_applied: Record<string, string>
  documents_scanned: number
  documents_matched: number
  documents_returned: number
  similarity_threshold: number
  embedding_time_ms: number
  search_time_ms: number
  rerank_time_ms: number
}

export interface CostBreakdown {
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

export interface ContextDebug {
  conversation_context: string
  message_count: number
  has_summary: boolean
  context_length: number
  recent_sources_used: string[]
  available_related_documents: string[]
}

export interface DebugMetrics {
  query_text?: string
  query_type?: string
  classification_confidence?: number
  enhanced_query?: string
  query_category?: string
  query_intent?: string
  query_tags?: string[]
  search_execution?: SearchExecutionMetrics
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
  cost_breakdown?: CostBreakdown
  escalated?: boolean
  escalation_reason?: string
  escalation_type?: string
  context_debug?: ContextDebug
}

interface SourceInfo {
  title: string
  confidence?: number
  entry_type?: string
  parent_entry_id?: string
  entry_id?: string
}

interface DebugAnalyticsProps {
  metrics?: DebugMetrics
  contextDebug?: ContextDebug
  responseConfidence?: number
  classificationConfidence?: number
  enhancedQuery?: string
  queryMetadata?: { category?: string; intent?: string; tags?: string[] }
  searchAttempts?: string[]
  sources?: SourceInfo[]
  className?: string
  defaultOpen?: boolean
}

export function DebugAnalytics({
  metrics,
  contextDebug,
  responseConfidence,
  classificationConfidence,
  enhancedQuery,
  queryMetadata,
  sources,
  className,
  defaultOpen = false
}: DebugAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Merge data from different sources
  const data = {
    classification_confidence: metrics?.classification_confidence ?? classificationConfidence,
    enhanced_query: metrics?.enhanced_query ?? enhancedQuery,
    query_category: metrics?.query_category ?? queryMetadata?.category,
    query_intent: metrics?.query_intent ?? queryMetadata?.intent,
    query_tags: metrics?.query_tags ?? queryMetadata?.tags,
    ...metrics,
    context_debug: contextDebug || metrics?.context_debug
  }

  const totalTime = data.total_time_ms || 0
  const bestConfidence = data.best_confidence || responseConfidence || 0
  const mainConfidence = responseConfidence ?? bestConfidence

  // Determine overall status color
  const getStatusColor = (confidence: number) => {
    if (confidence >= 0.7) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" }
    if (confidence >= 0.5) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" }
    return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" }
  }
  
  const statusColors = getStatusColor(mainConfidence)

  return (
    <div className={cn(
      "mt-3 rounded-xl overflow-hidden text-xs shadow-sm",
      statusColors.border,
      statusColors.bg,
      "border",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3 transition-colors",
          "hover:bg-black/5"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1 rounded-md",
            mainConfidence >= 0.7 ? "bg-emerald-100" : mainConfidence >= 0.5 ? "bg-amber-100" : "bg-red-100"
          )}>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
            )}
          </div>
          <span className="font-semibold text-gray-700">Debug Analytics</span>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-2">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-gray-600">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{totalTime.toFixed(0)}ms</span>
            </div>
          )}
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          
          {/* Response Overview Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-700">Response Overview</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard 
                label="Response Confidence" 
                value={`${(mainConfidence * 100).toFixed(1)}%`}
                status={mainConfidence >= 0.7 ? "success" : mainConfidence >= 0.5 ? "warning" : "error"}
              />
              <MetricCard 
                label="Sources Used" 
                value={`${data.sources_used ?? 0} / ${data.sources_found ?? 0}`}
                status="neutral"
              />
              <MetricCard 
                label="Total Time" 
                value={`${totalTime.toFixed(0)}ms`}
                status={totalTime < 2000 ? "success" : totalTime < 5000 ? "warning" : "error"}
              />
              <MetricCard 
                label="Total Cost" 
                value={data.cost_breakdown?.total_cost ? `$${data.cost_breakdown.total_cost.toFixed(6)}` : "$0.00"}
                status={data.cost_breakdown?.total_cost ? (data.cost_breakdown.total_cost < 0.001 ? "success" : data.cost_breakdown.total_cost < 0.01 ? "warning" : "error") : "neutral"}
              />
            </div>
            {data.escalated && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 font-medium">Escalation Required: {data.escalation_reason}</span>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Left Column */}
            <div className="space-y-3">
              
              {/* Query Classification */}
              <Card title="Query Classification" icon={<Zap className="h-3.5 w-3.5" />}>
                <Row label="Type" value={<Badge variant="outline" className="text-xs">{data.query_type || "—"}</Badge>} />
                <Row 
                  label="Classification" 
                  value={<ConfidenceBadge value={data.classification_confidence} />} 
                />
                {data.query_category && (
                  <Row label="Category" value={<Badge variant="secondary" className="text-xs">{data.query_category}</Badge>} />
                )}
                {data.query_intent && (
                  <Row label="Intent" value={<span className="font-mono text-gray-700">{data.query_intent}</span>} />
                )}
              </Card>

              {/* Sources List */}
              {sources && sources.length > 0 && (
                <Card title={`Sources (${sources.length})`} icon={<FileText className="h-3.5 w-3.5" />}>
                  <div className="space-y-1.5">
                    {sources.map((source, i) => {
                      const displayTitle = (!source.title || source.title === 'Untitled Entry') 
                        ? (source.entry_type ? `${source.entry_type.replace('_', ' ')} Entry` : 'Document')
                        : source.title
                      
                      return (
                        <div key={i} className="p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-700 font-medium truncate">{displayTitle}</div>
                              {(source.parent_entry_id || source.entry_id) && (
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                                  ID: {source.parent_entry_id || source.entry_id}
                                </div>
                              )}
                            </div>
                            {source.confidence !== undefined && (
                              <ConfidenceBadge value={source.confidence} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Enhanced Query */}
              {data.enhanced_query && (
                <Card title="Enhanced Query" icon={<FileText className="h-3.5 w-3.5" />}>
                  <div className="p-2 bg-gray-50 rounded-md border border-gray-100 italic text-gray-600">
                    "{data.enhanced_query}"
                  </div>
                </Card>
              )}
              
              {/* Tags */}
              {data.query_tags && data.query_tags.length > 0 && (
                <Card title="Query Tags" icon={<Search className="h-3.5 w-3.5" />}>
                  <div className="flex flex-wrap gap-1">
                    {data.query_tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-white">{tag}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              
              {/* Search Execution */}
              {data.search_execution && (
                <Card title="Search Execution" icon={<Database className="h-3.5 w-3.5" />}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Document Flow</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 text-center p-1.5 bg-blue-50 rounded border border-blue-100">
                        <div className="font-bold text-blue-700">{data.search_execution.documents_scanned}</div>
                        <div className="text-[10px] text-blue-500">Scanned</div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-300" />
                      <div className="flex-1 text-center p-1.5 bg-purple-50 rounded border border-purple-100">
                        <div className="font-bold text-purple-700">{data.search_execution.documents_matched}</div>
                        <div className="text-[10px] text-purple-500">Matched</div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-300" />
                      <div className="flex-1 text-center p-1.5 bg-emerald-50 rounded border border-emerald-100">
                        <div className="font-bold text-emerald-700">{data.search_execution.documents_returned}</div>
                        <div className="text-[10px] text-emerald-500">Returned</div>
                      </div>
                    </div>
                    
                    {data.search_execution.filters_applied && Object.keys(data.search_execution.filters_applied).length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-gray-500 mb-1">Filters Applied</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(data.search_execution.filters_applied).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-[10px] bg-white">
                              {key}={String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Row label="Similarity Threshold" value={`${(data.search_execution.similarity_threshold * 100).toFixed(0)}%`} />
                  </div>
                </Card>
              )}

              {/* Performance Timing */}
              {totalTime > 0 && (
                <CollapsibleCard title="Performance" icon={<Activity className="h-3.5 w-3.5" />}>
                  <div className="space-y-2">
                    {data.classification_time_ms !== undefined && data.classification_time_ms > 0 && (
                      <TimingRow label="Classification" time={data.classification_time_ms} total={totalTime} color="bg-yellow-500" />
                    )}
                    {data.query_intelligence_time_ms !== undefined && data.query_intelligence_time_ms > 0 && (
                      <TimingRow label="Query Intelligence" time={data.query_intelligence_time_ms} total={totalTime} color="bg-pink-500" />
                    )}
                    {data.search_execution?.embedding_time_ms !== undefined && data.search_execution.embedding_time_ms > 0 && (
                      <TimingRow label="Embedding" time={data.search_execution.embedding_time_ms} total={totalTime} color="bg-blue-500" />
                    )}
                    {data.search_execution?.search_time_ms !== undefined && data.search_execution.search_time_ms > 0 && (
                      <TimingRow label="Search" time={data.search_execution.search_time_ms} total={totalTime} color="bg-purple-500" />
                    )}
                    {data.search_execution?.rerank_time_ms !== undefined && data.search_execution.rerank_time_ms > 0 && (
                      <TimingRow label="Reranking" time={data.search_execution.rerank_time_ms} total={totalTime} color="bg-indigo-500" />
                    )}
                    {data.response_generation_time_ms !== undefined && data.response_generation_time_ms > 0 && (
                      <TimingRow label="LLM Response" time={data.response_generation_time_ms} total={totalTime} color="bg-emerald-500" />
                    )}
                    <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-gray-700">
                      <span>Total</span>
                      <span className="font-mono">{totalTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CollapsibleCard>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          {data.cost_breakdown && data.cost_breakdown.total_cost > 0 && (
            <CollapsibleCard title="Cost Breakdown" icon={<DollarSign className="h-3.5 w-3.5" />}>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs font-medium mb-2">Cost by Operation</div>
                  {data.cost_breakdown.embedding_cost > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Embedding</span>
                      <span className="font-mono text-gray-700 text-right ml-2">${data.cost_breakdown.embedding_cost.toFixed(6)}</span>
                    </div>
                  )}
                  {data.cost_breakdown.query_intelligence_cost > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Query Intelligence</span>
                      <span className="font-mono text-gray-700 text-right ml-2">${data.cost_breakdown.query_intelligence_cost.toFixed(6)}</span>
                    </div>
                  )}
                  {data.cost_breakdown.response_generation_cost > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Response Generation</span>
                      <span className="font-mono text-gray-700 text-right ml-2">${data.cost_breakdown.response_generation_cost.toFixed(6)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-gray-700">
                    <span>Total Cost</span>
                    <span className="font-mono text-emerald-600 text-right ml-2">${data.cost_breakdown.total_cost.toFixed(6)}</span>
                  </div>
                </div>
                
                {data.cost_breakdown.total_tokens > 0 && (
                  <div className="space-y-2">
                    <div className="text-gray-500 text-xs font-medium mb-2">Token Usage</div>
                    {data.cost_breakdown.embedding_tokens > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Embedding</span>
                        <span className="font-mono text-gray-700 text-right ml-2">{data.cost_breakdown.embedding_tokens.toLocaleString()}</span>
                      </div>
                    )}
                    {data.cost_breakdown.response_input_tokens > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Input</span>
                        <span className="font-mono text-gray-700 text-right ml-2">{data.cost_breakdown.response_input_tokens.toLocaleString()}</span>
                      </div>
                    )}
                    {data.cost_breakdown.response_output_tokens > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Output</span>
                        <span className="font-mono text-gray-700 text-right ml-2">{data.cost_breakdown.response_output_tokens.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-gray-700">
                      <span>Total Tokens</span>
                      <span className="font-mono text-right ml-2">{data.cost_breakdown.total_tokens.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {data.cost_breakdown.total_tokens > 0 && (
                  <div className="space-y-2">
                    <div className="text-gray-500 text-xs font-medium mb-2">Efficiency Metrics</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Cost per 1K Tokens</span>
                      <span className="font-mono text-gray-700 text-right ml-2">${((data.cost_breakdown.total_cost / data.cost_breakdown.total_tokens) * 1000).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Time per Token</span>
                      <span className="font-mono text-gray-700 text-right ml-2">{(totalTime / data.cost_breakdown.total_tokens).toFixed(2)}ms</span>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )}

          {/* Context Debug */}
          {data.context_debug && (
            <ContextDebugCard contextDebug={data.context_debug} />
          )}
        </div>
      )}
    </div>
  )
}

// === Helper Components ===

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="font-medium text-gray-700 text-xs">{title}</span>
      </div>
      <div className="p-3 space-y-2">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function MetricCard({ label, value, status }: { label: string; value: string; status: "success" | "warning" | "error" | "neutral" }) {
  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    error: "bg-red-50 border-red-200 text-red-700",
    neutral: "bg-gray-50 border-gray-200 text-gray-700"
  }
  
  return (
    <div className={cn("p-2 rounded-lg border text-center", colors[status])}>
      <div className="font-bold text-lg">{value}</div>
      <div className="text-[10px] opacity-75">{label}</div>
    </div>
  )
}

function ConfidenceBadge({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-gray-400">—</span>
  
  const variant = value >= 0.7 ? "default" : value >= 0.5 ? "secondary" : "destructive"
  return <Badge variant={variant} className="text-xs">{(value * 100).toFixed(1)}%</Badge>
}

function TimingRow({ label, time, total, color }: { label: string; time: number; total: number; color: string }) {
  const percentage = total > 0 ? (time / total) * 100 : 0
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-gray-600">
        <span>{label}</span>
        <span className="font-mono">{time.toFixed(0)}ms</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

function CollapsibleCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="font-medium text-gray-700 text-xs">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  )
}

function ContextDebugCard({ contextDebug }: { contextDebug: ContextDebug }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-medium text-gray-700 text-xs">Context Debug</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">
              {contextDebug.message_count} messages
            </Badge>
            <Badge variant="outline" className="text-xs">
              {(contextDebug.context_length / 1000).toFixed(1)}K chars
            </Badge>
            {contextDebug.has_summary && (
              <Badge variant="secondary" className="text-xs">
                Summary Active
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <MetricCard 
              label="Messages" 
              value={contextDebug.message_count.toString()}
              status="neutral"
            />
            <MetricCard 
              label="Context Size" 
              value={`${(contextDebug.context_length / 1000).toFixed(1)}K`}
              status={contextDebug.context_length > 50000 ? "warning" : contextDebug.context_length > 100000 ? "error" : "success"}
            />
            <MetricCard 
              label="Summary" 
              value={contextDebug.has_summary ? "Active" : "None"}
              status={contextDebug.has_summary ? "success" : "neutral"}
            />
            <MetricCard 
              label="Sources Used" 
              value={contextDebug.recent_sources_used.length.toString()}
              status="neutral"
            />
          </div>
          
          {contextDebug.recent_sources_used.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-medium mb-2">Recent Sources Used (Last 5)</div>
              <div className="space-y-1">
                {contextDebug.recent_sources_used.map((source, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="text-xs text-gray-700 font-medium">{source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {contextDebug.available_related_documents.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-medium mb-2">Available Follow-up Topics</div>
              <div className="flex flex-wrap gap-1">
                {contextDebug.available_related_documents.map((doc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <div className="text-gray-500 text-xs font-medium mb-2">Full LLM Context</div>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
              <pre className="text-[10px] text-gray-600 whitespace-pre-wrap font-mono">
                {contextDebug.conversation_context}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
