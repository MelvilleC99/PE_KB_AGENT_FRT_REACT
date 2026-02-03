// Direct Firebase read operations (fast!)
// These bypass the backend for performance

import type { KBEntry } from '@/lib/types/kb';
import { 
  getKBEntries as getKBEntriesFirebase, 
  getKBEntriesByCategory as getKBEntriesByCategoryFirebase,
  getArchivedKBEntries as getArchivedKBEntriesFirebase
} from '@/lib/firebase/operations';

export interface KBEntryWithStatus extends KBEntry {
  vectorStatus: 'pending' | 'synced' | 'failed';
  lastSyncedAt?: Date | null;
  syncError?: string;
  archivedAt?: Date;
}

/**
 * Get all KB entries directly from Firebase
 * Fast read operation - no backend roundtrip
 */
export async function getKBEntries(): Promise<KBEntryWithStatus[]> {
  return getKBEntriesFirebase();
}

/**
 * Get KB entries by category directly from Firebase
 * Fast read operation - no backend roundtrip
 */
export async function getKBEntriesByCategory(category: string): Promise<KBEntryWithStatus[]> {
  return getKBEntriesByCategoryFirebase(category);
}

/**
 * Get archived KB entries directly from Firebase
 * Fast read operation - no backend roundtrip
 */
export async function getArchivedKBEntries(): Promise<KBEntryWithStatus[]> {
  return getArchivedKBEntriesFirebase();
}
