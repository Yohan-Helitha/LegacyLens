import { apiGet, apiPost } from './client';

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
  thumbnail?: string;
  videoUrl?: string;
  duration?: string;
  excerpt?: string;
  readTime?: string;
  topic?: string;
  avatar?: string;
  bars?: number[];
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

export const homeApi = {
  getWordOfToday: () => apiGet<WordOfTheDayResponse>('/home/word-of-the-day/today'),
  getCategories: () => apiGet<CategoryResponse[]>('/home/categories'),
  createCategory: (name: string, description?: string, exampleContent?: string) =>
    apiPost<CategoryResponse>('/home/categories', { name, description, exampleContent }),
  getFeedItems: () => apiGet<FeedItemResponse[]>('/home/feed'),
  getFeaturedKeeper: () => apiGet<FeaturedKeeperResponse>('/home/featured-keeper'),
  getComments: (feedItemId: string) => apiGet<any[]>(`/home/feed/${feedItemId}/comments`),
  addComment: (feedItemId: string, text: string) => apiPost<any>(`/home/feed/${feedItemId}/comments`, { text }),
  likePost: (feedItemId: string) => apiPost<void>(`/home/feed/${feedItemId}/like`, {}),
};

