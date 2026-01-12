'use client'

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateUserId } from '@/lib/userStorage';
import type { Participant } from '@/types/participant';
import type { Vote } from '@/types/story';
import type { TicketStep } from '@/types/story';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoteCards } from '@/components/VoteCards';

interface TicketParticipantListProps {
  roomId: string;
  storyId: string;
  currentStep: TicketStep;
  votes: Vote[];
  roomCreatorId?: string;
}

export function TicketParticipantList({ 
  roomId, 
  storyId, 
  currentStep, 
  votes,
  roomCreatorId 
}: TicketParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const currentUserId = getOrCreateUserId();
  const currentUserVote = votes.find(v => v.voterId === currentUserId);

  useEffect(() => {
    const participantsRef = collection(db, 'rooms', roomId, 'participants');

    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      const participantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date(),
      } as Participant));
      
      setParticipants(participantsData);
    });

    return () => unsubscribe();
  }, [roomId]);

  const getParticipantVote = (participantId: string) => {
    return votes.find(v => v.voterId === participantId);
  };

  const isParticipantOnline = (participant: Participant) => {
    const now = new Date();
    const lastSeen = participant.lastSeen;
    const diffInSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
    return diffInSeconds < 60;
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
            <p className="text-sm text-muted-foreground">No participants in this ticket yet</p>
          ) : (
            <ul className="space-y-2">
              {participants
                .filter((participant) => {
                  const isOnline = isParticipantOnline(participant);
                  const hasVote = getParticipantVote(participant.id);
                  return isOnline || hasVote;
                })
                .map((participant) => {
                  const isOnline = isParticipantOnline(participant);
                  return (
                    <li key={participant.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm flex-1">{participant.name}</span>
                      {roomCreatorId === participant.id && (
                        <Badge variant="outline" className="text-xs">Host</Badge>
                      )}
                      {renderParticipantStatus(participant)}
                    </li>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
