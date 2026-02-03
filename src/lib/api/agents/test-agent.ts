// Agent API operations (Test, Support, Customer)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface AgentChatInput {
  message: string
  session_id?: string
  user_info?: {
    agent_id?: string
    email?: string
    name?: string
    phone?: string
    agency?: string
    office?: string
    company?: string
    division?: string
    user_type?: string
  }
}

interface AgentChatResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Send a message to the test agent
 */
export async function testAgentChat(
  message: string, 
  conversationId?: string
): Promise<AgentChatResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/test/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        session_id: conversationId || `test-session-${Date.now()}` 
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || 'Failed to get agent response' 
      };
    }
  } catch (err: any) {
    console.error('Test agent chat failed:', err);
    return { 
      success: false, 
      error: err.message || 'Unable to connect to backend' 
    };
  }
}

/**
 * Send a message to the support agent
 */
export async function supportAgentChat(input: AgentChatInput): Promise<AgentChatResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/support/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        session_id: input.session_id || `support-session-${Date.now()}`
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || 'Failed to get agent response' 
      };
    }
  } catch (err: any) {
    console.error('Support agent chat failed:', err);
    return { 
      success: false, 
      error: err.message || 'Unable to connect to backend' 
    };
  }
}

/**
 * Send a message to the customer agent
 */
export async function customerAgentChat(input: AgentChatInput): Promise<AgentChatResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/customer/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        session_id: input.session_id || `customer-session-${Date.now()}`
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.detail || 'Failed to get agent response' 
      };
    }
  } catch (err: any) {
    console.error('Customer agent chat failed:', err);
    return { 
      success: false, 
      error: err.message || 'Unable to connect to backend' 
    };
  }
}
