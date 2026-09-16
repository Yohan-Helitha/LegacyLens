import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  MaterialIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';
import {
  Literata_700Bold,
} from '@expo-google-fonts/literata';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TreasureHuntProvider } from './src/context/TreasureHuntContext';
import { OpportunityProvider } from './src/context/OpportunityContext';

export default function App() {
  // Load all icon fonts + Google Fonts before rendering any screen.
  // Without this, @expo/vector-icons registers fonts lazily at render time
  // and can hit CTFontManagerError 104 (font registration conflict) in Expo Go.
  const [fontsLoaded] = useFonts({
    // Vector icon sets used across the app
    ...MaterialIcons.font,   // 'material' → MaterialIcons.ttf
    ...Ionicons.font,        // 'Ionicons'  → Ionicons.ttf
    ...Feather.font,         // 'Feather'   → Feather.ttf
    // FontAwesome5 uses split font files (Regular, Solid, Brands)
    'FontAwesome5Free-Regular': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf'),
    'FontAwesome5Free-Solid':   require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf'),
    'FontAwesome5Free-Brand':   require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf'),
    // Custom display & body fonts (referenced in src/theme/index.ts Typography)
    Literata_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEFEE' }}>
        <ActivityIndicator size="large" color="#0F5C5C" />
      </View>
    );
  }

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
