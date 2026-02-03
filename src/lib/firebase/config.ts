// Firebase configuration for PropertyEngine Knowledge Base
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  // Use environment variables - you need to set these in .env.local
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "missing-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "propengine-12655.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "propengine-12655",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "propengine-12655.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "missing-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "missing-app-id"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// For development: Show Firebase configuration status
if (import.meta.env.DEV) {
  const isConfigured = import.meta.env.VITE_FIREBASE_API_KEY && 
                      import.meta.env.VITE_FIREBASE_API_KEY !== 'your-api-key-here'
  
  if (isConfigured) {
    console.log('🔥 Firebase configured for project:', firebaseConfig.projectId)
  } else {
    console.warn('⚠️ Firebase not configured! Set env variables in .env.local')
  }
}

export default app
