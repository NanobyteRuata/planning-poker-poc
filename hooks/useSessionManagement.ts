'use client'

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';

export function useSessionManagement(
  roomId: string | null,
  currentStory: Story | null,
  isRoomCreator: boolean
) {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (
      !currentStory ||
      !roomId ||
      !isRoomCreator ||
      currentStory.status !== 'completed'
    ) {
      return;
    }

    const advanceToNextStory = async () => {
      try {
        const storiesRef = collection(db, 'stories');
        const q = query(
          storiesRef,
          where('roomId', '==', roomId),
          where('status', '==', 'active'),
          orderBy('order', 'asc')
        );

        const snapshot = await getDocs(q);
        const stories = snapshot.docs;

        const currentIndex = stories.findIndex((doc) => doc.id === currentStory.id);
        const nextStory = stories[currentIndex + 1];

        if (nextStory) {
          await updateDoc(doc(db, 'rooms', roomId), {
            currentStoryId: nextStory.id,
          });
        } else {
          await updateDoc(doc(db, 'rooms', roomId), {
            sessionStatus: 'idle',
            currentStoryId: null,
          });
        }
      } catch (error) {
        console.error('Error advancing to next story:', error);
      }
    };

    const timer = setTimeout(advanceToNextStory, 2000);
    return () => clearTimeout(timer);
  }, [currentStory, roomId, isRoomCreator]);

  const handleStartSession = async () => {
    if (!roomId) return;
    setIsStarting(true);

    try {
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('roomId', '==', roomId),
        where('status', '==', 'active'),
        orderBy('order', 'asc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firstStoryId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'rooms', roomId), {
          sessionStatus: 'active',
          currentStoryId: firstStoryId,
        });
      } else {
        alert('No active stories to start session. Please create stories first.');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!roomId) return;
    setIsEnding(true);

    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        sessionStatus: 'idle',
        currentStoryId: null,
      });
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsEnding(false);
    }
  };

  return {
    isStarting,
    isEnding,
    handleStartSession,
    handleEndSession,
  };
}
