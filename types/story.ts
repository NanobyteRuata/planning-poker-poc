export type StoryStep = 'overview' | 'voting' | 'reveal' | 'complete';

export interface Story {
  id: string;
  ticketId: string;
  name: string;
  description: string;
  status: 'active' | 'completed';
  storyPoint: number | null;
  roomId: string;
  createdBy: string;
  createdAt: Date;
  votesRevealed: boolean;
  totalVotes?: number;
  currentStep: StoryStep;
  order: number;
  jiraCloudId?: string;
}

export interface Vote {
  id: string;
  point: number | string;
  voterId: string;
  voterName: string;
  storyId: string;
  createdAt: Date;
}
