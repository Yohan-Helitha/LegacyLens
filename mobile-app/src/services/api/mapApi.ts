import { apiGet, apiPost } from './client';

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
  getLandmarks: () => apiGet<MapLandmarkResponse[]>('/map/landmarks'),
  getRegions: () => apiGet<RegionResponse[]>('/map/regions'),
  getQuestQuestions: (questId: number) => apiGet<QuestionResponse[]>(`/map/quests/${questId}/questions`),
  getMyBadges: () => apiGet<string[]>('/map/my-badges'),
  earnBadge: (badgeCode: string) => apiPost<string>(`/map/my-badges/${badgeCode}`, {}),
  getAllBadges: () => apiGet<BadgeResponse[]>('/map/badges'),
};
