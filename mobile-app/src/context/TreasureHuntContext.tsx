import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TreasureHuntContextType {
  unlockedBadges: string[];
  unlockBadge: (id: string) => void;
}

const TreasureHuntContext = createContext<TreasureHuntContextType>({
  unlockedBadges: [],
  unlockBadge: () => {},
});

export const TreasureHuntProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with some default unlocked badges
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(['sigiriya-explorer', 'ceylon-tea']);

  useEffect(() => {
    // Load from async storage on mount
    AsyncStorage.getItem('UNLOCKED_BADGES').then(data => {
      if (data) {
        setUnlockedBadges(JSON.parse(data));
      }
    });
  }, []);

  const unlockBadge = (id: string) => {
    setUnlockedBadges(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem('UNLOCKED_BADGES', JSON.stringify(next));
      return next;
    });
  };

  return (
    <TreasureHuntContext.Provider value={{ unlockedBadges, unlockBadge }}>
      {children}
    </TreasureHuntContext.Provider>
  );
};

export const useTreasureHunt = () => useContext(TreasureHuntContext);
