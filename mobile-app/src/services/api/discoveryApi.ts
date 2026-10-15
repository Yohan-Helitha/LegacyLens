import { apiGet } from './client';

export interface DiscoveryStoryItem {
  id: string;
  title: string;
  description?: string;
  bodyContent?: string;
  imageUrl?: string;
  type?: 'video' | 'blog' | 'audio';
  authorName?: string;
  district?: string;
  region?: string;
  tags?: string[];
  publishedAt?: string;
  viewCount?: number;
  likesCount?: number;
  commentsCount?: number;
  score?: number;
  matchReason?: string;
  duration?: string;
  topic?: string;
  mediaUrl?: string;
  audioBars?: number[];
}

export interface SearchDiscoveryParams {
  query?: string;
  category?: string;
  type?: string;
  includeRelated?: boolean;
  page?: number;
  size?: number;
}

export const discoveryApi = {
  /**
   * Tag-aware cultural search & filtering
   * GET /api/v1/discovery/search?q=...&category=...&includeRelated=true
   */
  searchStories: async (params: SearchDiscoveryParams = {}): Promise<DiscoveryStoryItem[]> => {
    const searchParams = new URLSearchParams();
    if (params.query && params.query.trim()) {
      searchParams.set('q', params.query.trim());
    }
    if (params.category && params.category.trim()) {
      searchParams.set('category', params.category.trim());
    }
    if (params.type && params.type.trim() && params.type !== 'all' && params.type !== 'Explore all') {
      // Normalize 'Videos' -> 'video', 'Blogs' -> 'blog', 'Audio' -> 'audio'
      let normalizedType = params.type.toLowerCase().trim();
      if (normalizedType.endsWith('s')) {
        normalizedType = normalizedType.slice(0, -1);
      }
      searchParams.set('type', normalizedType);
    }
    if (params.includeRelated !== undefined) {
      searchParams.set('includeRelated', String(params.includeRelated));
    }
    searchParams.set('page', String(params.page ?? 0));
    searchParams.set('size', String(params.size ?? 20));

    const response = await apiGet<any>(`/v1/discovery/search?${searchParams.toString()}`);
    if (response && response.content) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },

  /**
   * Hybrid related content recommendations for story detail pages
   * GET /api/v1/discovery/stories/{storyId}/related?limit=4
   */
  getRelatedStories: async (storyId: string, limit: number = 4): Promise<DiscoveryStoryItem[]> => {
    const response = await apiGet<DiscoveryStoryItem[]>(`/v1/discovery/stories/${storyId}/related?limit=${limit}`);
    return Array.isArray(response) ? response : [];
  },

  /**
   * Personalized Home recommendations based on user view history
   * GET /api/v1/discovery/recommendations/home?limit=10&type=audio
   */
  getHomeRecommendations: async (limit: number = 10, type?: string): Promise<DiscoveryStoryItem[]> => {
    let url = `/v1/discovery/recommendations/home?limit=${limit}`;
    if (type && type.trim() && type !== 'all' && type !== 'Explore all') {
      let normalizedType = type.toLowerCase().trim();
      if (normalizedType.endsWith('s')) {
        normalizedType = normalizedType.slice(0, -1);
      }
      url += `&type=${encodeURIComponent(normalizedType)}`;
    }
    const response = await apiGet<DiscoveryStoryItem[]>(url);
    return Array.isArray(response) ? response : [];
  },
};

import { getMediaUrl } from '../../constants/api';

function resolveMediaUri(url?: string): string | undefined {
  if (!url || typeof url !== 'string' || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const cleaned = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const path = cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned}`;
  return getMediaUrl(path);
}

/**
 * Normalizes a DiscoveryStoryItem into the unified FeedItemResponse format
 * used across the mobile app cards (VideoCard, BlogCard, AudioCard).
 */
export function mapDiscoveryToFeedItem(item: DiscoveryStoryItem): any {
  const baseType = (item.type || 'blog').toLowerCase();
  const baseMethod = ((item as any).method || '').toLowerCase();
  const id = String(item.id);
  const title = item.title || 'Untitled Cultural Heritage';
  const author = item.authorName || 'Elder Storyteller';
  const location = item.district ? `${item.district}, ${item.region || 'Sri Lanka'}` : (item.region || 'Sri Lanka');
  const tags = item.tags && item.tags.length > 0 ? item.tags : ['heritage'];
  const rawThumbnail = item.imageUrl || (item as any).thumbnail;
  const thumbnail = resolveMediaUri(rawThumbnail) || undefined;

  if (baseType === 'video') {
    const rawVideo = (item as any).videoUrl || item.mediaUrl;
    return {
      id,
      title,
      author,
      location,
      videoUrl: resolveMediaUri(rawVideo) || '',
      duration: item.duration || '4:20',
      tags,
      type: 'video',
      likesCount: item.likesCount ?? 0,
      commentsCount: item.commentsCount ?? 0,
      liked: Boolean((item as any).liked),
      description: item.description ?? '',
      excerpt: item.description ?? '',
      ...(item as any),
    };
  } else if (baseType === 'audio' && baseMethod !== 'written') {
    const rawAudio = item.mediaUrl || (item as any).audioUrl;
    return {
      id,
      name: author,
      title,
      author,
      location,
      duration: item.duration || '5:10',
      topic: item.topic || title,
      tags,
      avatar: thumbnail,
      thumbnail,
      mediaUrl: resolveMediaUri(rawAudio) || item.mediaUrl,
      bars: (item.audioBars && item.audioBars.length > 0) ? item.audioBars : [30, 45, 60, 80, 55, 40, 70, 90, 65, 45, 30],
      type: 'audio',
      likesCount: item.likesCount ?? 0,
      commentsCount: item.commentsCount ?? 0,
      liked: Boolean((item as any).liked),
      description: item.description ?? '',
      excerpt: item.description ?? '',
      ...(item as any),
    };
  } else {
    return {
      id,
      title,
      author,
      location,
      excerpt: item.description || item.bodyContent?.slice(0, 140) || 'Heritage story preserved in LegacyLens',
      thumbnail,
      readTime: '3 min read',
      tags,
      type: 'blog',
      likesCount: item.likesCount ?? 0,
      commentsCount: item.commentsCount ?? 0,
      liked: Boolean((item as any).liked),
      description: item.description ?? '',
      content: item.bodyContent ?? '',
      ...(item as any),
    };
  }
}

