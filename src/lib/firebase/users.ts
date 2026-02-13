// Firebase Client SDK operations for users (browser-safe!)
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const USERS_COLLECTION = 'users';

// User interface for admin list view
export interface User {
  agent_id: string
  email: string
  name: string
  surname: string
  full_name: string
  company: string
  office: string
  role: string
  phone?: string
  total_queries: number
  total_sessions: number
  created_at: string
  last_login: string | null
}

// UserInfo interface for authentication
export interface UserInfo {
  agent_id: string
  email: string
  name: string
  surname: string
  full_name: string
  phone?: string
  agency: string
  office: string
  company: string
  division: string
  user_type: string
  role: string
  created_at?: Timestamp
  last_login?: Timestamp | null
  total_queries?: number
  total_sessions?: number
  preferences?: {
    notifications: boolean
    email_updates: boolean
  }
}

/**
 * Get all users directly from Firebase
 * Fast read operation - no backend roundtrip
 */
export async function getUsers(): Promise<User[]> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return [];
  }
  
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({ 
        email: docSnap.id,  // Document ID is the email
        ...data,
        created_at: data.created_at?.toDate?.().toISOString() || new Date().toISOString(),
        last_login: data.last_login?.toDate?.().toISOString() || null,
      } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get a single user directly from Firebase (for authentication)
 * Fast read operation - no backend roundtrip
 */
export async function getUser(email: string): Promise<UserInfo | null> {
  if (!db) {
    console.warn('Firebase not initialized. Please set up your environment variables.');
    return null;
  }

  try {
    const docRef = doc(db, USERS_COLLECTION, email.toLowerCase());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserInfo;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Create or update user (for authentication flow)
 */
export async function createOrUpdateUser(userData: UserInfo): Promise<UserInfo> {
  if (!db) {
    console.warn('Firebase not initialized. Returning user data without persistence.');
    const now = Timestamp.now();
    return {
      ...userData,
      created_at: userData.created_at || now,
      last_login: now,
      total_queries: userData.total_queries || 0,
      total_sessions: userData.total_sessions || 0,
      preferences: userData.preferences || {
        notifications: true,
        email_updates: false
      }
    };
  }

  try {
    const normalizedEmail = userData.email.toLowerCase();
    const userRef = doc(db, USERS_COLLECTION, normalizedEmail);
    const existingUser = await getDoc(userRef);
    
    const now = Timestamp.now();
    
    if (existingUser.exists()) {
      // Update existing user with login time
      await updateDoc(userRef, {
        last_login: now
      });
      
      return {
        ...existingUser.data() as UserInfo,
        last_login: now
      };
    } else {
      // Create new user
      const newUser: UserInfo = {
        ...userData,
        email: normalizedEmail,
        created_at: now,
        last_login: now,
        total_queries: 0,
        total_sessions: 0,
        preferences: {
          notifications: true,
          email_updates: false
        }
      };
      
      await setDoc(userRef, newUser);
      console.log(`✅ Created new user in Firebase: ${newUser.full_name}`);
      return newUser;
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    // Return user data even if Firebase fails (development mode)
    const now = Timestamp.now();
    return {
      ...userData,
      created_at: userData.created_at || now,
      last_login: now,
      total_queries: userData.total_queries || 0,
      total_sessions: userData.total_sessions || 0,
      preferences: userData.preferences || {
        notifications: true,
        email_updates: false
      }
    };
  }
}
