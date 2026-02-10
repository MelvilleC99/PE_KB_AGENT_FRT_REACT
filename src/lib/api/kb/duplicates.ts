/**
 * KB Duplicate Detection API
 * 
 * Checks for similar entries before creating new ones
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface SimilarEntry {
  id: string
  title: string
  similarity_score: number // 0-1 (e.g., 0.92 = 92% similar)
  type: string
  category?: string
  content_snippet: string
  created_at?: string
}

export interface DuplicateCheckRequest {
  title: string
  content: string
  type: string
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean
  similar_entries: SimilarEntry[]
}

/**
 * Check for duplicate or similar entries
 * Uses vector similarity search in Astra DB
 */
export async function checkForDuplicates(
  request: DuplicateCheckRequest
): Promise<DuplicateCheckResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/check-duplicates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      console.error('Duplicate check failed:', response.status)
      // Fail gracefully - don't block save if check fails
      return {
        has_duplicates: false,
        similar_entries: []
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    // Fail gracefully - don't block save if check fails
    return {
      has_duplicates: false,
      similar_entries: []
    }
  }
}
