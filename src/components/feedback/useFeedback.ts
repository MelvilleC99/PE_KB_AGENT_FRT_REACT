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
      // Build clean payload matching backend expectations
      const payload = {
        message_id: feedbackData.message_id,
        session_id: feedbackData.session_id,
        feedback_type: type === 'positive' ? 'helpful' : 'unhelpful',
        query: feedbackData.query,
        response: feedbackData.response,
        agent_type: feedbackData.agent_type || 'test',
        user_info: {
          agent_id: feedbackData.agent_id || 'anonymous',
          email: feedbackData.user_email || 'no-email@unknown.com',
          full_name: feedbackData.user_name || 'Anonymous User'
        },
        confidence_score: feedbackData.confidence_score,
        sources_used: feedbackData.sources_used
      }

      console.log('📤 Submitting feedback with payload:', payload);
      const result = await submitFeedbackAPI(payload)

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
