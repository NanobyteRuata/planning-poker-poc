'use client'

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVerticalIcon } from 'lucide-react';
import type { Ticket } from '@/types/story';

interface SortableTicketCardProps {
  story: Ticket;
  isCurrentStory: boolean;
  isSelectedStory: boolean;
  shouldPing: boolean;
  isRoomCreator?: boolean;
  onStorySelect?: (story: Ticket) => void;
}

export function SortableTicketCard({
  story,
  isCurrentStory,
  isSelectedStory,
  shouldPing,
  isRoomCreator = false,
  onStorySelect,
}: SortableTicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: story.id,
    disabled: !isRoomCreator,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all cursor-pointer hover:bg-accent/30',
        isSelectedStory && 'ring-2 ring-primary'
      )}
      onClick={() => onStorySelect?.(story)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isRoomCreator && (
              <button
                className="cursor-grab active:cursor-grabbing touch-none"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVerticalIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            
            {isCurrentStory && (
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full bg-green-500 absolute',
                    shouldPing && 'animate-ping'
                  )}
                />
                <div className="w-3 h-3 rounded-full bg-green-500 relative" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{story.ticketId}</Badge>
                {story.storyPoint !== null && (
                  <Badge variant="default">{story.storyPoint} points</Badge>
                )}
              </div>
              <CardTitle className="truncate text-sm">{story.name}</CardTitle>
              {story.description && (
                <CardDescription className="mt-2 line-clamp-2 text-xs">
                  {story.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
