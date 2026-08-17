import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from './src/screens/onboarding';
import { CreatorDashboard } from './src/screens/marketplace/creator/CreatorDashboard';

/**
 * Root entry point.
 *
 * Renders LoadingScreen for 3 seconds, then automatically transitions
 * to CreatorDashboard via the onFinish callback.
 *
 * Once navigation is fully wired up, replace this with:
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 */
export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <SafeAreaProvider>
      {showDashboard ? (
        <CreatorDashboard />
      ) : (
        <LoadingScreen onFinish={() => setShowDashboard(true)} />
      )}
    </SafeAreaProvider>
  );
}
