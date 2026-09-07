import { apiGet, apiPatch, apiDelete } from './client';

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

export const moderationApi = {
  getQueueItems: (status: string = 'ALL') =>
    apiGet<ModerationQueueItemResponse[]>(`/admin/moderation/queue?status=${status}`),
    
  getQueueItem: (id: string) =>
    apiGet<ModerationQueueItemResponse>(`/admin/moderation/queue/${id}`),
    
  updateItemStatus: (id: string, request: UpdateModerationStatusRequest) =>
    apiPatch<ModerationQueueItemResponse, UpdateModerationStatusRequest>(`/admin/moderation/queue/${id}/status`, request),

  deleteItem: (id: string) =>
    apiDelete<void>(`/admin/moderation/queue/${id}`)
};
