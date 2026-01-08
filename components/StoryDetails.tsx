'use client'

import { Button } from "@/components/ui/button";
import { StoryFormDialog } from "@/components/StoryFormDialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Story } from "@/types/story";

interface StoryDetailsProps {
  story: Story;
  isCurrentStory: boolean;
  isStoryCreator: boolean;
  roomId: string;
  onDelete: () => void;
}

export function StoryDetails({
  story,
  isCurrentStory,
  isStoryCreator,
  roomId,
  onDelete,
}: StoryDetailsProps) {
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
                <Badge variant="default">Current Story</Badge>
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
              <StoryFormDialog
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
