'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setUserName, setUserId, getOrCreateUserId } from '@/lib/userStorage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LogIn } from 'lucide-react'

function LoginContent() {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAtlassianNameInput, setShowAtlassianNameInput] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const isAtlassianEnabled = process.env.NEXT_PUBLIC_ENABLE_ATLASSIAN_LOGIN === 'true'

  useEffect(() => {
    if (session?.user) {
      setShowAtlassianNameInput(true)
      setName(session.user.name || '')
    }
  }, [session])

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const userId = getOrCreateUserId()
      setUserName(name.trim())
      router.push(callbackUrl)
    } catch (error) {
      console.error('Error setting guest name:', error)
      setIsSubmitting(false)
    }
  }

  const handleAtlassianLogin = () => {
    signIn('atlassian', { callbackUrl: '/login' })
  }

  const handleAtlassianNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !session?.user) return
    
    const atlassianId = session.user.id || session.atlassianAccountId || `atlassian_${Date.now()}`
    setUserId(atlassianId)
    setUserName(name.trim())
    router.push(callbackUrl)
  }

  if (showAtlassianNameInput && session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome, {session.user.email}</CardTitle>
            <CardDescription>
              Please confirm or update your display name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAtlassianNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="atlassianName">Your Name</Label>
                <Input
                  id="atlassianName"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This name will be visible to other participants
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!name.trim()}
              >
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Planning Poker</CardTitle>
          <CardDescription>
            Sign in to create rooms and participate in planning sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {isAtlassianEnabled && (
              <>
                <Button
                  onClick={handleAtlassianLogin}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in with Atlassian
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue as guest
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleGuestLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant={isAtlassianEnabled ? "outline" : "default"}
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Continuing...' : (isAtlassianEnabled ? 'Continue as Guest' : 'Continue')}
              </Button>
            </form>
          </div>

          {isAtlassianEnabled && (
            <p className="text-xs text-center text-muted-foreground">
              Guest users can participate in sessions but won't have access to Jira integration
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
