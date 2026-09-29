export interface AdminOpportunityResponse {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string;
  location: string;
  category: string;
  locationType?: string;
  matchPercentage?: number;
  urgent?: boolean;
  dueAt?: string | null;
  scheduledDate?: string | null;
  durationText?: string | null;
  timeWindowText?: string | null;
  language?: string | null;
  offeredAmount?: number;
  preservationGoal?: string;
  tasks?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
  elderId?: string;
  elderName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpportunityAudioResponse {
  id: string;
  elderName: string;
  elderAvatarUrl?: string;
  verified?: boolean;
  location?: string;
  recordedAt?: string;
  duration?: string;
  audioUrl?: string;
  topic?: string;
  tags?: string;
  status?: string;
  createdAt?: string;
}

export interface CreateOpportunityRequest {
  title?: string;
  description?: string;
  heroImageUrl?: string;
  location?: string;
  category?: string;
  locationType?: string;
  matchPercentage?: number;
  urgent?: boolean;
  dueAt?: string | null;
  scheduledDate?: string | null;
  durationText?: string | null;
  timeWindowText?: string | null;
  language?: string | null;
  offeredAmount?: number;
  preservationGoal?: string;
  tasks?: string;
  status?: string;
  elderId?: string;
  elderName?: string;
}

export interface UpdateOpportunityStatusRequest {
  status: string;
}
