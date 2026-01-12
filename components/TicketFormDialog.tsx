'use client'

import { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateUserId } from '@/lib/userStorage';
import type { Ticket } from '@/types/story';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { JiraTicketSelector } from '@/components/JiraTicketSelector';

interface TicketFormDialogProps {
  roomId: string;
  story?: Ticket;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function TicketFormDialog({ roomId, story, trigger, onSuccess }: TicketFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jiraCloudId, setJiraCloudId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!story;

  useEffect(() => {
    if (story) {
      setTicketId(story.ticketId);
      setName(story.name);
      setDescription(story.description);
      setJiraCloudId(story.jiraCloudId || '');
    } else {
      setTicketId('');
      setName('');
      setDescription('');
      setJiraCloudId('');
    }
  }, [story, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim() || !name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && story) {
        // Update existing story
        await updateDoc(doc(db, 'tickets', story.id), {
          ticketId: ticketId.trim(),
          name: name.trim(),
          description: description.trim(),
          jiraCloudId: jiraCloudId || null,
        });
      } else {
        // Create new story
        const guestId = getOrCreateUserId();
        
        // Get the highest order number for this room
        const storiesRef = collection(db, 'tickets');
        const q = query(
          storiesRef,
          where('roomId', '==', roomId),
          orderBy('order', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0);
        
        await addDoc(collection(db, 'tickets'), {
          ticketId: ticketId.trim(),
          name: name.trim(),
          description: description.trim(),
          status: 'active',
          storyPoint: null,
          roomId,
          createdBy: guestId,
          createdAt: serverTimestamp(),
          votesRevealed: false,
          totalVotes: 0,
          currentStep: 'overview',
          order: maxOrder + 1,
          jiraCloudId: jiraCloudId || null,
        });
      }
      
      setOpen(false);
      setTicketId('');
      setName('');
      setDescription('');
      setJiraCloudId('');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving story:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the ticket details below.' 
              : 'Add a new ticket to start planning poker.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticketId">Jira Ticket</Label>
            <JiraTicketSelector
              onSelect={(issueKey, summary, cloudId, description) => {
                setTicketId(issueKey);
                setName(summary);
                setJiraCloudId(cloudId);
                if (description) {
                  setDescription(description);
                }
              }}
              selectedTicket={ticketId}
            />
            <Input
              id="ticketId"
              type="text"
              placeholder="Or enter ticket ID manually (e.g., JIRA-123)"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Ticket Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter ticket name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter ticket description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !ticketId.trim() || !name.trim()}
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Ticket' : 'Create Ticket')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
