/**
 * EscalationPrompt Component
 * 
 * Shows "Would you like to create a ticket?" UI
 * Handles the accept/decline flow
 * Shows ticket confirmation with reference number
 */

import { MessageSquare, X, Loader2, CheckCircle, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEscalation, EscalationData, ConversationMessage } from "./useEscalation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface EscalationPromptProps {
  // Data needed to record failure
  escalationData: EscalationData
  
  // Conversation for ticket context
  conversationHistory?: ConversationMessage[]
  
  // Callbacks
  onTicketCreated?: (ticketId: number) => void
  onDeclined?: () => void
  onFailureRecorded?: (failureId: string) => void
  
  // Styling
  className?: string
}

export function EscalationPrompt({
  escalationData,
  conversationHistory,
  onTicketCreated,
  onDeclined,
  onFailureRecorded,
  className,
}: EscalationPromptProps) {
  const {
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
  } = useEscalation()

  // Record failure on mount
  useEffect(() => {
    if (status === 'idle' && !isRecordingFailure) {
      recordFailure(escalationData).then((id) => {
        if (id && onFailureRecorded) {
          onFailureRecorded(id)
        }
      })
    }
  }, []) // Only run once on mount

  const handleCreateTicket = async () => {
    const id = await createTicket(conversationHistory)
    if (id && onTicketCreated) {
      onTicketCreated(id)
    }
  }

  const handleDecline = async () => {
    const success = await declineTicket()
    if (success && onDeclined) {
      onDeclined()
    }
  }

  // Show ticket created success with reference number
  if (status === 'ticket_created' && ticketId) {
    return (
      <div className={cn(
        "p-4 bg-green-50 border border-green-200 rounded-lg",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800">
              Support Ticket Created Successfully!
            </h4>
            <div className="mt-2 p-3 bg-white rounded border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Ticket className="h-4 w-4" />
                <span className="font-mono font-bold text-lg">#{ticketId}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Reference this number in any follow-up communications.
              </p>
            </div>
            <p className="text-sm text-green-600 mt-2">
              Our support team will respond within 2 business hours.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show declined state
  if (status === 'declined') {
    return (
      <div className={cn(
        "p-3 bg-gray-50 border border-gray-200 rounded-lg",
        className
      )}>
        <p className="text-sm text-gray-600">
          No problem! Feel free to ask another question or try rephrasing.
        </p>
      </div>
    )
  }

  // Show loading state while recording failure
  if (isRecordingFailure || status === 'idle') {
    return (
      <div className={cn(
        "p-4 bg-gray-50 border border-gray-200 rounded-lg",
        className
      )}>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Preparing escalation options...</span>
        </div>
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className={cn(
        "p-4 bg-red-50 border border-red-200 rounded-lg",
        className
      )}>
        <p className="text-sm text-red-700 font-medium">Unable to create ticket</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <p className="text-xs text-red-500 mt-2">
          Please contact support directly at support@propertyengine.co.za
        </p>
      </div>
    )
  }

  // Show prompt (failure recorded, waiting for user action)
  return (
    <div className={cn(
      "p-4 bg-blue-50 border border-blue-200 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <p className="font-medium text-blue-900">Need more help?</p>
      </div>
      
      <p className="text-sm text-blue-700 mb-3">
        I couldn't find a confident answer to your question. Would you like me to create a support ticket so our team can assist you?
      </p>
      
      <div className="flex gap-2">
        <Button
          onClick={handleCreateTicket}
          disabled={isCreatingTicket || isDeclining}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCreatingTicket ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Creating...
            </>
          ) : (
            <>
              <MessageSquare className="h-3 w-3 mr-1" />
              Create Ticket
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDecline}
          disabled={isCreatingTicket || isDeclining}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-gray-100"
        >
          {isDeclining ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <X className="h-3 w-3 mr-1" />
          )}
          No Thanks
        </Button>
      </div>
    </div>
  )
}
