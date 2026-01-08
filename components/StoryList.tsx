'use client'

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableStoryCard } from '@/components/SortableStoryCard';

interface StoryListProps {
  roomId: string;
  currentStoryId?: string | null;
  selectedStoryId?: string | null;
  currentStoryStep?: string;
  isSessionActive?: boolean;
  onStorySelect?: (story: Story) => void;
}

export function StoryList({ 
  roomId, 
  currentStoryId,
  selectedStoryId,
  currentStoryStep,
  isSessionActive,
  onStorySelect 
}: StoryListProps) {
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
      // Then sort by order
      return (a.order || 0) - (b.order || 0);
    });
  }, [stories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedStories.findIndex((story) => story.id === active.id);
    const newIndex = sortedStories.findIndex((story) => story.id === over.id);

    const reorderedStories = arrayMove(sortedStories, oldIndex, newIndex);

    // Update order in Firestore
    try {
      const batch = writeBatch(db);
      reorderedStories.forEach((story, index) => {
        const storyRef = doc(db, 'stories', story.id);
        batch.update(storyRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error updating story order:', error);
    }
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedStories.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sortedStories.map((story) => (
            <SortableStoryCard
              key={story.id}
              story={story}
              isCurrentStory={currentStoryId === story.id}
              isSelectedStory={selectedStoryId === story.id}
              shouldPing={currentStoryId === story.id && currentStoryStep === 'voting'}
              onStorySelect={onStorySelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

