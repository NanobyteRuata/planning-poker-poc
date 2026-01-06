'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, onSnapshot, query, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';
import { useStoryPresence } from '@/hooks/useStoryPresence';
import type { Story, Vote } from '@/types/story';
import type { Room } from '@/types/room';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StoryFormDialog } from '@/components/StoryFormDialog';
import { StoryWorkflowControl } from '@/components/StoryWorkflowControl';
import { StoryParticipantList } from '@/components/StoryParticipantList';

interface StoryPageProps {
  params: Promise<{ "room-id": string; "story-id": string }>;
}

export default function StoryPage({ params }: StoryPageProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string>('');
  const [storyId, setStoryId] = useState<string>('');
  const [story, setStory] = useState<Story | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const currentUserId = getOrCreateGuestId();
  const isStoryCreator = story?.createdBy === currentUserId;
  
  useStoryPresence(roomId, storyId);

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const rId = resolvedParams["room-id"];
      const sId = resolvedParams["story-id"];
      setRoomId(rId);
      setStoryId(sId);
      
      try {
        // Fetch room (one-time)
        const roomDoc = await getDoc(doc(db, 'rooms', rId));
        if (roomDoc.exists()) {
          setRoom({
            id: roomDoc.id,
            ...roomDoc.data(),
            createdAt: roomDoc.data().createdAt?.toDate(),
          } as Room);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching room:', error);
        setIsLoading(false);
      }
    });
  }, [params]);

  // Real-time listener for story updates
  useEffect(() => {
    if (!storyId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'stories', storyId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setStory({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          } as Story);
        }
      },
      (error) => {
        console.error('Error listening to story:', error);
      }
    );

    return () => unsubscribe();
  }, [storyId]);

  useEffect(() => {
    if (!storyId) return;

    const votesRef = collection(db, 'stories', storyId, 'votes');
    const q = query(votesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const votesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Vote));
      
      setVotes(votesData);
    });

    return () => unsubscribe();
  }, [storyId]);


  const handleDeleteStory = async () => {
    if (!story || !confirm('Are you sure you want to delete this story?')) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'stories', story.id));
      router.push(`/${roomId}`);
    } catch (error) {
      console.error('Error deleting story:', error);
      setIsDeleting(false);
    }
  };

  const handleResetStory = async () => {
    if (!story || !confirm('Are you sure you want to reset this story? This will delete all votes and reset the workflow.')) return;
    setIsLoading(true);
    try {
      // Delete all votes in the subcollection
      const votesRef = collection(db, 'stories', story.id, 'votes');
      const votesSnapshot = await getDocs(votesRef);
      
      const batch = writeBatch(db);
      votesSnapshot.docs.forEach((voteDoc) => {
        batch.delete(voteDoc.ref);
      });
      await batch.commit();

      // Reset story to overview step
      await updateDoc(doc(db, 'stories', story.id), {
        currentStep: 'overview',
        storyPoint: null,
        status: 'active',
      });
    } catch (error) {
      console.error('Error resetting story:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Story Not Found</h1>
          <p className="text-muted-foreground">This story doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push(`/${roomId}`)}>Back to Room</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className='flex items-center justify-between gap-4'>
          <Button variant="outline" onClick={() => router.push(`/${roomId}`)}>
            ← Back to Room
          </Button>

          {isStoryCreator && <div className="flex items-center gap-2">
            {story.status === 'completed' && <Button variant="outline" onClick={handleResetStory}>
              Reset Story
            </Button>}
            <StoryFormDialog 
            roomId={roomId}
            story={story}
            trigger={<Button>Edit Story</Button>}
          />
          </div>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{story.ticketId}</Badge>
                      {story.storyPoint !== null && (
                        <Badge variant="default">{story.storyPoint} points</Badge>
                      )}
                      <Badge variant={story.status === 'active' ? 'secondary' : 'outline'}>
                        {story.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{story.name}</CardTitle>
                    {story.description && (
                      <CardDescription className="mt-3 text-base whitespace-pre-wrap">
                        {story.description}
                      </CardDescription>
                    )}
                  </div>
                  {isStoryCreator && story.status === 'active' && (
                    <div className="flex gap-2">
                      <StoryFormDialog
                        roomId={roomId}
                        story={story}
                        trigger={
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteStory}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {story.status === 'active' && (
              <>
                {story.currentStep === 'reveal' && votes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Vote Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {votes.map((vote) => (
                          <div key={vote.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <span className="font-medium">{vote.voterName}</span>
                            <Badge variant="default" className="text-base">{vote.point} points</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {story.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle>Story Completed</CardTitle>
                  <CardDescription>
                    This story has been completed with {story.storyPoint} story points.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {story.status === 'active' && (
              <StoryWorkflowControl
                story={story}
                isCreator={isStoryCreator}
              />
            )}

            <StoryParticipantList
              roomId={roomId}
              storyId={storyId}
              currentStep={story.currentStep}
              votes={votes}
              roomCreatorId={room?.createdBy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
