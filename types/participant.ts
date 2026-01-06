export interface Participant {
  id: string;
  name: string;
  roomId: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen: Date;
  currentStoryId?: string;
}
