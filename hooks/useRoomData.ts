'use client'

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room } from '@/types/room';

export function useRoomData(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setRoom({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          } as Room);
          setRoomNotFound(false);
        } else {
          setRoomNotFound(true);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to room:', error);
        setRoomNotFound(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { room, isLoading, roomNotFound };
}
