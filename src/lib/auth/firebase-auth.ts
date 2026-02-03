import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUser, createOrUpdateUser, UserInfo } from '@/lib/firebase/users'

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<UserInfo> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    
    console.log('✅ Firebase Auth successful:', firebaseUser.email)
    
    // Get or create user document in Firestore
    let userInfo = await getUser(firebaseUser.email!)
    
    if (!userInfo) {
      // User doesn't exist in Firestore, create them
      console.log('📝 Creating new user document in Firestore')
      
      // Extract name from email
      const emailName = firebaseUser.email!.split('@')[0]
      const nameParts = emailName.split('.')
      const name = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'User'
      const surname = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || ''
      
      userInfo = await createOrUpdateUser({
        agent_id: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        surname,
        full_name: `${name} ${surname}`.trim(),
        agency: 'Betterhome Real Estate',
        office: 'PropTech Division',
        company: 'Betterhome',
        division: 'PropTech',
        user_type: 'internal',
        role: 'user', // Default role, admins need to be set manually
      })
    } else {
      // Update last login
      userInfo = await createOrUpdateUser(userInfo)
    }
    
    return userInfo
  } catch (error: any) {
    console.error('❌ Sign in error:', error)
    
    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later')
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password')
    }
    
    throw new Error(error.message || 'Failed to sign in')
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
    console.log('👋 User signed out')
  } catch (error) {
    console.error('❌ Sign out error:', error)
    throw new Error('Failed to sign out')
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}

/**
 * Change password for current user
 */
export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No user is currently signed in')
  }
  
  try {
    await firebaseUpdatePassword(user, newPassword)
    console.log('✅ Password changed successfully')
  } catch (error: any) {
    console.error('❌ Change password error:', error)
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign out and sign in again before changing your password')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password')
    }
    
    throw new Error(error.message || 'Failed to change password')
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
    console.log('✅ Password reset email sent')
  } catch (error: any) {
    console.error('❌ Password reset error:', error)
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    }
    
    throw new Error(error.message || 'Failed to send password reset email')
  }
}
