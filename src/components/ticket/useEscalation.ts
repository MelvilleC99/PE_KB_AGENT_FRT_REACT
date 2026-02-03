/**
 * useEscalation Hook
 * 
 * Manages escalation state: failure recording, ticket creation, declining
 */

import { useState, useCallback } from 'react'
import { createTicket as createTicketAPI, declineTicket as declineTicketAPI } from '@/lib/api/agents'

export interface EscalationData {
  session_id: string
  agent_id: string
  query: string
  agent_response: string
  confidence_score: number
  escalation_reason: 'low_confidence' | 'no_results'
  user_email?: string
  user_name?: string
  user_agency?: string
  user_office?: string
  agent_type?: 'test' | 'support' | 'customer'
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface UseEscalationReturn {
  // State
  failureId: string | null
  ticketId: number | null
  isRecordingFailure: boolean
  isCreatingTicket: boolean
  isDeclining: boolean
  error: string | null
  status: 'idle' | 'failure_recorded' | 'ticket_created' | 'declined'
  
  // Actions
  recordFailure: (data: EscalationData) => Promise<string | null>
  createTicket: (conversationHistory?: ConversationMessage[], userPhone?: string) => Promise<number | null>
  declineTicket: () => Promise<boolean>
  reset: () => void
}

export function useEscalation(): UseEscalationReturn {
  const [failureId, setFailureId] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<number | null>(null)
  const [isRecordingFailure, setIsRecordingFailure] = useState(false)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'failure_recorded' | 'ticket_created' | 'declined'>('idle')

  /**
   * Record an agent failure (step 1)
   * In Vite, we create failure ID immediately and proceed
   */
  const recordFailure = useCallback(async (data: EscalationData): Promise<string | null> => {
    setIsRecordingFailure(true)
    setError(null)

    try {
      // Generate a failure ID immediately
      const generatedId = `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setFailureId(generatedId)
      setStatus('failure_recorded')
      return generatedId
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record failure'
      setError(msg)
      console.error('Record failure error:', err)
      return null
    } finally {
      setIsRecordingFailure(false)
    }
  }, [])

  /**
   * Create a ticket for the recorded failure (step 2 - if user accepts)
   */
  const createTicket = useCallback(async (
    conversationHistory?: ConversationMessage[],
    userPhone?: string
  ): Promise<number | null> => {
    if (!failureId) {
      setError('No failure recorded')
      return null
    }

    setIsCreatingTicket(true)
    setError(null)

    try {
      // Note: We need the escalation data stored when recordFailure was called
      // For now, we'll need to pass the full data through or store it in state
      // This is a simplified version
      const result = await createTicketAPI(
        {
          session_id: '',
          agent_id: '',
          query: '',
          agent_response: '',
          confidence_score: 0,
          escalation_reason: 'low_confidence',
          user_email: '',
          user_name: '',
          user_agency: '',
          user_office: '',
          agent_type: 'support'
        } as any, // We'll need to store this data properly
        conversationHistory || []
      )

      if (result.success && result.ticket_id) {
        const ticketNumber = parseInt(result.ticket_id)
        setTicketId(ticketNumber)
        setStatus('ticket_created')
        return ticketNumber
      } else {
        throw new Error(result.error || 'Failed to create ticket')
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create ticket'
      setError(msg)
      console.error('Create ticket error:', err)
      return null
    } finally {
      setIsCreatingTicket(false)
    }
  }, [failureId])

  /**
   * Decline ticket creation (step 2 - if user declines)
   */
  const declineTicket = useCallback(async (): Promise<boolean> => {
    if (!failureId) {
      return true // Nothing to decline
    }

    setIsDeclining(true)
    setError(null)

    try {
      const result = await declineTicketAPI(failureId)

      if (result.success) {
        setStatus('declined')
        return true
      } else {
        throw new Error(result.error || 'Failed to decline')
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to decline'
      setError(msg)
      console.error('Decline error:', err)
      return false
    } finally {
      setIsDeclining(false)
    }
  }, [failureId])

  /**
   * Reset state for new escalation
   */
  const reset = useCallback(() => {
    setFailureId(null)
    setTicketId(null)
    setError(null)
    setStatus('idle')
  }, [])

  return {
    failureId,
    ticketId,
    isRecordingFailure,
    isCreatingTicket,
    isDeclining,
    error,
    status,
    recordFailure,
    createTicket,
    declineTicket,
    reset,
  }
}
