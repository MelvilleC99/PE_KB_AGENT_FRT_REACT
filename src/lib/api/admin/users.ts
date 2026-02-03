// User management API operations
// READS: Direct Firebase (fast!)
// WRITES: Via Backend API (secure!)

import { getUsers as getUsersFirebase, type User as FirebaseUser } from '@/lib/firebase/users';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Re-export User type from Firebase
export type User = FirebaseUser;

export interface CreateUserInput {
  email: string
  password: string
  name: string
  surname: string
  company: string
  office: string
  role: string
  phone?: string
}

export interface UpdateUserInput {
  name: string
  surname: string
  company: string
  office: string
  role: string
  phone?: string
}

/**
 * Get all users directly from Firebase
 * Fast read operation - no backend roundtrip
 */
export async function getUsers(): Promise<User[]> {
  return getUsersFirebase();
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserInput): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Update an existing user
 */
export async function updateUser(email: string, updates: UpdateUserInput): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(email: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}`, {
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
