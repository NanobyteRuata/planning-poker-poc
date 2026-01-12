'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Share2, Check, Copy } from 'lucide-react'

interface RoomInviteLinkProps {
  roomId: string
  roomName: string
}

export function RoomInviteLink({ roomId, roomName }: RoomInviteLinkProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/room/${roomId}` 
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite participants to {roomName}</DialogTitle>
          <DialogDescription>
            Share this link with anyone you want to invite to this planning poker session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invitation Link</Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                value={inviteUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can join as a participant. They'll need to enter their name when joining.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
