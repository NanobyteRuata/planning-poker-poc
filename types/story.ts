export type TicketStep = 'overview' | 'voting' | 'reveal' | 'complete';

export interface Ticket {
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
  currentStep: TicketStep;
  order: number;
  jiraCloudId?: string;
}

export interface Vote {
  id: string;
  point: number | string;
  voterId: string;
  voterName: string;
  ticketId: string;
  createdAt: Date;
}
