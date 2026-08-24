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
