'use client'

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StoryList } from '@/components/StoryList';
import { StoryFormDialog } from '@/components/StoryFormDialog';
import { Button } from '@/components/ui/button';

interface RoomPageProps {
  params: Promise<{ "room-id": string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const id = resolvedParams["room-id"];
      setRoomId(id);
      
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          setRoomName(roomDoc.data().name);
        } else {
          setRoomNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        setRoomNotFound(true);
      } finally {
        setIsLoading(false);
      }
    });
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  if (roomNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Room Not Found</h1>
          <p className="text-muted-foreground">This room doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{roomName}</h1>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Stories</h2>
            <StoryFormDialog 
              roomId={roomId}
              trigger={<Button>Add Story</Button>}
            />
          </div>
          <StoryList roomId={roomId} />
        </div>
      </div>
    </div>
  );
}