// Vector synchronization operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Sync a KB entry to the vector database
 * Creates/updates embeddings for search
 */
export async function syncKBEntry(entryId: string): Promise<{
  success: boolean;
  chunks_created?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/entries/${entryId}/sync`, {
      method: 'POST',
    });

    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
