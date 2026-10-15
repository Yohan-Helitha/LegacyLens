import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface WordOfTheDayResponse {
  id: number;
  word: string;
  transliteration: string;
  definition: string;
  culturalNote?: string;
  activeDate: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  exampleContent?: string;
}

export interface FeedItemResponse {
  id: string;
  type: 'video' | 'blog' | 'audio';
  title: string;
  name?: string;
  author: string;
  location: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  thumbnail?: string;
  videoUrl?: string;
  duration?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  category?: string;
  readTime?: string;
  topic?: string;
  avatar?: string;
  bars?: number[];
  mediaUrl?: string;
}

export interface FeaturedKeeperResponse {
  id: number;
  name: string;
  title: string;
  tag: string;
  quote: string;
  avatarUrl: string;
  likesCount: number;
}

export interface CommentResponse {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const homeApi = {
  getWordOfToday: () => apiGet<WordOfTheDayResponse>('/home/word-of-the-day/today'),
  getCategories: () => apiGet<CategoryResponse[]>('/home/categories'),
  createCategory: (name: string, description?: string, exampleContent?: string) =>
    apiPost<CategoryResponse>('/home/categories', { name, description, exampleContent }),
  getFeedItems: () => apiGet<FeedItemResponse[]>('/home/feed'),
  getFeaturedKeeper: () => apiGet<FeaturedKeeperResponse>('/home/featured-keeper'),
  getComments: (feedItemId: string) => apiGet<CommentResponse[]>(`/home/feed/${feedItemId}/comments`),
  addComment: (feedItemId: string, text: string, author?: string, avatar?: string, userId?: string) =>
    apiPost<CommentResponse>(`/home/feed/${feedItemId}/comments`, { text, author, avatar, userId }),
  updateComment: (commentId: string, text: string, feedItemId?: string) =>
    apiPut<CommentResponse>(feedItemId ? `/home/feed/${feedItemId}/comments/${commentId}` : `/home/feed/comments/${commentId}`, { text }),
  deleteComment: (commentId: string, feedItemId?: string) =>
    apiDelete<void>(feedItemId ? `/home/feed/${feedItemId}/comments/${commentId}` : `/home/feed/comments/${commentId}`),
  likePost: (feedItemId: string) => apiPost<number>(`/home/feed/${feedItemId}/like`, {}),
  unlikePost: (feedItemId: string) => apiPost<number>(`/home/feed/${feedItemId}/unlike`, {}),
  getLikesCount: (feedItemId: string) => apiGet<number>(`/home/feed/${feedItemId}/likes`),
  getStoryQuiz: (storyId: string) => apiGet<any>(`/home/feed/${storyId}/quiz`),
};

