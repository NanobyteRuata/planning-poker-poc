export type SessionStatus = 'idle' | 'active';

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: Date;
  sessionStatus: SessionStatus;
  currentStoryId: string | null;
}