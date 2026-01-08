"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOrCreateGuestId, getGuestName } from "@/lib/guestUser";
import type { Room } from "@/types/room";
import type { Story, Vote } from "@/types/story";
import { StoryList } from "@/components/StoryList";
import { StoryFormDialog } from "@/components/StoryFormDialog";
import { StoryWorkflowControl } from "@/components/StoryWorkflowControl";
import { StoryParticipantList } from "@/components/StoryParticipantList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayIcon, StopCircleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
interface RoomPageProps {
  params: Promise<{ "room-id": string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedStoryVotes, setSelectedStoryVotes] = useState<Vote[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [hasActiveStories, setHasActiveStories] = useState(false);

  const currentUserId = getOrCreateGuestId();
  const isRoomCreator = room?.createdBy === currentUserId;
  const isStoryCreator = currentStory?.createdBy === currentUserId;
  const isSessionActive = room?.sessionStatus === "active";

  const displayStory = selectedStory || currentStory;
  const displayVotes = selectedStory ? selectedStoryVotes : votes;
  const isDisplayStoryCreator = displayStory?.createdBy === currentUserId;

  useEffect(() => {
    params.then(async (resolvedParams) => {
      const id = resolvedParams["room-id"];
      setRoomId(id);
      setIsLoading(false);
    });
  }, [params]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(
      doc(db, "rooms", roomId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setRoom({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          } as Room);
        } else {
          setRoomNotFound(true);
        }
      },
      (error) => {
        console.error("Error listening to room:", error);
        setRoomNotFound(true);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const addParticipant = async () => {
      try {
        const participantId = getOrCreateGuestId();
        const participantName = getGuestName() || "Anonymous";

        await setDoc(doc(db, "rooms", roomId, "participants", participantId), {
          id: participantId,
          name: participantName,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error adding participant:", error);
      }
    };

    addParticipant();

    const interval = setInterval(() => {
      const participantId = getOrCreateGuestId();
      updateDoc(doc(db, "rooms", roomId, "participants", participantId), {
        lastSeen: serverTimestamp(),
      }).catch((error) => {
        console.error("Error updating participant presence:", error);
      });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [roomId]);

  useEffect(() => {
    if (!room?.currentStoryId) {
      setCurrentStory(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "stories", room.currentStoryId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCurrentStory({
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          } as Story);
        } else {
          setCurrentStory(null);
        }
      },
      (error) => {
        console.error("Error listening to story:", error);
      }
    );

    return () => unsubscribe();
  }, [room?.currentStoryId]);

  useEffect(() => {
    if (!currentStory?.id) {
      setVotes([]);
      return;
    }

    const votesRef = collection(db, "stories", currentStory.id, "votes");
    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const votesData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Vote)
      );
      setVotes(votesData);
    });

    return () => unsubscribe();
  }, [currentStory?.id]);

  useEffect(() => {
    if (!selectedStory?.id) {
      setSelectedStoryVotes([]);
      return;
    }

    const votesRef = collection(db, "stories", selectedStory.id, "votes");
    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const votesData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Vote)
      );
      setSelectedStoryVotes(votesData);
    });

    return () => unsubscribe();
  }, [selectedStory?.id]);

  useEffect(() => {
    if (isSessionActive && currentStory) {
      setSelectedStory(currentStory);
    }
  }, [isSessionActive, currentStory]);

  useEffect(() => {
    if (!roomId) return;

    const checkActiveStories = async () => {
      try {
        const storiesRef = collection(db, "stories");
        const q = query(
          storiesRef,
          where("roomId", "==", roomId),
          where("status", "==", "active"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        setHasActiveStories(!snapshot.empty);
      } catch (error) {
        console.error("Error checking active stories:", error);
      }
    };

    checkActiveStories();

    const storiesRef = collection(db, "stories");
    const q = query(storiesRef, where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(q, () => {
      checkActiveStories();
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (
      !currentStory ||
      !roomId ||
      !isRoomCreator ||
      currentStory.status !== "completed"
    ) {
      return;
    }

    const advanceToNextStory = async () => {
      try {
        const storiesRef = collection(db, "stories");
        const q = query(
          storiesRef,
          where("roomId", "==", roomId),
          where("status", "==", "active"),
          orderBy("createdAt", "asc"),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const nextStoryId = snapshot.docs[0].id;
          await updateDoc(doc(db, "rooms", roomId), {
            currentStoryId: nextStoryId,
          });
        } else {
          await updateDoc(doc(db, "rooms", roomId), {
            sessionStatus: "idle",
            currentStoryId: null,
          });
        }
      } catch (error) {
        console.error("Error advancing to next story:", error);
      }
    };

    const timer = setTimeout(advanceToNextStory, 2000);
    return () => clearTimeout(timer);
  }, [currentStory, roomId, isRoomCreator]);

  const handleStartSession = async () => {
    if (!roomId) return;
    setIsStarting(true);

    try {
      const storiesRef = collection(db, "stories");
      const q = query(
        storiesRef,
        where("roomId", "==", roomId),
        where("status", "==", "active"),
        orderBy("createdAt", "asc"),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firstStoryId = snapshot.docs[0].id;
        await updateDoc(doc(db, "rooms", roomId), {
          sessionStatus: "active",
          currentStoryId: firstStoryId,
        });
      } else {
        alert(
          "No active stories to start session. Please create stories first."
        );
      }
    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!roomId || !confirm("Are you sure you want to end the session?"))
      return;
    setIsEnding(true);

    try {
      await updateDoc(doc(db, "rooms", roomId), {
        sessionStatus: "idle",
        currentStoryId: null,
      });
    } catch (error) {
      console.error("Error ending session:", error);
    } finally {
      setIsEnding(false);
    }
  };

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
  };

  const handleDeleteStory = async () => {
    if (
      !displayStory ||
      !confirm("Are you sure you want to delete this story?")
    )
      return;

    try {
      if (isSessionActive && room?.currentStoryId === displayStory.id) {
        const storiesRef = collection(db, "stories");
        const q = query(
          storiesRef,
          where("roomId", "==", roomId),
          where("status", "==", "active"),
          orderBy("createdAt", "asc"),
          limit(2)
        );

        const snapshot = await getDocs(q);
        const otherStories = snapshot.docs.filter(
          (doc) => doc.id !== displayStory.id
        );

        if (otherStories.length > 0) {
          await updateDoc(doc(db, "rooms", roomId), {
            currentStoryId: otherStories[0].id,
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
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  const handleResetStory = async () => {
    if (
      !displayStory ||
      !confirm(
        "Are you sure you want to reset this story? This will delete all votes and reset the workflow."
      )
    )
      return;

    try {
      const votesRef = collection(db, "stories", displayStory.id, "votes");
      const votesSnapshot = await getDocs(votesRef);

      const batch = writeBatch(db);
      votesSnapshot.docs.forEach((voteDoc) => {
        batch.delete(voteDoc.ref);
      });
      await batch.commit();

      await updateDoc(doc(db, "stories", displayStory.id), {
        currentStep: "overview",
        storyPoint: null,
        status: "active",
      });
    } catch (error) {
      console.error("Error resetting story:", error);
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            {isSessionActive && (
              <Badge variant="default" className="text-sm">
                Session Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRoomCreator && !isSessionActive && (
              <>
                <StoryFormDialog
                  roomId={room.id}
                  trigger={<Button variant="outline">Add Story</Button>}
                />
                {hasActiveStories && (
                  <Button onClick={handleStartSession} disabled={isStarting}>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    {isStarting ? "Starting..." : "Start Session"}
                  </Button>
                )}
              </>
            )}
            {isRoomCreator && isSessionActive && (
              <Button
                variant="destructive"
                onClick={handleEndSession}
                disabled={isEnding}
              >
                <StopCircleIcon className="w-4 h-4 mr-2" />
                {isEnding ? "Ending..." : "End Session"}
              </Button>
            )}
          </div>
        </div>

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
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {displayStory.ticketId}
                          </Badge>
                          {displayStory.storyPoint !== null && (
                            <Badge variant="default">
                              {displayStory.storyPoint} points
                            </Badge>
                          )}
                          <Badge
                            variant={
                              displayStory.status === "active"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {displayStory.status}
                          </Badge>
                          {displayStory.id === currentStory?.id && (
                            <Badge variant="default">Current Story</Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl">
                          {displayStory.name}
                        </CardTitle>
                        {displayStory.description && (
                          <CardDescription className="mt-3 text-base whitespace-pre-wrap">
                            {displayStory.description}
                          </CardDescription>
                        )}
                      </div>
                      {isDisplayStoryCreator && (
                        <div className="flex gap-2">
                          <StoryFormDialog
                            roomId={roomId}
                            story={displayStory}
                            trigger={
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            }
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteStory}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {((displayStory.status === "active" &&
                  displayStory.currentStep === "reveal") ||
                  displayStory.status === "completed") &&
                  displayVotes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Vote Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {(() => {
                            const voteCounts = displayVotes.reduce(
                              (acc, vote) => {
                                const point = vote.point.toString();
                                if (!acc[point]) {
                                  acc[point] = {
                                    point: vote.point,
                                    count: 0,
                                    voters: [],
                                  };
                                }
                                acc[point].count++;
                                acc[point].voters.push(vote.voterName);
                                return acc;
                              },
                              {} as Record<
                                string,
                                {
                                  point: number | string;
                                  count: number;
                                  voters: string[];
                                }
                              >
                            );

                            const sortedVotes = Object.values(voteCounts).sort(
                              (a, b) => {
                                if (a.point === "?") return 1;
                                if (b.point === "?") return -1;
                                const aNum =
                                  typeof a.point === "number"
                                    ? a.point
                                    : parseFloat(a.point);
                                const bNum =
                                  typeof b.point === "number"
                                    ? b.point
                                    : parseFloat(b.point);
                                return bNum - aNum;
                              }
                            );
                            const maxCount = Math.max(
                              ...sortedVotes.map((v) => v.count)
                            );

                            return sortedVotes.map((voteData) => (
                              <div key={voteData.point} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="font-bold"
                                    >
                                      {voteData.point}{" "}
                                      {voteData.point === 1
                                        ? "point"
                                        : "points"}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {voteData.count}{" "}
                                      {voteData.count === 1 ? "vote" : "votes"}
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-4 bg-accent/30 rounded-lg overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-primary/80 rounded-lg transition-all"
                                    style={{
                                      width: `${
                                        (voteData.count / maxCount) * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </CardContent>
                    </Card>
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
      </div>
    </div>
  );
}
