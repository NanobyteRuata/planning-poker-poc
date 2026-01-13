'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  const router = useRouter()
  const isAtlassianEnabled = process.env.NEXT_PUBLIC_ENABLE_ATLASSIAN_LOGIN === 'true'

  useEffect(() => {
    if (!isAtlassianEnabled) {
      router.push('/login')
    }
  }, [isAtlassianEnabled, router])

  if (!isAtlassianEnabled) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Planning Poker
          </CardTitle>
          <CardDescription className="text-center">
            Sign in with your Atlassian account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn('atlassian', { callbackUrl: '/' })}
            className="w-full"
            size="lg"
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.0002 0C11.5582 0 11.1282 0.176 10.8042 0.5L0.500195 10.804C0.176195 11.128 0.000195312 11.558 0.000195312 12C0.000195312 12.442 0.176195 12.872 0.500195 13.196L10.8042 23.5C11.1282 23.824 11.5582 24 12.0002 24C12.4422 24 12.8722 23.824 13.1962 23.5L23.5002 13.196C23.8242 12.872 24.0002 12.442 24.0002 12C24.0002 11.558 23.8242 11.128 23.5002 10.804L13.1962 0.5C12.8722 0.176 12.4422 0 12.0002 0Z" />
            </svg>
            Sign in with Atlassian
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to link your Jira workspace for planning poker sessions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
