import { useState, useCallback, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import type { ChatMessage, FeedbackType } from './types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function useChat(agentType: 'support' | 'customer' | 'test' = 'support') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { user } = useUser()

  useEffect(() => {
    console.log(`💬 useChat initialized for ${agentType} agent`)
    console.log(`👤 Current user:`, user ? `${user.full_name} (${user.agent_id})` : 'Not authenticated')
  }, [agentType, user])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) {
      console.log('⚠️ Message blocked:', { 
        empty: !message.trim(), 
        loading: isLoading 
      })
      return
    }

    console.log(`📤 Sending message to ${agentType} agent:`, message.substring(0, 50))

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setIsTyping(true)

    try {
      console.log(`🔗 Connecting to ${agentType} agent API`)
      
      // Map agent type to backend endpoint
      const endpointMap = {
        'test': '/api/agent/test/',
        'support': '/api/agent/support/',
        'customer': '/api/agent/customer/'
      }
      
      const response = await fetch(`${BACKEND_URL}${endpointMap[agentType]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId || `${agentType}-session-${Date.now()}`,
          user_info: {
            agent_id: user?.agent_id,
            email: user?.email,
            name: user?.full_name,
            phone: user?.phone,
            agency: user?.agency,
            office: user?.office,
            company: user?.company,
            division: user?.division,
            user_type: user?.user_type
          }
        })
      })

      // ============ RATE LIMIT HANDLING ============
      if (response.status === 429) {
        const errorData = await response.json()
        const resetInSeconds = errorData.detail?.reset_in_seconds || 0
        const hours = Math.floor(resetInSeconds / 3600)
        const minutes = Math.floor((resetInSeconds % 3600) / 60)
        
        let timeMessage = ''
        if (hours > 0) {
          timeMessage = `${hours} hour${hours > 1 ? 's' : ''}`
          if (minutes > 0) {
            timeMessage += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`
          }
        } else if (minutes > 0) {
          timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`
        } else {
          timeMessage = 'a few moments'
        }
        
        const rateLimitMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `You've reached your query limit. Please try again in ${timeMessage}. Your limit will reset automatically.`,
          timestamp: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, rateLimitMessage])
        return
      }
      // ============================================

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()

      if (data.session_id && !sessionId) {
        setSessionId(data.session_id)
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
        sources: data.sources || [],
        classificationConfidence: data.classification_confidence,
        requiresEscalation: data.requires_escalation,
        // Debug fields
        enhancedQuery: data.enhanced_query,
        queryMetadata: data.query_metadata,
        searchAttempts: data.search_attempts,
        debugMetrics: data.debug_metrics,
        contextDebug: data.context_debug
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.requires_escalation) {
        console.log("🎫 Backend escalation detected - EscalationPrompt will handle")
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the backend right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }, [isLoading, sessionId, agentType, user])

  // Handle feedback (updates local state - actual write handled by FeedbackButtons)
  const handleFeedback = useCallback((messageId: string, feedbackType: FeedbackType) => {
    console.log(`👍👎 Feedback received for message ${messageId}:`, feedbackType)
    
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, feedback: feedbackType }
          : msg
      )
    )
  }, [])

  const clearMessages = useCallback(() => {
    console.log('🗑️ Clearing chat messages')
    setMessages([])
    setSessionId(null)
  }, [])

  const resetSession = useCallback(() => {
    console.log('🔄 Resetting session')
    setSessionId(null)
  }, [])

  return {
    messages,
    isLoading,
    isTyping,
    sessionId,
    sendMessage,
    handleFeedback,
    clearMessages,
    resetSession
  }
}
