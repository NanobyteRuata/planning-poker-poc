'use client'

import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';

export function useCurrentStory(roomId: string | null, currentStoryId: string | null | undefined) {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    if (!roomId || !currentStoryId) {
      setCurrentStory(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'stories', currentStoryId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCurrentStory({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          } as Story);
        } else {
          setCurrentStory(null);
        }
      },
      (error) => {
        console.error('Error listening to current story:', error);
        setCurrentStory(null);
      }
    );

    return () => unsubscribe();
  }, [roomId, currentStoryId]);

  return currentStory;
}

export function useHasActiveStories(roomId: string | null) {
  const [hasActiveStories, setHasActiveStories] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('roomId', '==', roomId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasActiveStories(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [roomId]);

  return hasActiveStories;
}
