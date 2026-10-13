import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TreasureHuntProvider } from './src/context/TreasureHuntContext';
import { OpportunityProvider } from './src/context/OpportunityContext';
import { AppDialogHost } from './src/components/common/AppDialog';
import { usePushRegistration } from './src/hooks/usePushNotifications';
import { userLikesStorage } from './src/utils/userLikesStorage';

export default function App() {
  // Every signed-in user - creator, elder or admin - gets their phone registered for notifications.
  usePushRegistration();

  React.useEffect(() => {
    userLikesStorage.getLikes().catch(() => {});
    userLikesStorage.getClientId().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <TreasureHuntProvider>
        <OpportunityProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <AppDialogHost />
        </OpportunityProvider>
      </TreasureHuntProvider>
    </SafeAreaProvider>
  );
}
