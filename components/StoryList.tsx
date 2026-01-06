'use client'

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface StoryListProps {
  roomId: string;
}

export function StoryList({ roomId }: StoryListProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const storiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Story));
        
        setStories(storiesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching stories:', err);
        setError('Failed to load stories');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  const sortedStories = useMemo(() => {
    return [...stories].sort((a, b) => {
      // First sort by status (active first, then completed)
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      // Then sort by createdAt (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [stories]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (sortedStories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Stories</CardTitle>
          <CardDescription>
            Create your first story to start planning poker!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedStories.map((story) => (
        <Link key={story.id} href={`/${roomId}/story/${story.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{story.ticketId}</Badge>
                    {story.storyPoint !== null && (
                      <Badge variant="default">{story.storyPoint} points</Badge>
                    )}
                  </div>
                  <CardTitle className="truncate">{story.name}</CardTitle>
                  {story.description && (
                    <CardDescription className="mt-2 line-clamp-2">
                      {story.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
