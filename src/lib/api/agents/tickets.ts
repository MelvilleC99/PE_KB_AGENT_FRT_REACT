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
 * Step 1: Record agent failure
 */
export async function recordFailure(
  escalationData: EscalationData
): Promise<{
  success: boolean
  failure_id?: string
  error?: string
}> {
  try {
    console.log('🎫 Step 1: Recording failure to backend...', {
      url: `${BACKEND_URL}/api/agent-failure/`,
      payload: escalationData
    });

    const response = await fetch(`${BACKEND_URL}/api/agent-failure/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escalationData),
    });

    const data = await response.json();
    console.log('🎫 Step 1 Response:', { status: response.status, data });

    if (response.ok) {
      console.log('✅ Failure recorded, ID:', data.failure_id || data.id);
      return { 
        success: true, 
        failure_id: data.failure_id || data.id 
      };
    } else {
      console.error('❌ Record failure failed:', data);
      return { 
        success: false, 
        error: data.error || data.detail || 'Failed to record failure' 
      };
    }
  } catch (err: any) {
    console.error('❌ Record failure network error:', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Step 2: Create a support ticket for recorded failure
 */
export async function createTicket(
  failureId: string,
  conversationHistory: ConversationMessage[]
): Promise<{
  success: boolean
  ticket_id?: string
  error?: string
}> {
  try {
    console.log('🎫 Step 2: Creating Freshdesk ticket...', {
      url: `${BACKEND_URL}/api/agent-failure/${failureId}/create-ticket`,
      failureId,
      conversationLength: conversationHistory.length
    });

    const response = await fetch(`${BACKEND_URL}/api/agent-failure/${failureId}/create-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_history: conversationHistory
      }),
    });

    const data = await response.json();
    console.log('🎫 Step 2 Response:', { status: response.status, data });

    if (response.ok) {
      console.log('✅ Ticket created, ID:', data.ticket_id || data.id);
      return { 
        success: true, 
        ticket_id: data.ticket_id || data.id 
      };
    } else {
      console.error('❌ Create ticket failed:', data);
      return { 
        success: false, 
        error: data.error || data.detail || 'Failed to create ticket' 
      };
    }
  } catch (err: any) {
    console.error('❌ Ticket creation network error:', err);
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
