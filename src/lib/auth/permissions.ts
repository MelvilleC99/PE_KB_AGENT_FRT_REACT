import { UserInfo } from '@/lib/firebase/users'

/**
 * Check if user has admin role
 */
export function isAdmin(user: UserInfo | null): boolean {
  return user?.role === 'admin'
}

/**
 * Check if user has specific role
 */
export function hasRole(user: UserInfo | null, role: string): boolean {
  return user?.role === role
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(user: UserInfo | null): boolean {
  return isAdmin(user)
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: UserInfo | null): boolean {
  return isAdmin(user)
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(user: UserInfo | null): boolean {
  return isAdmin(user)
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: UserInfo | null): string {
  if (!user) return 'Guest'
  return user.full_name || user.name || user.email
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: UserInfo | null): string {
  if (!user) return 'G'
  
  if (user.name && user.surname) {
    return `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
  }
  
  if (user.full_name) {
    const parts = user.full_name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return user.full_name.charAt(0).toUpperCase()
  }
  
  return user.email.charAt(0).toUpperCase()
}
