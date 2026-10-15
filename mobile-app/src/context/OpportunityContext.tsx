import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { adminOpportunityApi } from '../services/api/opportunityApi';
import { AdminOpportunityResponse, OpportunityAudioResponse, OpportunityDraft, CreateOpportunityRequest } from '../types/opportunity';

interface OpportunityContextType {
  drafts: OpportunityDraft[];
  allOpportunities: AdminOpportunityResponse[];
  draftOpportunities: AdminOpportunityResponse[];
  publishedOpportunities: AdminOpportunityResponse[];
  closedOpportunities: AdminOpportunityResponse[];
  audioSubmissions: OpportunityAudioResponse[];
  selectedAudio: OpportunityAudioResponse | null;
  setSelectedAudio: (audio: OpportunityAudioResponse | null) => void;
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  saveDraft: (draft: Partial<OpportunityDraft>) => Promise<void>;
  publishDraft: (draftId: string, body: CreateOpportunityRequest) => Promise<void>;
  updateAudioStatus: (id: string, status: string) => Promise<void>;
  getActiveDraft: () => OpportunityDraft | null;
  originTab: string;
  setOriginTab: (tab: string) => void;
  loading: boolean;
  refreshAll: () => Promise<void>;
}

const OpportunityContext = createContext<OpportunityContextType>({} as OpportunityContextType);

let cachedOpportunities: AdminOpportunityResponse[] = [];
let cachedAudioSubmissions: OpportunityAudioResponse[] = [];

// Eager background preload
Promise.all([
  adminOpportunityApi.getAllOpportunities('ALL'),
  adminOpportunityApi.getAudioSubmissions('ALL'),
]).then(([opps, audios]) => {
  if (opps && Array.isArray(opps)) cachedOpportunities = opps;
  if (audios && Array.isArray(audios)) cachedAudioSubmissions = audios;
}).catch(() => {});

export const OpportunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<OpportunityDraft[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<AdminOpportunityResponse[]>(cachedOpportunities);
  const [audioSubmissions, setAudioSubmissions] = useState<OpportunityAudioResponse[]>(cachedAudioSubmissions);
  const [selectedAudio, setSelectedAudio] = useState<OpportunityAudioResponse | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [originTab, setOriginTab] = useState<string>('intake');
  const [loading, setLoading] = useState(cachedOpportunities.length === 0 && cachedAudioSubmissions.length === 0);

  const publishedOpportunities = allOpportunities.filter(o => o.status === 'PUBLISHED');
  const closedOpportunities = allOpportunities.filter(o => o.status === 'CLOSED');
  const draftOpportunities = allOpportunities.filter(o => o.status === 'DRAFT');

  const refreshAll = async () => {
    if (allOpportunities.length === 0 && audioSubmissions.length === 0) {
      setLoading(true);
    }
    try {
      const [opps, audios] = await Promise.all([
        adminOpportunityApi.getAllOpportunities('ALL'),
        adminOpportunityApi.getAudioSubmissions('ALL'),
      ]);
      if (opps) {
        cachedOpportunities = opps;
        setAllOpportunities(opps);
      }
      if (audios) {
        cachedAudioSubmissions = audios;
        setAudioSubmissions(audios);
      }
    } catch (e) {
      console.warn('Failed to refresh opportunity data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const saveDraft = async (draftData: Partial<OpportunityDraft>) => {
    setDrafts(prev => {
      const now = new Date().toISOString();
      if (draftData.id) {
        const exists = prev.some(d => d.id === draftData.id);
        if (exists) {
          return prev.map(d => d.id === draftData.id ? { ...d, ...draftData, lastEditedAt: now } : d);
        } else {
          return [{ ...draftData, id: draftData.id, lastEditedAt: now } as OpportunityDraft, ...prev];
        }
      } else {
        const newDraft = { ...draftData, id: `draft-${Date.now()}`, lastEditedAt: now } as OpportunityDraft;
        return [newDraft, ...prev];
      }
    });
  };

  const publishDraft = async (draftId: string, body: CreateOpportunityRequest) => {
    try {
      const isBackendDraft = draftId && !draftId.startsWith('draft-');
      if (isBackendDraft) {
        await adminOpportunityApi.updateOpportunity(draftId, { ...body, status: 'PUBLISHED' });
      } else {
        await adminOpportunityApi.createOpportunity({ ...body, status: 'PUBLISHED' });
      }
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      await refreshAll();
    } catch (e) {
      console.error('Failed to publish opportunity', e);
      throw e;
    }
  };

  const updateAudioStatus = async (id: string, status: string) => {
    // 1. Optimistically update local audioSubmissions
    setAudioSubmissions(prev =>
      prev.map(item => item.id === id ? { ...item, status } : item)
    );

    // 2. Also update selectedAudio if it's the active one
    setSelectedAudio(curr => curr && curr.id === id ? { ...curr, status } : curr);

    // 3. Persist to backend API if it's a real submission
    if (id && !id.startsWith('mock-')) {
      try {
        await adminOpportunityApi.updateAudioStatus(id, status);
      } catch (e) {
        console.warn(`Failed to persist audio status ${status} for ${id}:`, e);
      }
    }
  };

  const getActiveDraft = (): OpportunityDraft | null => {
    if (!activeDraftId) return null;
    
    // First check local drafts
    const local = drafts.find(d => d.id === activeDraftId);
    if (local) return local;

    // Check backend drafts & opportunities
    const backend = allOpportunities.find(o => o.id === activeDraftId);
    if (backend) {
      const parsedTasks = backend.tasks 
        ? backend.tasks.split('\n').map(t => t.trim()).filter(Boolean)
        : [''];
      const parsedSkills = (backend as any).requiredSkills
        ? String((backend as any).requiredSkills).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      let cleanHero = backend.heroImageUrl || null;
      if (cleanHero && cleanHero.startsWith('local:')) {
        cleanHero = null;
      }

      return {
        id: backend.id,
        opportunityTitle: backend.title || '',
        coverImage: cleanHero,
        selectedCategory: backend.category || null,
        selectedKnowledgeHolder: backend.elderName || backend.elderId || null,
        mapRegion: {
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        locationText: backend.location || '',
        scheduleDate: backend.scheduledDate ? String(backend.scheduledDate) : null,
        scheduleStartTime: null,
        scheduleEndTime: null,
        scheduleDuration: backend.durationText || '',
        isFlexibleSchedule: !backend.scheduledDate && !backend.durationText,
        selectedSkills: parsedSkills,
        tasks: parsedTasks.length > 0 ? parsedTasks : [''],
        selectedDeliverables: ['High-resolution photos', 'Audio documentation'],
        preservationDescription: backend.preservationGoal || backend.description || '',
        lastEditedAt: backend.updatedAt || backend.createdAt || new Date().toISOString(),
      };
    }

    return null;
  };

  return (
    <OpportunityContext.Provider value={{
      drafts,
      allOpportunities,
      draftOpportunities,
      publishedOpportunities,
      closedOpportunities,
      audioSubmissions,
      selectedAudio,
      setSelectedAudio,
      activeDraftId,
      setActiveDraftId,
      saveDraft,
      publishDraft,
      updateAudioStatus,
      getActiveDraft,
      originTab,
      setOriginTab,
      loading,
      refreshAll
    }}>
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunity = () => useContext(OpportunityContext);
