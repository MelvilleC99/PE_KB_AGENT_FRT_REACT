// Document upload and processing operations

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface DocumentUploadInput {
  file: File;
  title: string;
  entryType: string;
  userType: string;
  product: string;
  category: string;
  subcategory?: string;
  tags?: string;
  autoSync?: boolean;
}

export interface DocumentUploadResult {
  success: boolean;
  entry_id?: string;
  title?: string;
  sections_extracted?: number;
  word_count?: number;
  sync_status?: {
    success?: boolean;
    chunks_created?: number;
    status?: string;
    message?: string;
    error?: string;
  };
  message?: string;
  error?: string;
}

/**
 * Upload a document (PDF, Word, etc.) and create KB entry
 */
export async function uploadDocument(input: DocumentUploadInput): Promise<DocumentUploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('title', input.title);
    formData.append('entry_type', input.entryType);
    formData.append('userType', input.userType);
    formData.append('product', input.product);
    formData.append('category', input.category);
    formData.append('tags', input.tags || '');
    formData.append('subcategory', input.subcategory || '');
    formData.append('auto_sync', String(input.autoSync !== false));

    const response = await fetch(`${BACKEND_URL}/api/kb/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred' 
    };
  }
}

/**
 * Get the status of a document upload/processing
 */
export async function getDocumentStatus(entryId: string): Promise<{
  success: boolean;
  entry_id?: string;
  title?: string;
  vector_status?: string;
  chunks_created?: number;
  sync_error?: string;
  source?: string;
  original_filename?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/kb/documents/status/${entryId}`);
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
