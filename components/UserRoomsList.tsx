'use client'

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrCreateGuestId } from '@/lib/guestUser';
import type { Room } from '@/types/room';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

export function UserRoomsList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = getOrCreateGuestId();

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('createdBy', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Room));
      
      setRooms(roomsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Rooms</CardTitle>
          <CardDescription>Loading your rooms...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (rooms.length === 0) {
    return null;
  }

  return (
    <Card className='max-h-[600px]'>
      <CardHeader>
        <CardTitle>Your Rooms</CardTitle>
        <CardDescription>Rooms you have created</CardDescription>
      </CardHeader>
      <CardContent className='overflow-auto'>
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <Link key={room.id} href={`/room/${room.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{room.name}</p>
                    {room.sessionStatus === 'active' && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {room.createdAt?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
