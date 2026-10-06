/** How well an opportunity fits the signed-in creator - NOT_RECOMMENDED is below 30%. */
export type MatchLevel = 'NOT_RECOMMENDED' | 'WEAK' | 'GOOD_POTENTIAL' | 'STRONG' | 'EXCELLENT';

export interface OpportunityCardResponse {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string | null;
  location: string | null;
  category: string | null;
  locationType: string | null;
  /** 0-100 from the creator -> opportunity algorithm; null when the user is not a creator. */
  matchPercentage: number | null;
  matchLevel?: MatchLevel | null;
  /** "Why this matches you", strongest first. */
  matchReasons?: string[] | null;
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
  category?: string | null;
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
  matchPercentage?: number | null;
  matchLevel?: MatchLevel | null;
  matchReasons?: string[] | null;
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
  /** Comma separated "Required Skills" — used to match the right kind of creator to the opportunity. */
  requiredSkills?: string;
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
