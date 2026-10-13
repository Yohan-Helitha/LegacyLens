import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { adminOpportunityApi } from '../services/api/opportunityApi';
import { AdminOpportunityResponse, OpportunityAudioResponse, OpportunityDraft, CreateOpportunityRequest } from '../types/opportunity';

interface OpportunityContextType {
  drafts: OpportunityDraft[];
  draftOpportunities: AdminOpportunityResponse[];
  publishedOpportunities: AdminOpportunityResponse[];
  closedOpportunities: AdminOpportunityResponse[];
  audioSubmissions: OpportunityAudioResponse[];
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  saveDraft: (draft: Partial<OpportunityDraft>) => Promise<void>;
  publishDraft: (draftId: string, body: CreateOpportunityRequest) => Promise<void>;
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
        return prev.map(d => d.id === draftData.id ? { ...d, ...draftData, lastEditedAt: now } : d);
      } else {
        const newDraft = { ...draftData, id: `draft-${Date.now()}`, lastEditedAt: now } as OpportunityDraft;
        return [newDraft, ...prev];
      }
    });
  };

  const publishDraft = async (draftId: string, body: CreateOpportunityRequest) => {
    try {
      await adminOpportunityApi.createOpportunity(body);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      await refreshAll();
    } catch (e) {
      console.error('Failed to publish opportunity', e);
      throw e;
    }
  };

  const getActiveDraft = () => {
    if (!activeDraftId) return null;
    return drafts.find(d => d.id === activeDraftId) || null;
  };

  return (
    <OpportunityContext.Provider value={{
      drafts,
      draftOpportunities,
      publishedOpportunities,
      closedOpportunities,
      audioSubmissions,
      activeDraftId,
      setActiveDraftId,
      saveDraft,
      publishDraft,
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
