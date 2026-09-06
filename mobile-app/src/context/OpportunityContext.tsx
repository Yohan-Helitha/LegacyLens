import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface OpportunityDraft {
  id: string;
  lastEditedAt: string;
  
  opportunityTitle: string;
  coverImage: string | null;
  selectedCategory: string | null;
  
  selectedKnowledgeHolder: string | null;
  
  mapRegion: any;
  locationText: string;
  scheduleDate: string | null;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  scheduleDuration: string;
  isFlexibleSchedule: boolean;
  
  selectedSkills: string[];
  tasks: string[];
  selectedDeliverables: string[];
  preservationDescription: string;
}

interface OpportunityContextType {
  drafts: OpportunityDraft[];
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  saveDraft: (draft: Partial<OpportunityDraft>) => void;
  getActiveDraft: () => OpportunityDraft | null;
  originTab: string;
  setOriginTab: (tab: string) => void;
}

const OpportunityContext = createContext<OpportunityContextType>({} as OpportunityContextType);

export const OpportunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<OpportunityDraft[]>([
    {
      id: 'draft-1',
      lastEditedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      opportunityTitle: 'Traditional Clay Pottery',
      coverImage: 'https://images.unsplash.com/photo-1610992015732-280780447387?q=80&w=2000&auto=format&fit=crop',
      selectedCategory: 'Craft',
      selectedKnowledgeHolder: 'kh-1',
      mapRegion: { latitude: 5.9549, longitude: 80.5550, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      locationText: 'Matara, Sri Lanka',
      scheduleDate: new Date().toISOString(),
      scheduleStartTime: null,
      scheduleEndTime: null,
      scheduleDuration: '3 hrs',
      isFlexibleSchedule: false,
      selectedSkills: [],
      tasks: [''],
      selectedDeliverables: [],
      preservationDescription: '',
    },
    {
      id: 'draft-2',
      lastEditedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
      opportunityTitle: 'Traditional Reed Weaving',
      coverImage: 'https://images.unsplash.com/photo-1544621985-cd27cc6c6f39?q=80&w=2000&auto=format&fit=crop',
      selectedCategory: 'Craft',
      selectedKnowledgeHolder: 'kh-2',
      mapRegion: { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      locationText: 'Colombo, Sri Lanka',
      scheduleDate: null,
      scheduleStartTime: null,
      scheduleEndTime: null,
      scheduleDuration: '',
      isFlexibleSchedule: true,
      selectedSkills: [],
      tasks: [''],
      selectedDeliverables: [],
      preservationDescription: '',
    },
    {
      id: 'draft-3',
      lastEditedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      opportunityTitle: 'Documenting Grandma\'s Kiribath',
      coverImage: null,
      selectedCategory: 'Food',
      selectedKnowledgeHolder: null,
      mapRegion: { latitude: 7.0840, longitude: 80.0098, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      locationText: 'Gampaha, Sri Lanka',
      scheduleDate: null,
      scheduleStartTime: null,
      scheduleEndTime: null,
      scheduleDuration: '',
      isFlexibleSchedule: true,
      selectedSkills: [],
      tasks: [''],
      selectedDeliverables: [],
      preservationDescription: '',
    }
  ]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [originTab, setOriginTab] = useState<string>('intake');

  const saveDraft = (draftData: Partial<OpportunityDraft>) => {
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

  const getActiveDraft = () => {
    if (!activeDraftId) return null;
    return drafts.find(d => d.id === activeDraftId) || null;
  };

  return (
    <OpportunityContext.Provider value={{ drafts, activeDraftId, setActiveDraftId, saveDraft, getActiveDraft, originTab, setOriginTab }}>
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunity = () => useContext(OpportunityContext);
