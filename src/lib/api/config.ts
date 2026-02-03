// API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const API_CONFIG = {
  BASE_URL: BACKEND_URL,
  
  ENDPOINTS: {
    // Agent endpoints
    TEST_AGENT: `${BACKEND_URL}/api/agent/test/`,
    SUPPORT_AGENT: `${BACKEND_URL}/api/agent/support/`,
    CUSTOMER_AGENT: `${BACKEND_URL}/api/agent/customer/`,
    
    // KB endpoints  
    KB_ENTRIES: `${BACKEND_URL}/api/kb/entries`,
    KB_DOCUMENTS: `${BACKEND_URL}/api/kb/documents`,
    
    // System endpoints
    HEALTH: `${BACKEND_URL}/api/health`,
  },
  
  TIMEOUT: 30000,
  
  HEADERS: {
    'Content-Type': 'application/json',
  }
}

// Helper function for API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const config: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.HEADERS,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(endpoint, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}
