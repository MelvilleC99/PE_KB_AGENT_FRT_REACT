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
        "inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm",
        className
      )}>
        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div>
          <span className="font-medium text-green-800">Ticket Created: </span>
          <span className="font-mono font-bold text-green-700">#{ticketId}</span>
          <span className="text-green-600 ml-2">• Email confirmation sent</span>
        </div>
      </div>
    )
  }

  // Show declined state
  if (status === 'declined') {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600",
        className
      )}>
        No problem! Feel free to ask another question.
      </div>
    )
  }

  // Show loading state while recording failure
  if (isRecordingFailure || status === 'idle') {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600",
        className
      )}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Preparing options...</span>
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className={cn(
        "inline-flex flex-col gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm",
        className
      )}>
        <p className="text-red-700 font-medium">Unable to create ticket</p>
        <p className="text-red-600 text-xs">
          Please contact: support@propertyengine.co.za
        </p>
      </div>
    )
  }

  // Show prompt (failure recorded, waiting for user action)
  return (
    <div className={cn(
      "inline-flex flex-col gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm",
      className
    )}>
      <p className="text-blue-800">
        I couldn't find a confident answer. Would you like to create a support ticket?
      </p>
      
      <div className="flex gap-2">
        <Button
          onClick={handleCreateTicket}
          disabled={isCreatingTicket || isDeclining}
          size="sm"
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isCreatingTicket ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Creating...
            </>
          ) : (
            <>
              <MessageSquare className="h-3 w-3 mr-1" />
              Yes, Create Ticket
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDecline}
          disabled={isCreatingTicket || isDeclining}
          variant="outline"
          size="sm"
          className="h-7 text-xs border-gray-300 hover:bg-gray-100"
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
