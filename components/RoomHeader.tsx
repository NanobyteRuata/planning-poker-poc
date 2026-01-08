'use client'

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoryFormDialog } from "@/components/StoryFormDialog";
import { EditRoomDialog } from "@/components/EditRoomDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlayIcon, StopCircleIcon, ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";

interface RoomHeaderProps {
  roomName: string;
  roomId: string;
  isSessionActive: boolean;
  isRoomCreator: boolean;
  hasActiveStories: boolean;
  isStarting: boolean;
  isEnding: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  onDeleteRoom: () => void;
}

export function RoomHeader({
  roomName,
  roomId,
  isSessionActive,
  isRoomCreator,
  hasActiveStories,
  isStarting,
  isEnding,
  onStartSession,
  onEndSession,
  onDeleteRoom,
}: RoomHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);

  return (
    <>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{roomName}</h1>
        {isSessionActive && (
          <Badge variant="default" className="text-sm">
            Session Active
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isRoomCreator && (
          <>
            <EditRoomDialog
              roomId={roomId}
              currentName={roomName}
              trigger={
                <Button variant="ghost" size="sm">
                  <PencilIcon className="w-4 h-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="w-4 h-4" />
            </Button>
          </>
        )}
        {isRoomCreator && !isSessionActive && (
          <>
            <StoryFormDialog
              roomId={roomId}
              trigger={<Button variant="outline">Add Story</Button>}
            />
            {hasActiveStories && (
              <Button onClick={onStartSession} disabled={isStarting}>
                <PlayIcon className="w-4 h-4 mr-2" />
                {isStarting ? "Starting..." : "Start Session"}
              </Button>
            )}
          </>
        )}
        {isRoomCreator && isSessionActive && (
          <Button
            variant="destructive"
            onClick={() => setShowEndSessionConfirm(true)}
            disabled={isEnding}
          >
            <StopCircleIcon className="w-4 h-4 mr-2" />
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        )}
      </div>
    </div>

    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete Room"
      description={`Are you sure you want to delete "${roomName}"? This will permanently delete all stories, votes, and participants in this room. This action cannot be undone.`}
      confirmText="Delete Room"
      cancelText="Cancel"
      onConfirm={onDeleteRoom}
      variant="destructive"
    />

    <ConfirmDialog
      open={showEndSessionConfirm}
      onOpenChange={setShowEndSessionConfirm}
      title="End Session"
      description="Are you sure you want to end the session? This will stop the current planning poker session."
      confirmText="End Session"
      cancelText="Cancel"
      onConfirm={onEndSession}
      variant="destructive"
    />
    </>
  );
}
