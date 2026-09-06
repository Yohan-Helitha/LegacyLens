import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapApi } from '../services/api/mapApi';

interface TreasureHuntContextType {
  unlockedBadges: string[];
  allBadges: any[];
  unlockBadge: (id: string) => void;
  fetchBadges: () => Promise<void>;
}

const TreasureHuntContext = createContext<TreasureHuntContextType>({
  unlockedBadges: [],
  allBadges: [],
  unlockBadge: () => {},
  fetchBadges: async () => {},
});

export const TreasureHuntProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with some default unlocked badges
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  const fetchBadges = useCallback(async () => {
    try {
      const [myBadgesResponse, allBadgesResponse] = await Promise.all([
        mapApi.getMyBadges(),
        mapApi.getAllBadges()
      ]);
      
      if (Array.isArray(allBadgesResponse)) {
        setAllBadges(allBadgesResponse);
      }

      if (Array.isArray(myBadgesResponse)) {
        setUnlockedBadges(myBadgesResponse);
        // Sync with async storage just in case
        AsyncStorage.setItem('UNLOCKED_BADGES', JSON.stringify(myBadgesResponse));
      }
    } catch (error: any) {
      console.log('Failed to fetch badges from DB, falling back to local storage:', error?.message || error);
      AsyncStorage.getItem('UNLOCKED_BADGES').then(data => {
        if (data) {
          setUnlockedBadges(JSON.parse(data));
        }
      });
    }
  }, []);

  useEffect(() => {
    // Load from backend API on mount
    fetchBadges();
  }, []);

  const unlockBadge = useCallback(async (id: string) => {
    try {
      await mapApi.earnBadge(id);
    } catch (error) {
      console.log('Failed to sync unlocked badge to server:', error);
    }
    setUnlockedBadges(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem('UNLOCKED_BADGES', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <TreasureHuntContext.Provider value={{ unlockedBadges, allBadges, unlockBadge, fetchBadges }}>
      {children}
    </TreasureHuntContext.Provider>
  );
};

export const useTreasureHunt = () => useContext(TreasureHuntContext);
