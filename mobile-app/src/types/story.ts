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
  /** Cover image (complete URL), set by the storyteller or an admin. */
  imageUrl?: string | null;
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
  thumbnail?: StoryMediaFile | null;
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
  /** Cover image (complete URL), set by the storyteller or an admin. */
  imageUrl?: string | null;
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

/** Mirrors AnalyticsSummaryDto — GET /api/stories/mine/analytics/summary (the dashboard analytics card). */
export interface AnalyticsSummary {
  publishedStories: number;
  totalViews: number;
  viewsLast7Days: number;
  viewsPrevious7Days: number;
  /** Signed percent change of the last 7 days vs the 7 before. */
  trendPercent: number;
  /** True when the last 7 days beat the previous 7 — green up arrow; otherwise orange down arrow. */
  trending: boolean;
  totalLikes: number;
  totalComments: number;
  topStoryTitle: string | null;
}

export interface DailyViews {
  /** ISO date (yyyy-MM-dd). */
  date: string;
  views: number;
}

/** A listener's comment on the story, shown to its author as a review. */
export interface StoryReview {
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  text: string;
  createdAt: string;
}

/** Mirrors StoryAnalyticsDto — GET /api/stories/{id}/analytics (one of the elder's own stories). */
export interface StoryAnalytics {
  storyId: string;
  title: string;
  status: StoryStatus;
  publishedAt: string | null;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  viewsLast7Days: number;
  viewsPrevious7Days: number;
  trendPercent: number;
  trending: boolean;
  /** Oldest first, always 7 entries ending today. */
  dailyViews: DailyViews[];
  reviews: StoryReview[];
  /** The elder's overall rating from creators — not specific to this story. Null when unrated. */
  averageRating: number | null;
  ratingCount: number;
}
