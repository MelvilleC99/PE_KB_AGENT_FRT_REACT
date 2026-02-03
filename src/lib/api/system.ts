// System health and monitoring operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  message: string;
  response_time_ms?: number | null;
  model?: string;
  dimensions?: number | null;
}

export interface SystemHealthData {
  timestamp: number;
  overall_status: 'healthy' | 'degraded' | 'down';
  services: {
    redis: ServiceHealth;
    firebase: ServiceHealth;
    astra: ServiceHealth;
    openai_chat: ServiceHealth;
    openai_embeddings: ServiceHealth;
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  resource: RequestInfo, 
  options: RequestInit = {}, 
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
}

/**
 * Check system health status
 */
export async function checkSystemHealth(): Promise<{
  success: boolean;
  data?: SystemHealthData;
  error?: string;
}> {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/api/health`);
    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.error || 'Failed to check system health' 
      };
    }
  } catch (err: any) {
    console.error('Health check failed:', err);
    return { 
      success: false, 
      error: err.message || 'Unable to connect to backend' 
    };
  }
}
