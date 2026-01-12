'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { hasUserData } from '@/lib/userStorage'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (pathname === '/login' || pathname === '/auth/signin') {
      setIsChecking(false)
      return
    }

    const checkAuth = async () => {
      if (session?.user && hasUserData()) {
        setIsChecking(false)
      } else if (session?.user && !hasUserData()) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      } else if (hasUserData()) {
        setIsChecking(false)
      } else {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      }
    }

    checkAuth()
  }, [session, status, pathname, router])

  if (pathname === '/login' || pathname === '/auth/signin') {
    return <>{children}</>
  }

  if (isChecking || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
