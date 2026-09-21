export interface RegionDTO {
  id: number;
  code: string;
  label: string;
  regionName: string;
  description?: string;
  districts: string[];
  districtsString?: string;
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface BadgeDTO {
  id?: string;
  title: string;
  image: string;
  landmarkId?: number;
  landmarkCode?: string;
}

export interface ChoiceDTO {
  id?: string;
  label: string;
  icon?: string;
  image?: string;
  isCorrect: boolean;
}

export interface QuestionDTO {
  id?: string;
  riddle: string;
  image?: string;
  choices: ChoiceDTO[];
}

export interface QuestDTO {
  id?: number;
  title: string;
  description: string;
  landmarkId?: number;
  landmarkCode?: string;
  questions?: QuestionDTO[];
}

export interface LandmarkDTO {
  dbId?: number;
  id: string; // maps to code
  name: string;
  type?: string;
  description: string;
  lng: number;
  lat: number;
  icon?: string;
  image?: string;
  modelUrl?: string;
  region: string;
  district?: string;
  badge?: BadgeDTO;
  quests?: QuestDTO[];
  attachedStoryIds?: string[];
}

export interface CreateLandmarkRequest {
  name: string;
  code?: string;
  type?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  icon?: string;
  image?: string;
  modelUrl?: string;
  region: string;
  district?: string;
  attachedStoryIds?: string[];
}

export interface SaveBadgeRequest {
  landmarkId?: number;
  landmarkCode?: string;
  badgeCode: string;
  title: string;
  image: string;
}

export interface SaveQuestRequest {
  id?: number;
  landmarkId?: number;
  landmarkCode?: string;
  title: string;
  description: string;
  questions: {
    riddle: string;
    image?: string;
    choices: ChoiceDTO[];
  }[];
}
