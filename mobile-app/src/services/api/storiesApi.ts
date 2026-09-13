import { apiDelete, apiGet, apiPatch, apiPostForm } from './client';
import { CreateStoryPayload, StoryResponse, UpdateStoryPayload } from '../../types/story';

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
  return formData;
}

/** Typed wrappers around /api/stories/** — the content-capture backend. */
export const storiesApi = {
  create: (payload: CreateStoryPayload) =>
    apiPostForm<StoryResponse>('/stories', toFormData(payload)),

  listMine: () => apiGet<StoryResponse[]>('/stories/me'),

  getById: (storyId: string) => apiGet<StoryResponse>(`/stories/${storyId}`),

  update: (storyId: string, payload: UpdateStoryPayload) =>
    apiPatch<StoryResponse>(`/stories/${storyId}`, payload),

  remove: (storyId: string) => apiDelete<void>(`/stories/${storyId}`),
};
