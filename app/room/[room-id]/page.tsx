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
import { getUserName } from "@/lib/userStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { deleteRoom } from "@/lib/roomUtils";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/types/story";
import { TicketList } from "@/components/TicketList";
import { TicketWorkflowControl } from "@/components/TicketWorkflowControl";
import { TicketParticipantList } from "@/components/TicketParticipantList";
import { RoomHeader } from "@/components/RoomHeader";
import { TicketDetails } from "@/components/TicketDetails";
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDeleteTicketConfirm, setShowDeleteTicketConfirm] = useState(false);
  const router = useRouter();

  const currentUser = useCurrentUser();
  const currentUserId = currentUser.id;
  
  const { room, isLoading, roomNotFound } = useRoomData(roomId);
  const currentTicket = useCurrentStory(roomId, room?.currentStoryId);
  const hasActiveTickets = useHasActiveStories(roomId);
  const currentTicketVotes = useStoryVotes(currentTicket?.id);
  const selectedTicketVotes = useStoryVotes(selectedTicket?.id);

  const isRoomCreator = room?.createdBy === currentUserId;
  const isTicketCreator = currentTicket?.createdBy === currentUserId;
  const isSessionActive = room?.sessionStatus === "active";

  const displayTicket = selectedTicket || currentTicket;
  const displayVotes = selectedTicket ? selectedTicketVotes : currentTicketVotes;
  const isDisplayTicketCreator = displayTicket?.createdBy === currentUserId;

  const { isStarting, isEnding, handleStartSession, handleEndSession } =
    useSessionManagement(roomId, currentTicket, isRoomCreator);

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const id = resolvedParams["room-id"];
      setRoomId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const guestName = getUserName();
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

    let interval: NodeJS.Timeout | null = null;

    const updatePresence = () => {
      updateDoc(participantRef, {
        lastSeen: serverTimestamp(),
      }).catch((error) => {
        console.error("Error updating presence:", error);
      });
    };

    const startInterval = () => {
      if (!interval) {
        interval = setInterval(updatePresence, 60000);
      }
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
        updatePresence();
      } else {
        updatePresence();
        startInterval();
      }
    };

    const handleBeforeUnload = () => {
      updateDoc(participantRef, {
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (!isSessionActive || !room?.currentStoryId) {
      setSelectedTicket(null);
      return;
    }

    if (currentTicket) {
      setSelectedTicket(currentTicket);
    }
  }, [isSessionActive, room?.currentStoryId, currentTicket]);

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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

  const handleDeleteTicket = async () => {
    if (!displayTicket) return;

    try {
      if (isSessionActive && room?.currentStoryId === displayTicket.id) {
        const storiesRef = collection(db, "tickets");
        const q = query(
          storiesRef,
          where("roomId", "==", roomId),
          where("status", "==", "active"),
          orderBy("order", "asc")
        );

        const snapshot = await getDocs(q);
        const stories = snapshot.docs;
        const currentIndex = stories.findIndex((doc) => doc.id === displayTicket.id);
        const nextTicket = stories[currentIndex + 1] || stories[currentIndex - 1];

        if (nextTicket && nextTicket.id !== displayTicket.id) {
          await updateDoc(doc(db, "rooms", roomId), {
            currentStoryId: nextTicket.id,
          });
        } else {
          await updateDoc(doc(db, "rooms", roomId), {
            sessionStatus: "idle",
            currentStoryId: null,
          });
        }
      }

      await deleteDoc(doc(db, "tickets", displayTicket.id));
      setSelectedTicket(null);
      setShowDeleteTicketConfirm(false);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setShowDeleteTicketConfirm(false);
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
    ((displayTicket?.status === "active" && displayTicket?.currentStep === "reveal") ||
      displayTicket?.status === "completed") &&
    displayVotes.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <RoomHeader
          roomName={room.name}
          roomId={room.id}
          isSessionActive={isSessionActive}
          isRoomCreator={isRoomCreator}
          hasActiveStories={hasActiveTickets}
          isStarting={isStarting}
          isEnding={isEnding}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onDeleteRoom={handleDeleteRoom}
        />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr_380px]">
          <TicketList
            roomId={room.id}
            currentStoryId={currentTicket?.id}
            selectedStoryId={selectedTicket?.id}
            currentStoryStep={currentTicket?.currentStep}
            isSessionActive={isSessionActive}
            isRoomCreator={isRoomCreator}
            onStorySelect={handleTicketSelect}
          />

          <div className="space-y-6">
            {displayTicket ? (
              <>
                <TicketDetails
                  story={displayTicket}
                  isCurrentStory={displayTicket.id === currentTicket?.id}
                  isStoryCreator={isDisplayTicketCreator}
                  roomId={roomId}
                  onDelete={() => setShowDeleteTicketConfirm(true)}
                />

                {shouldShowVoteResults && (
                  <VoteResults votes={displayVotes} isRevealed={true} />
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a ticket</CardTitle>
                  <CardDescription>
                    Please select a ticket to view details.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {currentTicket &&
              currentTicket.id === selectedTicket?.id &&
              currentTicket.status === "active" && (
                <TicketWorkflowControl
                  story={currentTicket}
                  isCreator={isTicketCreator}
                />
              )}

            <TicketParticipantList
              roomId={roomId}
              storyId={selectedTicket?.id || ""}
              currentStep={selectedTicket?.currentStep || "overview"}
              votes={selectedTicketVotes}
              roomCreatorId={room?.createdBy}
            />
          </div>
        </div>

        <ConfirmDialog
          open={showDeleteTicketConfirm}
          onOpenChange={setShowDeleteTicketConfirm}
          title="Delete Ticket"
          description={`Are you sure you want to delete "${displayTicket?.name}"? This action cannot be undone.`}
          confirmText="Delete Ticket"
          cancelText="Cancel"
          onConfirm={handleDeleteTicket}
          variant="destructive"
        />
      </div>
    </div>
  );
}
