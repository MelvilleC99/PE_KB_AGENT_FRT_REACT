/**
 * useFeedback Hook
 * 
 * Manages feedback state and submission logic.
 * Calls the backend API to persist feedback to Firebase.
 */

import { useState, useCallback } from 'react'
import { submitFeedback as submitFeedbackAPI } from '@/lib/api/agents'

export interface FeedbackData {
  session_id: string
  message_id: string
  query: string
  response: string
  agent_id: string
  user_email?: string
  user_name?: string
  agent_type?: 'test' | 'support' | 'customer'
  confidence_score?: number
  sources_used?: string[]
}

interface UseFeedbackProps {
  feedbackData: FeedbackData
  onFeedbackSubmitted?: (type: 'positive' | 'negative') => void
}

interface UseFeedbackReturn {
  feedback: 'positive' | 'negative' | null
  isSubmitting: boolean
  error: string | null
  submitFeedback: (type: 'positive' | 'negative') => Promise<void>
  hasSubmitted: boolean
}

export function useFeedback({ 
  feedbackData, 
  onFeedbackSubmitted 
}: UseFeedbackProps): UseFeedbackReturn {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const submitFeedback = useCallback(async (type: 'positive' | 'negative') => {
    // Don't allow resubmission
    if (hasSubmitted || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitFeedbackAPI({
        ...feedbackData,
        feedback_type: type === 'positive' ? 'helpful' : 'unhelpful',
        user_info: {
          agent_id: feedbackData.agent_id,
          email: feedbackData.user_email || '',
          full_name: feedbackData.user_name || ''
        }
      })

      if (result.success) {
        setFeedback(type)
        setHasSubmitted(true)
        
        // Call optional callback
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(type)
        }
      } else {
        throw new Error(result.error || 'Failed to submit feedback')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback'
      setError(errorMessage)
      console.error('Feedback submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [feedbackData, hasSubmitted, isSubmitting, onFeedbackSubmitted])

  return {
    feedback,
    isSubmitting,
    error,
    submitFeedback,
    hasSubmitted,
  }
}
