/**
 * Mirrors lk.ac.sliit.legacylens.stories.* — the content-capture backend
 * (POST/GET/DELETE /api/stories/**).
 */

export type StoryStatus = 'PENDING' | 'PUBLISHED';
export type StoryMethod = 'RECORDED' | 'UPLOADED' | 'WRITTEN';
export type StoryMediaType = 'AUDIO' | 'VIDEO';

export interface StoryResponse {
  id: string;
  title: string;
  description: string | null;
  status: StoryStatus;
  method: StoryMethod;
  mediaType: StoryMediaType | null;
  /** Root-relative — prefix with the API host to get a playable URL. */
  mediaUrl: string | null;
  mediaDurationMillis: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** A local media file about to be uploaded as part of a new story. */
export interface StoryMediaFile {
  uri: string;
  name: string;
  type: string;
}

export interface CreateStoryPayload {
  title: string;
  description?: string;
  method: StoryMethod;
  mediaDurationMillis?: number;
  media?: StoryMediaFile | null;
}

/** Title/description only — there's no re-upload endpoint, media isn't editable. */
export interface UpdateStoryPayload {
  title: string;
  description?: string;
}
