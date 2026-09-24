/**
 * Mirrors lk.ac.sliit.legacylens.stories.* — the content-capture backend
 * (POST/GET/DELETE /api/stories/**).
 */

/**
 * Mirrors the backend's unified StoryStatus enum (stories/entity/StoryStatus.java) —
 * the single status vocabulary shared with the admin moderation side
 * (ModerationQueueItem maps the same column). No separate "approved" state:
 * the admin's "Approve & Publish Live" action moves PENDING straight to
 * PUBLISHED. DRAFT is elder-only — a draft is never submitted to admin, so
 * it never becomes visible on the moderation side.
 */
export type StoryStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
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

/** Mirrors StorySummaryDto — the row shape GET /api/stories/mine returns (Screen 6, My Stories). */
export interface StorySummary {
  id: string;
  title: string;
  status: StoryStatus;
  mediaType: StoryMediaType | null;
  /** Root-relative — prefix with the API host to get a playable URL. */
  mediaUrl: string | null;
  viewCount: number;
  createdAt: string;
}

/** Mirrors common.dto.PagedResponse — the wrapper every paginated endpoint returns. */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
