"use client";

import { useEffect, useState } from "react";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrCreateGuestId, getGuestName } from "@/lib/guestUser";
import { deleteRoom } from "@/lib/roomUtils";
import { useRouter } from "next/navigation";
import type { Story } from "@/types/story";
import { StoryList } from "@/components/StoryList";
import { StoryWorkflowControl } from "@/components/StoryWorkflowControl";
import { StoryParticipantList } from "@/components/StoryParticipantList";
import { RoomHeader } from "@/components/RoomHeader";
import { StoryDetails } from "@/components/StoryDetails";
import { VoteResults } from "@/components/VoteResults";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRoomData } from "@/hooks/useRoomData";
import { useCurrentStory, useHasActiveStories } from "@/hooks/useStoryData";
import { useStoryVotes } from "@/hooks/useVotes";
import { useSessionManagement } from "@/hooks/useSessionManagement";

interface RoomPageProps {
  params: Promise<{ "room-id": string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showDeleteStoryConfirm, setShowDeleteStoryConfirm] = useState(false);
  const router = useRouter();

  const currentUserId = getOrCreateGuestId();
  
  const { room, isLoading, roomNotFound } = useRoomData(roomId);
  const currentStory = useCurrentStory(roomId, room?.currentStoryId);
  const hasActiveStories = useHasActiveStories(roomId);
  const currentStoryVotes = useStoryVotes(currentStory?.id);
  const selectedStoryVotes = useStoryVotes(selectedStory?.id);

  const isRoomCreator = room?.createdBy === currentUserId;
  const isStoryCreator = currentStory?.createdBy === currentUserId;
  const isSessionActive = room?.sessionStatus === "active";

  const displayStory = selectedStory || currentStory;
  const displayVotes = selectedStory ? selectedStoryVotes : currentStoryVotes;
  const isDisplayStoryCreator = displayStory?.createdBy === currentUserId;

  const { isStarting, isEnding, handleStartSession, handleEndSession } =
    useSessionManagement(roomId, currentStory, isRoomCreator);

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const id = resolvedParams["room-id"];
      setRoomId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const guestName = getGuestName();
    if (!guestName) return;

    const participantRef = doc(db, "rooms", roomId, "participants", currentUserId);
    
    setDoc(
      participantRef,
      {
        id: currentUserId,
        name: guestName,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );

    const interval = setInterval(() => {
      updateDoc(participantRef, {
        lastSeen: serverTimestamp(),
      }).catch((error) => {
        console.error("Error updating presence:", error);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (!isSessionActive || !room?.currentStoryId) {
      setSelectedStory(null);
      return;
    }

    if (currentStory) {
      setSelectedStory(currentStory);
    }
  }, [isSessionActive, room?.currentStoryId, currentStory]);

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteRoom(roomId);
      router.push("/");
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room. Please try again.");
    }
  };

  const handleDeleteStory = async () => {
    if (!displayStory) return;

    try {
      if (isSessionActive && room?.currentStoryId === displayStory.id) {
        const storiesRef = collection(db, "stories");
        const q = query(
          storiesRef,
          where("roomId", "==", roomId),
          where("status", "==", "active"),
          orderBy("order", "asc")
        );

        const snapshot = await getDocs(q);
        const stories = snapshot.docs;
        const currentIndex = stories.findIndex((doc) => doc.id === displayStory.id);
        const nextStory = stories[currentIndex + 1] || stories[currentIndex - 1];

        if (nextStory && nextStory.id !== displayStory.id) {
          await updateDoc(doc(db, "rooms", roomId), {
            currentStoryId: nextStory.id,
          });
        } else {
          await updateDoc(doc(db, "rooms", roomId), {
            sessionStatus: "idle",
            currentStoryId: null,
          });
        }
      }

      await deleteDoc(doc(db, "stories", displayStory.id));
      setSelectedStory(null);
      setShowDeleteStoryConfirm(false);
    } catch (error) {
      console.error("Error deleting story:", error);
      setShowDeleteStoryConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  if (roomNotFound || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Room Not Found</h1>
          <p className="text-muted-foreground">
            This room doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const shouldShowVoteResults =
    ((displayStory?.status === "active" && displayStory?.currentStep === "reveal") ||
      displayStory?.status === "completed") &&
    displayVotes.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <RoomHeader
          roomName={room.name}
          roomId={room.id}
          isSessionActive={isSessionActive}
          isRoomCreator={isRoomCreator}
          hasActiveStories={hasActiveStories}
          isStarting={isStarting}
          isEnding={isEnding}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onDeleteRoom={handleDeleteRoom}
        />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr_380px]">
          <StoryList
            roomId={room.id}
            currentStoryId={room.currentStoryId}
            selectedStoryId={selectedStory?.id}
            currentStoryStep={currentStory?.currentStep}
            isSessionActive={isSessionActive}
            onStorySelect={handleStorySelect}
          />

          <div className="space-y-6">
            {displayStory ? (
              <>
                <StoryDetails
                  story={displayStory}
                  isCurrentStory={displayStory.id === currentStory?.id}
                  isStoryCreator={isDisplayStoryCreator}
                  roomId={roomId}
                  onDelete={() => setShowDeleteStoryConfirm(true)}
                />

                {shouldShowVoteResults && (
                  <VoteResults votes={displayVotes} isRevealed={true} />
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a story</CardTitle>
                  <CardDescription>
                    Please select a story to view details.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {currentStory &&
              currentStory.id === selectedStory?.id &&
              currentStory.status === "active" && (
                <StoryWorkflowControl
                  story={currentStory}
                  isCreator={isStoryCreator}
                />
              )}

            <StoryParticipantList
              roomId={roomId}
              storyId={selectedStory?.id || ""}
              currentStep={selectedStory?.currentStep || "overview"}
              votes={selectedStoryVotes}
              roomCreatorId={room?.createdBy}
            />
          </div>
        </div>

        <ConfirmDialog
          open={showDeleteStoryConfirm}
          onOpenChange={setShowDeleteStoryConfirm}
          title="Delete Story"
          description={`Are you sure you want to delete "${displayStory?.name}"? This action cannot be undone.`}
          confirmText="Delete Story"
          cancelText="Cancel"
          onConfirm={handleDeleteStory}
          variant="destructive"
        />
      </div>
    </div>
  );
}
