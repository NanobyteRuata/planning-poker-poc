'use client'

import { useState, useEffect } from 'react';
import { addDoc, collection, doc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';
import type { Story } from '@/types/story';
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

interface StoryFormDialogProps {
  roomId: string;
  story?: Story;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function StoryFormDialog({ roomId, story, trigger, onSuccess }: StoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!story;

  useEffect(() => {
    if (story) {
      setTicketId(story.ticketId);
      setName(story.name);
      setDescription(story.description);
    } else {
      setTicketId('');
      setName('');
      setDescription('');
    }
  }, [story, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim() || !name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && story) {
        // Update existing story
        await updateDoc(doc(db, 'stories', story.id), {
          ticketId: ticketId.trim(),
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        // Create new story
        const guestId = getOrCreateGuestId();
        
        // Get the highest order number for this room
        const storiesRef = collection(db, 'stories');
        const q = query(
          storiesRef,
          where('roomId', '==', roomId),
          orderBy('order', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0);
        
        await addDoc(collection(db, 'stories'), {
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
        });
      }
      
      setOpen(false);
      setTicketId('');
      setName('');
      setDescription('');
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
          <DialogTitle>{isEditMode ? 'Edit Story' : 'Create New Story'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the story details below.' 
              : 'Add a new story to start planning poker.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticketId">Ticket ID</Label>
            <Input
              id="ticketId"
              type="text"
              placeholder="e.g., JIRA-123"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Story Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter story name"
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
              placeholder="Enter story description"
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
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Story' : 'Create Story')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
