'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { getOrCreateUserId, getUserName } from '@/lib/userStorage'

export interface CurrentUser {
  id: string
  name: string | null
  isAuthenticated: boolean
  atlassianAccountId?: string
}

export function useCurrentUser(): CurrentUser {
  const { data: session } = useSession()

  return useMemo(() => {
    // Atlassian users: Use session ID (persists across browsers/devices)
    if (session?.user) {
      const atlassianId = session.user.id || session.atlassianAccountId || ''
      return {
        id: atlassianId,
        name: session.user.name || getUserName(),
        isAuthenticated: true,
        atlassianAccountId: session.atlassianAccountId,
      }
    }

    // Guest users: Use localStorage ID (browser-specific)
    const guestId = getOrCreateUserId()
    const guestName = getUserName()

    return {
      id: guestId,
      name: guestName,
      isAuthenticated: false,
    }
  }, [session])
}
