'use client'

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';
import type { Participant } from '@/types/participant';
import type { Vote } from '@/types/story';
import type { StoryStep } from '@/types/story';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoteCards } from '@/components/VoteCards';

interface StoryParticipantListProps {
  roomId: string;
  storyId: string;
  currentStep: StoryStep;
  votes: Vote[];
  roomCreatorId?: string;
}

export function StoryParticipantList({ 
  roomId, 
  storyId, 
  currentStep, 
  votes,
  roomCreatorId 
}: StoryParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const currentUserId = getOrCreateGuestId();
  const currentUserVote = votes.find(v => v.voterId === currentUserId);

  useEffect(() => {
    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const q = query(
      participantsRef,
      where('currentStoryId', '==', storyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date(),
      } as Participant));
      
      setParticipants(participantsData);
    });

    return () => unsubscribe();
  }, [roomId, storyId]);

  const getParticipantVote = (participantId: string) => {
    return votes.find(v => v.voterId === participantId);
  };

  const renderParticipantStatus = (participant: Participant) => {
    const vote = getParticipantVote(participant.id);

    if (currentStep === 'overview') {
      return null;
    }

    if (currentStep === 'voting') {
      return vote ? (
        <Badge variant="secondary" className="text-xs">Voted</Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Waiting</Badge>
      );
    }

    if (currentStep === 'reveal' || currentStep === 'complete') {
      return vote ? (
        <Badge variant="default" className="text-xs">{vote.point} pts</Badge>
      ) : (
        <Badge variant="outline" className="text-xs">No vote</Badge>
      );
    }

    return null;
  };

  return (
    <>
      {currentStep === 'voting' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cast Your Vote</CardTitle>
              {currentUserVote && (
                <Badge variant="secondary">Voted</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <VoteCards 
              storyId={storyId}
              currentVote={currentUserVote?.point || null}
              disabled={false}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Participants</CardTitle>
            <Badge variant="secondary">{participants.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants in this story yet</p>
          ) : (
            <ul className="space-y-2">
              {participants.map((participant) => (
                <li key={participant.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm flex-1">{participant.name}</span>
                  {roomCreatorId === participant.id && (
                    <Badge variant="outline" className="text-xs">Host</Badge>
                  )}
                  {renderParticipantStatus(participant)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
