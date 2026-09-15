import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TreasureHuntProvider } from './src/context/TreasureHuntContext';
import { OpportunityProvider } from './src/context/OpportunityContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <TreasureHuntProvider>
        <OpportunityProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </OpportunityProvider>
      </TreasureHuntProvider>
    </SafeAreaProvider>
  );
}
