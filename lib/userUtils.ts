import { auth } from '@/auth'
import { getOrCreateUserId, getUserName } from './userStorage'

export interface User {
  id: string
  name: string
  isAuthenticated: boolean
  atlassianAccountId?: string
}

export async function getCurrentUser(): Promise<User> {
  const session = await auth()
  
  if (session?.user) {
    return {
      id: session.user.id || session.atlassianAccountId || '',
      name: session.user.name || 'Unknown User',
      isAuthenticated: true,
      atlassianAccountId: session.atlassianAccountId,
    }
  }
  
  const guestId = getOrCreateUserId()
  const guestName = getUserName()
  
  return {
    id: guestId,
    name: guestName || 'Guest User',
    isAuthenticated: false,
  }
}

export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  
  return session
}
