'use client'

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vote } from '@/types/story';

export function useStoryVotes(storyId: string | null | undefined) {
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (!storyId) {
      setVotes([]);
      return;
    }

    const votesRef = collection(db, 'votes');
    const q = query(votesRef, where('storyId', '==', storyId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const votesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Vote[];
        setVotes(votesData);
      },
      (error) => {
        console.error('Error fetching votes:', error);
        setVotes([]);
      }
    );

    return () => unsubscribe();
  }, [storyId]);

  return votes;
}
