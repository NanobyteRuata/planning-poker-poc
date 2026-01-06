'use client'

import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId, getGuestName } from '@/lib/guestUser';

export function useStoryPresence(roomId: string, storyId: string) {
  useEffect(() => {
    if (!roomId || !storyId) return;

    const guestId = getOrCreateGuestId();
    const guestName = getGuestName() || 'Anonymous';
    const participantRef = doc(db, 'rooms', roomId, 'participants', guestId);

    // Update presence to current story
    const updatePresence = async () => {
      try {
        await setDoc(participantRef, {
          name: guestName,
          roomId,
          currentStoryId: storyId,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isOnline: true,
        }, { merge: true });
      } catch (error) {
        console.error('Error updating story presence:', error);
      }
    };

    // Initial update
    updatePresence();

    // Update every 30 seconds
    const interval = setInterval(updatePresence, 30000);

    // Cleanup on unmount - remove from story
    return () => {
      clearInterval(interval);
      setDoc(participantRef, {
        currentStoryId: null,
        lastSeen: serverTimestamp(),
      }, { merge: true }).catch(console.error);
    };
  }, [roomId, storyId]);
}
