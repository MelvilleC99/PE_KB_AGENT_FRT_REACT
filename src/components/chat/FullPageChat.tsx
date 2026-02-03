import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  RotateCcw
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useChat, type ChatMessage } from "./useChat"
import { useUser } from "@/contexts/UserContext"
import { FeedbackButtons } from "@/components/feedback"
import { EscalationPrompt } from "@/components/ticket"
import { DebugAnalytics } from "@/components/debug"

interface FullPageChatProps {
  agentType: 'test' | 'support' | 'customer'
}

export function FullPageChat({ agentType }: FullPageChatProps) {
  const [inputMessage, setInputMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()

  // Track which messages have had escalation handled
  const [handledEscalations, setHandledEscalations] = useState<Set<string>>(new Set())

  // Use the chat hook with agent type
  const {
    messages,
    isLoading,
    isTyping,
    sessionId,
    sendMessage,
    handleFeedback,
    clearMessages,
  } = useChat(agentType)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
      setInputMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getAgentTitle = () => {
    switch (agentType) {
      case 'test': return 'Test Agent (Debug Mode)'
      case 'support': return 'Support Agent'
      case 'customer': return 'Customer Support'
    }
  }

  const getAgentColor = () => {
    switch (agentType) {
      case 'test': return 'from-purple-600 to-purple-700'
      case 'support': return 'from-blue-600 to-blue-700'
      case 'customer': return 'from-green-600 to-green-700'
      default: return 'from-blue-600 to-blue-700'
    }
  }

  // Helper to get the previous user message for a given assistant message
  const getPreviousUserMessage = (messageIndex: number): string => {
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content
      }
    }
    return ''
  }

  // Handle escalation completion (ticket created or declined)
  const handleEscalationComplete = (messageId: string) => {
    setHandledEscalations(prev => new Set([...prev, messageId]))
  }

  const headerColorClass = getAgentColor()

  return (
    <div className="flex flex-col h-full max-h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className={`flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r ${headerColorClass} text-white rounded-t-lg`}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white/30">
            <AvatarFallback className="bg-white/20 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{getAgentTitle()}</p>
            <p className="text-xs text-blue-100">Online • Ready to help</p>
          </div>
        </div>
        <Button
          onClick={clearMessages}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          disabled={isLoading || messages.length === 0}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="h-12 w-12 mb-4 text-gray-400" />
            <p className="text-lg font-medium">Welcome {user?.full_name || 'User'} to PropertyEngine Support</p>
            <p className="text-sm mt-2">Ask me about: Workflows, Definitions, Error Solutions, How-to Guides</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, messageIndex) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col gap-2">
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{formatTime(message.timestamp)}</p>
                    </div>

                    {/* Sources - Only show for support agents (NOT test agent, as test agent shows in debug panel) */}
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && agentType === 'support' && (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs font-medium text-gray-600">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs bg-white border border-gray-200 rounded p-2">
                            <div className="font-medium text-gray-900">{source.title}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Debug Analytics - Only for test agent */}
                    {message.role === 'assistant' && agentType === 'test' && (
                      <DebugAnalytics
                        metrics={(message as any).debugMetrics}
                        contextDebug={(message as any).contextDebug}
                        responseConfidence={message.sources?.[0]?.confidence}
                        classificationConfidence={message.classificationConfidence}
                        enhancedQuery={(message as any).enhancedQuery}
                        queryMetadata={(message as any).queryMetadata}
                        sources={message.sources}
                      />
                    )}

                    {/* Escalation Prompt - Using new isolated component */}
                    {message.role === 'assistant' && 
                     message.requiresEscalation && 
                     !handledEscalations.has(message.id) &&
                     user && 
                     sessionId && (
                      <EscalationPrompt
                        escalationData={{
                          session_id: sessionId,
                          agent_id: user.agent_id || '',
                          query: getPreviousUserMessage(messageIndex),
                          agent_response: message.content,
                          confidence_score: message.sources?.[0]?.confidence || 0,
                          escalation_reason: 'low_confidence',
                          user_email: user.email,
                          user_name: user.full_name,
                          user_agency: user.agency,
                          user_office: user.office,
                          agent_type: agentType
                        }}
                        conversationHistory={messages.map(m => ({
                          role: m.role,
                          content: m.content,
                          timestamp: m.timestamp
                        }))}
                        onTicketCreated={(ticketId) => {
                          handleEscalationComplete(message.id)
                          console.log(`✅ Ticket #${ticketId} created`)
                        }}
                        onDeclined={() => {
                          handleEscalationComplete(message.id)
                          console.log('❌ Ticket declined')
                        }}
                        className="mt-2"
                      />
                    )}

                    {/* Feedback buttons - Using isolated FeedbackButtons component */}
                    {message.role === 'assistant' && 
                     agentType !== 'test' && 
                     !message.requiresEscalation &&
                     user && 
                     sessionId && (
                      <FeedbackButtons
                        messageId={message.id}
                        sessionId={sessionId}
                        query={getPreviousUserMessage(messageIndex)}
                        response={message.content}
                        user={{
                          agent_id: user.agent_id || '',
                          email: user.email,
                          full_name: user.full_name
                        }}
                        agentType={agentType}
                        confidenceScore={message.sources?.[0]?.confidence}
                        sourcesUsed={message.sources?.map(s => s.title)}
                        existingFeedback={message.feedback}
                        onFeedbackSubmitted={(type) => handleFeedback(message.id, type)}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-200">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about PropertyEngine..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputMessage.trim()} size="icon" className="h-[44px] w-[44px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
