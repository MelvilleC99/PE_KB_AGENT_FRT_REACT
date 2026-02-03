/**
 * FeedbackButtons Component
 * 
 * Reusable thumbs up/down feedback buttons.
 * Self-contained with its own state management via useFeedback hook.
 */

import { ThumbsUp, ThumbsDown, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFeedback, FeedbackData } from "./useFeedback"
import { cn } from "@/lib/utils"

interface User {
  agent_id: string
  email?: string
  full_name?: string
}

interface FeedbackButtonsProps {
  // Required - identifies the message
  messageId: string
  sessionId: string
  
  // Required - the interaction being rated
  query: string
  response: string
  
  // User info
  user: User
  
  // Optional context
  agentType?: 'test' | 'support' | 'customer'
  confidenceScore?: number
  sourcesUsed?: string[]
  
  // Optional callback when feedback is submitted
  onFeedbackSubmitted?: (type: 'positive' | 'negative') => void
  
  // Optional - if feedback was already given (from parent state)
  existingFeedback?: 'positive' | 'negative' | null
  
  // Optional styling
  className?: string
  size?: 'sm' | 'default'
  showLabels?: boolean
}

export function FeedbackButtons({
  messageId,
  sessionId,
  query,
  response,
  user,
  agentType,
  confidenceScore,
  sourcesUsed,
  onFeedbackSubmitted,
  existingFeedback,
  className,
  size = 'sm',
  showLabels = false,
}: FeedbackButtonsProps) {
  // Build feedback data for the hook
  const feedbackData: FeedbackData = {
    session_id: sessionId,
    message_id: messageId,
    query,
    response,
    agent_id: user.agent_id,
    user_email: user.email,
    user_name: user.full_name,
    agent_type: agentType,
    confidence_score: confidenceScore,
    sources_used: sourcesUsed,
  }

  const {
    feedback,
    isSubmitting,
    error,
    submitFeedback,
    hasSubmitted,
  } = useFeedback({
    feedbackData,
    onFeedbackSubmitted,
  })

  // Use existing feedback if provided, otherwise use local state
  const currentFeedback = existingFeedback ?? feedback
  const isDisabled = hasSubmitted || isSubmitting || !!existingFeedback

  const handlePositive = () => {
    if (!isDisabled) {
      submitFeedback('positive')
    }
  }

  const handleNegative = () => {
    if (!isDisabled) {
      submitFeedback('negative')
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Thumbs Up Button */}
      <Button
        size={size}
        variant={currentFeedback === 'positive' ? 'default' : 'outline'}
        onClick={handlePositive}
        disabled={isDisabled}
        className={cn(
          "transition-all",
          currentFeedback === 'positive' && "bg-green-600 hover:bg-green-700"
        )}
        title="Helpful"
      >
        {isSubmitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : currentFeedback === 'positive' ? (
          <Check className="h-3 w-3" />
        ) : (
          <ThumbsUp className="h-3 w-3" />
        )}
        {showLabels && <span className="ml-1">Helpful</span>}
      </Button>

      {/* Thumbs Down Button */}
      <Button
        size={size}
        variant={currentFeedback === 'negative' ? 'default' : 'outline'}
        onClick={handleNegative}
        disabled={isDisabled}
        className={cn(
          "transition-all",
          currentFeedback === 'negative' && "bg-red-600 hover:bg-red-700"
        )}
        title="Not helpful"
      >
        {isSubmitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : currentFeedback === 'negative' ? (
          <Check className="h-3 w-3" />
        ) : (
          <ThumbsDown className="h-3 w-3" />
        )}
        {showLabels && <span className="ml-1">Not helpful</span>}
      </Button>

      {/* Error message */}
      {error && (
        <span className="text-xs text-red-500 ml-2">
          {error}
        </span>
      )}

      {/* Success indicator */}
      {hasSubmitted && !error && (
        <span className="text-xs text-green-600 ml-2">
          Thanks!
        </span>
      )}
    </div>
  )
}
