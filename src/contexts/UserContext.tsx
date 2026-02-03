import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { UserInfo } from '@/lib/firebase/users'
import { onAuthStateChange } from '@/lib/auth/firebase-auth'
import { getUser } from '@/lib/firebase/users'

interface UserContextType {
  user: UserInfo | null
  firebaseUser: FirebaseUser | null
  isLoggedIn: boolean
  login: (user: UserInfo) => void
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      console.log('🔥 Auth state changed:', fbUser?.email || 'No user')
      setFirebaseUser(fbUser)
      
      if (fbUser) {
        // User is signed in, get their Firestore data
        try {
          const userInfo = await getUser(fbUser.email!)
          if (userInfo) {
            setUser(userInfo)
            console.log('✅ User data loaded:', userInfo.full_name)
          } else {
            console.warn('⚠️ User authenticated but no Firestore document found')
            setUser(null)
          }
        } catch (error) {
          console.error('❌ Error loading user data:', error)
          setUser(null)
        }
      } else {
        // User is signed out
        setUser(null)
      }
      
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = (newUser: UserInfo) => {
    setUser(newUser)
    console.log(`✅ User ${newUser.full_name} logged in successfully`)
  }

  const logout = () => {
    setUser(null)
    setFirebaseUser(null)
    console.log('👋 User logged out from context')
  }

  const refreshUser = async () => {
    if (firebaseUser?.email) {
      const userInfo = await getUser(firebaseUser.email)
      if (userInfo) {
        setUser(userInfo)
      }
    }
  }

  const value: UserContextType = {
    user,
    firebaseUser,
    isLoggedIn: !!user && !!firebaseUser,
    login,
    logout,
    isLoading,
    refreshUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export type { UserInfo }
