'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CreateRoomForm() {
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) return;
    
    setIsCreating(true);
    
    try {
      const guestId = getOrCreateGuestId();
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: roomName.trim(),
        createdBy: guestId,
        createdAt: serverTimestamp(),
      });
      
      router.push(`/${roomRef.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreateRoom} className="flex gap-2 w-full max-w-md">
      <Input
        type="text"
        placeholder="Enter room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        disabled={isCreating}
        className="flex-1"
      />
      <Button type="submit" disabled={isCreating || !roomName.trim()}>
        {isCreating ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
