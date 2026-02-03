// Ticket/Escalation API operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface EscalationData {
  session_id: string
  agent_id: string
  query: string
  agent_response: string
  confidence_score: number
  escalation_reason: string
  user_email: string
  user_name: string
  user_agency: string
  user_office: string
  agent_type: 'test' | 'support' | 'customer'
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/**
 * Create a support ticket from escalated query
 */
export async function createTicket(
  escalationData: EscalationData,
  conversationHistory: ConversationMessage[]
): Promise<{
  success: boolean
  ticket_id?: string
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...escalationData,
        conversation_history: conversationHistory
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { 
        success: true, 
        ticket_id: data.ticket_id || data.id 
      };
    } else {
      return { 
        success: false, 
        error: data.error || 'Failed to create ticket' 
      };
    }
  } catch (err: any) {
    console.error('Ticket creation failed:', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Decline ticket creation for escalated query
 */
export async function declineTicket(
  failureId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent-failure/${failureId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: data.error || 'Failed to decline ticket' 
      };
    }
  } catch (err: any) {
    console.error('Ticket decline failed:', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}
