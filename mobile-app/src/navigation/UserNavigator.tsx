import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home';
import { CulturalMapScreen } from '../screens/cultural-map';
import { TreasureHuntScreen } from '../screens/cultural-map/treasure-hunt';
import { BadgesScreen } from '../screens/cultural-map/badges';
import { VideoDetailScreen, BlogDetailScreen } from '../screens/content-details';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Header, UserFooter } from '../components/common';
import type { UserTabKey } from '../components/common';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from './RootNavigator';

export type UserScreen = UserTabKey | 'hunt' | 'badges' | 'video' | 'blog';

interface UserNavigatorProps {
  /** Root stack navigation — used to leave this flow entirely (Learning, Creator, PrivacyData, Admin, …). */
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Self-contained general-user flow (home feed, cultural map, treasure hunt,
 * badges, profile), nested inside RootNavigator as a single 'User' route —
 * same pattern as CreatorNavigator/LearningNavigator. Originally this was
 * the app's own top-level manual screen-switching state machine (see
 * feature/lakni/home-page's App.tsx); relocated here so it mounts as one
 * screen instead of replacing the whole app, and so "Learn" / "Market" can
 * hand off to the existing LearningNavigator / CreatorNavigator stacks
 * instead of showing "Coming soon" placeholders.
 */
export const UserNavigator: React.FC<UserNavigatorProps> = ({ navigation }) => {
  const [screen, setScreen] = useState<UserScreen>('home');
  // Cultural map is expensive to mount (Mapbox) — mount it once on first
  // visit and toggle visibility afterwards instead of remounting each time.
  const [hasVisitedMap, setHasVisitedMap] = useState(false);

  const handleNavigate = (tab: string) => {
    if (tab === 'learn') {
      navigation.navigate('Learning');
      return;
    }
    if (tab === 'market') {
      navigation.navigate('Creator');
      return;
    }
    if (tab === 'admin_home') {
      navigation.replace('Admin');
      return;
    }
    if (tab === 'map' && !hasVisitedMap) setHasVisitedMap(true);
    setScreen(tab as UserScreen);
  };

  const footerActiveTab: UserTabKey =
    screen === 'hunt' || screen === 'badges' ? 'map' : (screen as UserTabKey);

  const showHeader = screen !== 'home' && screen !== 'video' && screen !== 'blog';
  const showFooter = screen !== 'video' && screen !== 'blog';

  return (
    <View style={{ flex: 1 }}>
      {showHeader && <Header onNavigate={handleNavigate} />}

      {screen === 'home' && <HomeScreen onNavigate={handleNavigate} />}

      {hasVisitedMap && (
        <View
          style={{
            flex: screen === 'map' ? 1 : 0,
            display: screen === 'map' ? 'flex' : 'none',
          }}
        >
          <CulturalMapScreen isActive={screen === 'map'} onNavigate={handleNavigate} />
        </View>
      )}

      {screen === 'hunt' && <TreasureHuntScreen onNavigate={handleNavigate} />}
      {screen === 'badges' && <BadgesScreen onNavigate={handleNavigate} />}

      {screen === 'profile' && (
        <ProfileScreen
          onOpenPrivacyData={() => navigation.navigate('PrivacyData')}
          onBecomeFreelancer={() => navigation.navigate('Creator', { initialScreen: 'apply' })}
          onBecomeStoryteller={() => navigation.navigate('StorytellerOnboarding')}
          onLogout={() => {
            useAuthStore.getState().clearSession();
            navigation.replace('Login');
          }}
        />
      )}

      {screen === 'video' && (
        <VideoDetailScreen
          onBack={() => setScreen('home')}
          onNavigateMap={() => handleNavigate('map')}
        />
      )}
      {screen === 'blog' && <BlogDetailScreen onBack={() => setScreen('home')} />}

      {showFooter && <UserFooter activeTab={footerActiveTab} onTabSelect={handleNavigate} />}
    </View>
  );
};

export default UserNavigator;
