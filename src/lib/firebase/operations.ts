// Firebase Client SDK operations for KB entries (browser-safe!)
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const KB_COLLECTION = 'kb_entries';

export interface KBEntry {
  id?: string;
  type: string;
  title: string;
  category?: string;
  metadata?: any;
  content: any;
  severity?: string;
  userRoles?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
  vectorStatus?: 'pending' | 'synced' | 'failed';
  lastSyncedAt?: Date | null;
  syncError?: string;
}

export interface KBEntryWithStatus extends KBEntry {
  vectorStatus: 'pending' | 'synced' | 'failed';
  lastSyncedAt?: Date | null;
  syncError?: string;
}

// Get all KB entries
export async function getKBEntries(): Promise<KBEntryWithStatus[]> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return [];
  }
  
  try {
    const q = query(collection(db, KB_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const entries: KBEntryWithStatus[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Skip archived entries
      if (data.status === 'archived' || data.archived === true) {
        return;
      }
      
      entries.push({ 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        lastSyncedAt: data.lastSyncedAt?.toDate?.() || null,
      } as KBEntryWithStatus);
    });
    
    return entries;
  } catch (error) {
    console.error('Error fetching KB entries:', error);
    return [];
  }
}

// Get entries by category
export async function getKBEntriesByCategory(category: string): Promise<KBEntryWithStatus[]> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return [];
  }
  
  try {
    const q = query(
      collection(db, KB_COLLECTION), 
      where('metadata.category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const entries: KBEntryWithStatus[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({ 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        lastSyncedAt: data.lastSyncedAt?.toDate?.() || null,
      } as KBEntryWithStatus);
    });
    
    return entries;
  } catch (error) {
    console.error('Error fetching entries by category:', error);
    return [];
  }
}

// Get a single KB entry
export async function getKBEntry(id: string): Promise<KBEntry | null> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return null;
  }
  
  try {
    const docRef = doc(db, KB_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as KBEntry;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching KB entry:', error);
    return null;
  }
}

// Get archived KB entries
export async function getArchivedKBEntries(): Promise<KBEntryWithStatus[]> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return [];
  }
  
  try {
    const q = query(
      collection(db, KB_COLLECTION), 
      where('status', '==', 'archived'),
      orderBy('archivedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const entries: KBEntryWithStatus[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({ 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        archivedAt: data.archivedAt?.toDate?.() || new Date(),
        lastSyncedAt: data.lastSyncedAt?.toDate?.() || null,
      } as KBEntryWithStatus);
    });
    
    return entries;
  } catch (error) {
    console.error('Error fetching archived entries:', error);
    return [];
  }
}

// Increment usage count
export async function incrementUsageCount(id: string) {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return;
  }
  
  try {
    const docRef = doc(db, KB_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().usageCount || 0;
      await updateDoc(docRef, {
        usageCount: currentCount + 1,
        lastUsed: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error incrementing usage count:', error);
  }
}
