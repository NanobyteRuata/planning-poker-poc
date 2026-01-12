'use client'

import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateUserId, getUserName } from '@/lib/userStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VoteCardsProps {
  storyId: string;
  currentVote: number | string | null;
  disabled?: boolean;
}

const VOTE_OPTIONS: (number | string)[] = ['?', 1, 2, 3, 5, 8, 13, 21, 34, 55];

export function VoteCards({ storyId, currentVote, disabled }: VoteCardsProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (point: number | string) => {
    setIsVoting(true);
    
    try {
      const voterId = getOrCreateUserId();
      const voterName = getUserName() || 'Anonymous';
      
      // Use a composite key for the vote document ID
      const voteId = `${storyId}_${voterId}`;
      
      await setDoc(doc(db, 'votes', voteId), {
        point,
        voterId,
        voterName,
        storyId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {VOTE_OPTIONS.map((point) => (
        <Button
          key={point}
          variant={currentVote === point ? 'default' : 'outline'}
          onClick={() => handleVote(point)}
          disabled={disabled || isVoting}
          className="h-16 text-lg font-bold"
        >
          {point}
        </Button>
      ))}
    </div>
  );
}
