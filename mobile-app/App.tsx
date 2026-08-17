import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from './src/screens/onboarding';
import { CreatorDashboard } from './src/screens/marketplace/creator/CreatorDashboard';
import { OpportunityPage } from './src/screens/marketplace/creator/OpportunityPage';
import { OpportunityDetailPage } from './src/screens/marketplace/creator/OpportunityDetailPage';
import type { NavTab } from './src/components/BottomNavBar';

type Screen = 'loading' | 'dashboard' | 'market' | 'detail';

/**
 * Root entry point.
 *
 * Manages top-level screen navigation as a simple state machine.
 * Once React Navigation is wired up, replace this with:
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');

  /** Called by LoadingScreen after its 3-second timer */
  const handleLoadingFinish = () => setScreen('dashboard');

  /**
   * Shared navigation handler passed to all screens.
   * Maps nav tab keys to screens.
   */
  const handleNavigate = (tab: NavTab) => {
    if (tab === 'home')   setScreen('dashboard');
    if (tab === 'market') setScreen('market');
    // inbox / profile: placeholder — stay on current screen for now
  };

  /** Called when the Apply button is pressed on OpportunityPage */
  const handleApply = () => setScreen('detail');

  /** Called when back arrow is pressed on OpportunityDetailPage */
  const handleBack = () => setScreen('market');

  return (
    <SafeAreaProvider>
      {screen === 'loading' && (
        <LoadingScreen onFinish={handleLoadingFinish} />
      )}
      {screen === 'dashboard' && (
        <CreatorDashboard onNavigate={handleNavigate} />
      )}
      {screen === 'market' && (
        <OpportunityPage onNavigate={handleNavigate} onApply={handleApply} />
      )}
      {screen === 'detail' && (
        <OpportunityDetailPage onNavigate={handleNavigate} onBack={handleBack} />
      )}
    </SafeAreaProvider>
  );
}
