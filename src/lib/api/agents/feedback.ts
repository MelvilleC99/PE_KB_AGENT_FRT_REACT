// Feedback API operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface FeedbackInput {
  message_id: string
  session_id: string
  feedback_type: 'helpful' | 'unhelpful'
  query: string
  response: string
  agent_type: 'test' | 'support' | 'customer'
  user_info: {
    agent_id: string
    email: string
    full_name: string
  }
  confidence_score?: number
  sources_used?: string[]
}

/**
 * Submit feedback for an agent response
 */
export async function submitFeedback(input: FeedbackInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: data.error || 'Failed to submit feedback' 
      };
    }
  } catch (err: any) {
    console.error('Feedback submission failed:', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}
