// Vector database operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface VectorEntry {
  entry_id: string;
  title: string;
  content_preview?: string;
  metadata: {
    type?: string;
    category?: string;
    userType?: string;
    createdAt?: string;
    is_chunk?: boolean;
    chunk_section?: string;
    chunk_position?: string;
    parent_title?: string;
    total_chunks?: number;
    [key: string]: any;
  };
}

/**
 * Get all vector entries (embeddings in vector DB)
 */
export async function getVectorEntries(limit: number = 100): Promise<{
  success: boolean;
  entries?: VectorEntry[];
  error?: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/vectors?limit=${limit}`);
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Delete a vector entry and all its chunks
 */
export async function deleteVectorEntry(entryId: string): Promise<{
  success: boolean;
  chunks_deleted?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/vectors/${entryId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
