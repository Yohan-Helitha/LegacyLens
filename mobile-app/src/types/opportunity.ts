export interface OpportunityCardResponse {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string | null;
  location: string | null;
  category: string | null;
  locationType: string | null;
  matchPercentage: number | null;
  urgent: boolean;
  dueAt: string | null;
  elderName: string;
  elderAvatarUrl: string | null;
  elderLocation: string | null;
  createdAt: string;
}

export interface OpportunityDetailResponse {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string | null;
  elderName: string;
  elderAvatarUrl: string | null;
  elderVerified: boolean;
  location: string | null;
  scheduledDate: string | null;
  durationText: string | null;
  offeredAmount: number;
  timeWindowText: string | null;
  language: string | null;
  preservationGoal: string | null;
  tasks: string[];
}

export interface AdminOpportunityResponse {
  id: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  location: string | null;
  category: string | null;
  locationType: string | null;
  matchPercentage: number | null;
  urgent: boolean;
  dueAt: string | null;
  scheduledDate: string | null;
  durationText: string | null;
  timeWindowText: string | null;
  language: string | null;
  offeredAmount: number;
  preservationGoal: string | null;
  tasks: string | null;
  status: string;
  elderId: string | null;
  elderName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityAudioResponse {
  id: string;
  elderName: string;
  elderAvatarUrl: string | null;
  verified: boolean;
  location: string | null;
  recordedAt: string;
  duration: string | null;
  audioUrl: string;
  topic: string | null;
  tags: string | null;
  status: string;
  createdAt: string;
}

export interface CreateOpportunityRequest {
  title: string;
  description?: string;
  heroImageUrl?: string;
  location?: string;
  category?: string;
  locationType?: string;
  matchPercentage?: number;
  urgent?: boolean;
  dueAt?: string;
  scheduledDate?: string;
  durationText?: string;
  timeWindowText?: string;
  language?: string;
  offeredAmount: number;
  preservationGoal?: string;
  tasks?: string;
  status: string;
  elderId?: string;
  elderName?: string;
}

export interface OpportunityDraft {
  id: string;
  lastEditedAt: string;
  opportunityTitle: string;
  coverImage: string | null;
  selectedCategory: string | null;
  selectedKnowledgeHolder: string | null;
  mapRegion: any;
  locationText: string;
  scheduleDate: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleDuration: string;
  isFlexibleSchedule: boolean;
  selectedSkills: string[];
  tasks: string[];
  selectedDeliverables: string[];
  preservationDescription: string;
}
