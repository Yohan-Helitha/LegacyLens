import { apiGet, apiPost } from './client';
import { getMediaUrl } from '../../constants/api';

export interface ChoiceResponse {
  id: string;
  label: string;
  icon?: string;
  image?: string;
  isCorrect: boolean;
}

export interface QuestionResponse {
  riddle: string;
  image?: string;
  choices: ChoiceResponse[];
}

export interface QuestResponse {
  id: number;
  title: string;
  description: string;
}

export interface BadgeResponse {
  id: string;
  title: string;
  image: string;
}

export interface MapLandmarkResponse {
  id: string;
  name: string;
  description: string;
  lng: number;
  lat: number;
  icon: string;
  image: string;
  modelUrl: string;
  region: string;
  badge?: BadgeResponse;
  quests: QuestResponse[];
}

export interface RegionResponse {
  id: number;
  code: string;
  label: string;
  regionName: string;
  description: string;
  districts: string[];
  districtsString: string;
  longitude: number;
  latitude: number;
  zoom: number;
}

export const mapApi = {
  getLandmarks: async () => {
    const landmarks = await apiGet<MapLandmarkResponse[]>('/map/landmarks');
    return landmarks.map(l => ({
      ...l,
      modelUrl: l.modelUrl ? resolveModelUrl(l.modelUrl) : l.modelUrl,
    }));
  },

  getRegions: () => apiGet<RegionResponse[]>('/map/regions'),
  getQuestQuestions: (questId: number) => apiGet<QuestionResponse[]>(`/map/quests/${questId}/questions`),
  getMyBadges: () => apiGet<string[]>('/map/my-badges'),
  earnBadge: (badgeCode: string) => apiPost<string>(`/map/my-badges/${badgeCode}`, {}),
  getAllBadges: () => apiGet<BadgeResponse[]>('/map/badges'),
};

function resolveModelUrl(url: string): string {
  if (!url) return url;
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // Paths with /uploads/ prefix
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return getMediaUrl(url);
  }
  // Bare models/ paths (e.g., "models/xxx.glb" stored in DB without /uploads/ prefix)
  if (url.startsWith('models/')) {
    return getMediaUrl('/uploads/' + url);
  }
  // Fallback
  return getMediaUrl(url);
}
