'use client'

import { Button } from "@/components/ui/button";
import { TicketFormDialog } from "@/components/TicketFormDialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Ticket } from "@/types/story";

interface TicketDetailsProps {
  story: Ticket;
  isCurrentStory: boolean;
  isStoryCreator: boolean;
  roomId: string;
  onDelete: () => void;
}

export function TicketDetails({
  story,
  isCurrentStory,
  isStoryCreator,
  roomId,
  onDelete,
}: TicketDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{story.ticketId}</Badge>
              {story.storyPoint !== null && (
                <Badge variant="default">{story.storyPoint} points</Badge>
              )}
              <Badge
                variant={story.status === "active" ? "secondary" : "outline"}
              >
                {story.status}
              </Badge>
              {isCurrentStory && (
                <Badge variant="default">Current Ticket</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{story.name}</CardTitle>
            {story.description && (
              <CardDescription className="mt-2 whitespace-pre-wrap">
                {story.description}
              </CardDescription>
            )}
          </div>
          {isStoryCreator && (
            <div className="flex gap-2">
              <TicketFormDialog
                roomId={roomId}
                story={story}
                trigger={
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
