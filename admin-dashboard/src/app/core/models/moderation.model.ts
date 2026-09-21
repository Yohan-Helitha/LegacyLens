export interface ModerationQueueItemResponse {
  id: string;
  title: string;
  description: string;
  bodyContent?: string;
  imageUrl?: string;
  type: string;
  authorName?: string;
  authorUserId?: string;
  elder: boolean;
  tags?: string[];
  region?: string;
  district?: string;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  rejectionReason?: string;
  rejectionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateModerationStatusRequest {
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  region?: string;
  district?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  reason?: string;
  notes?: string;
}

export interface RegionDTO {
  id: number;
  code: string;
  label: string;
  regionName: string;
  description: string;
  districts: string[];
  districtsString: string;
  longitude?: number;
  latitude?: number;
  zoom?: number;
}

export interface StoryQuizOptionDTO {
  id?: string;
  optionKey: string;
  optionText: string;
  description?: string;
  isCorrect: boolean;
}

export interface StoryQuizDTO {
  id?: string;
  storyId?: string;
  question: string;
  explanation?: string;
  options: StoryQuizOptionDTO[];
}

export interface AiGenerateQuizRequest {
  title?: string;
  description?: string;
  bodyContent?: string;
  tags?: string[];
}

