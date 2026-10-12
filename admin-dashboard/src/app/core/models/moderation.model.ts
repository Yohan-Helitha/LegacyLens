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
  status?: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  region?: string;
  district?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  reason?: string;
  notes?: string;
  tags?: string[];
}

export interface TagAliasDTO {
  id: string;
  tagId: string;
  alias: string;
  normalizedAlias: string;
  languageCode?: string;
  aliasType?: string;
  createdAt?: string;
}

export interface TagRelationshipDTO {
  id: string;
  sourceTagId: string;
  sourceTagName: string;
  targetTagId: string;
  targetTagName: string;
  relationshipType: string;
  weight: number;
  createdAt?: string;
}

export interface TagDTO {
  id: string;
  canonicalName: string;
  normalizedName: string;
  description?: string;
  languageCode?: string;
  category?: string;
  isApproved: boolean;
  storyCount?: number;
  aliases?: TagAliasDTO[];
  relationships?: TagRelationshipDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTagRequest {
  canonicalName: string;
  description?: string;
  languageCode?: string;
  category?: string;
  isApproved?: boolean;
}

export interface AddAliasRequest {
  alias: string;
  languageCode?: string;
  aliasType?: string;
}

export interface AddRelationshipRequest {
  targetTagId: string;
  relationshipType: string;
  weight?: number;
}

export interface MergeTagsRequest {
  sourceTagId: string;
  targetTagId: string;
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

export interface AiTagsResponse {
  tags: string[];
}
