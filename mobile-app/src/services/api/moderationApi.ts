import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface ModerationQueueItemResponse {
  id: string;
  title: string;
  description: string;
  bodyContent?: string;
  imageUrl: string;
  type: string;
  authorName: string;
  authorUserId: string;
  elder: boolean;
  tags: string[];
  status: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateModerationStatusRequest {
  status: string;
  reason?: string;
  notes?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
}

export interface StoryQuizOptionResponse {
  id?: string;
  optionKey: string; // "A", "B", "C", "D"
  optionText: string;
  description?: string;
  isCorrect: boolean;
}

export interface StoryQuizResponse {
  id?: string;
  storyId?: string;
  question: string;
  explanation?: string;
  options: StoryQuizOptionResponse[];
}

export const moderationApi = {
  getQueueItems: (status: string = 'ALL') =>
    apiGet<ModerationQueueItemResponse[]>(`/admin/moderation/queue?status=${status}`),
    
  getQueueItem: (id: string) =>
    apiGet<ModerationQueueItemResponse>(`/admin/moderation/queue/${id}`),
    
  updateItemStatus: (id: string, request: UpdateModerationStatusRequest) =>
    apiPatch<ModerationQueueItemResponse, UpdateModerationStatusRequest>(`/admin/moderation/queue/${id}/status`, request),

  deleteItem: (id: string) =>
    apiDelete<void>(`/admin/moderation/queue/${id}`),

  getStoryQuiz: (storyId: string) =>
    apiGet<StoryQuizResponse>(`/moderation/stories/${storyId}/quiz`),

  saveStoryQuiz: (storyId: string, quiz: StoryQuizResponse) =>
    apiPost<StoryQuizResponse, StoryQuizResponse>(`/moderation/stories/${storyId}/quiz`, quiz),

  generateAiQuiz: (storyId: string, context?: { title?: string; description?: string; bodyContent?: string; tags?: string[] }) =>
    apiPost<StoryQuizResponse, any>(`/moderation/stories/${storyId}/quiz/ai-generate`, context || {})
};
