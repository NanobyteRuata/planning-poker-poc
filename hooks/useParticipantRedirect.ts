'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';

export function useParticipantRedirect(roomId: string, currentStoryId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!roomId || !currentStoryId) return;

    const guestId = getOrCreateGuestId();
    const participantRef = doc(db, 'rooms', roomId, 'participants', guestId);

    // Listen to participant document changes
    const unsubscribe = onSnapshot(participantRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newStoryId = data.currentStoryId;
        
        // If currentStoryId changed and is different from current page, redirect
        if (newStoryId && newStoryId !== currentStoryId) {
          router.push(`/${roomId}/story/${newStoryId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, currentStoryId, router]);
}
