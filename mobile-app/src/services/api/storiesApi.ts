import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm } from './client';
import {
  AnalyticsSummary,
  CreateStoryPayload,
  PagedResponse,
  StoryAnalytics,
  StoryResponse,
  StorySummary,
  UpdateStoryPayload,
} from '../../types/story';

export interface SearchMineParams {
  /** Free-text title search — matched case-insensitively by the backend. */
  search?: string;
  page?: number;
  size?: number;
}

function toFormData(payload: CreateStoryPayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  if (payload.description) {
    formData.append('description', payload.description);
  }
  formData.append('method', payload.method);
  if (payload.mediaDurationMillis != null) {
    formData.append('mediaDurationMillis', String(payload.mediaDurationMillis));
  }
  if (payload.media) {
    // React Native's FormData accepts this {uri, name, type} shape directly —
    // it isn't a real web File/Blob, so the DOM FormData typings don't cover it.
    formData.append('media', payload.media as unknown as Blob);
  }
  if (payload.thumbnail) {
    formData.append('thumbnail', payload.thumbnail as unknown as Blob);
  }
  return formData;
}

/** Typed wrappers around /api/stories/** — the content-capture backend. */
export const storiesApi = {
  create: (payload: CreateStoryPayload) =>
    apiPostForm<StoryResponse>('/stories', toFormData(payload)),

  listMine: () => apiGet<StoryResponse[]>('/stories/me'),

  /** Search/paginated variant backing Screen 6 (My Stories) — GET /api/stories/mine. */
  searchMine: ({ search, page = 0, size = 50 }: SearchMineParams = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    return apiGet<PagedResponse<StorySummary>>(`/stories/mine?${params.toString()}`);
  },

  getById: (storyId: string) => apiGet<StoryResponse>(`/stories/${storyId}`),

  update: (storyId: string, payload: UpdateStoryPayload) =>
    apiPatch<StoryResponse>(`/stories/${storyId}`, payload),

  remove: (storyId: string) => apiDelete<void>(`/stories/${storyId}`),

  /** Sets the cover image of one of the caller's own unpublished stories (an image of at most 5 MB). */
  uploadThumbnail: (storyId: string, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    // React Native's FormData takes this {uri, name, type} shape directly; the DOM typings don't cover it.
    formData.append('thumbnail', file as unknown as Blob);
    return apiPostForm<StoryResponse>(`/stories/${storyId}/thumbnail`, formData);
  },

  /** Dashboard analytics card — totals and the 7-day view trend across the caller's published stories. */
  getAnalyticsSummary: () => apiGet<AnalyticsSummary>('/stories/mine/analytics/summary'),

  /** Views, likes, comments (as reviews) and the 7-day chart for one of the caller's own stories. */
  getAnalytics: (storyId: string) => apiGet<StoryAnalytics>(`/stories/${storyId}/analytics`),

  /**
   * Counts one view of a story by the signed-in listener. The backend debounces it (once per viewer per
   * 24h) and ignores the author's own views, so calling it on every open is safe.
   */
  recordView: (storyId: string) => apiPost<void>(`/stories/${storyId}/view`, {}),
};
