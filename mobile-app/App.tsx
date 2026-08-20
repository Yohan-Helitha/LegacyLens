import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from './src/screens/onboarding';
import { NavigationContainer } from '@react-navigation/native';
import LearningNavigator from './src/navigation/LearningNavigator';

/**
 * Root entry point.
 *
 * Right now it renders the LoadingScreen directly.
 * Once navigation is wired up, replace this with:
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <LearningNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
