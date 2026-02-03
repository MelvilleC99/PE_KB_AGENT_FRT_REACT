// KB Entry CRUD operations (Create, Update, Delete, Archive, Restore)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface KBEntryInput {
  type: string;
  title: string;
  content: string; // Searchable text content for vector database
  metadata: {
    entryType: string;
    userType: string;
    product: string;
    category: string;
    subcategory?: string;
    tags?: string;
    [key: string]: any;
  };
  rawFormData?: Record<string, any>;
}

/**
 * Create a new KB entry
 */
export async function createKBEntry(entryData: KBEntryInput): Promise<{success: boolean, id?: string, error?: any}> {
  try {
    console.log('🚀 Creating KB entry (direct to backend):', entryData);
    
    const response = await fetch(`${BACKEND_URL}/api/kb/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });

    console.log('📡 Backend Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend Error Response:', errorText);
      return { 
        success: false, 
        error: `Backend returned ${response.status}: ${errorText}` 
      };
    }

    const result = await response.json();
    console.log('✅ Backend Success Response:', result);
    
    return { 
      success: result.success, 
      id: result.entry_id, 
      error: result.error 
    };
  } catch (error) {
    console.error('❌ Network/Fetch Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred' 
    };
  }
}

/**
 * Update an existing KB entry
 */
export async function updateKBEntry(
  id: string, 
  updates: Partial<KBEntryInput>
): Promise<{success: boolean, error?: any}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Archive a KB entry (soft delete)
 */
export async function archiveKBEntry(id: string): Promise<{success: boolean, error?: any}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/entries/${id}/archive`, {
      method: 'POST',
    });

    return await response.json();
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Restore an archived KB entry
 */
export async function restoreKBEntry(id: string): Promise<{success: boolean, error?: any}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/entries/${id}/restore`, {
      method: 'POST',
    });

    return await response.json();
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Permanently delete a KB entry
 */
export async function permanentlyDeleteKBEntry(id: string): Promise<{success: boolean, error?: any}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/entries/${id}`, {
      method: 'DELETE',
    });

    return await response.json();
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Delete a KB entry (alias for archive)
 */
export async function deleteKBEntry(id: string): Promise<{success: boolean, error?: any}> {
  return archiveKBEntry(id);
}
