import React, { useState } from 'react';
import { View, Modal } from 'react-native';
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

export const UserNavigator: React.FC<UserNavigatorProps> = ({ navigation }) => {
  const [screen, setScreen] = useState<UserScreen>('home');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [hasVisitedMap, setHasVisitedMap] = useState(false);

  const handleNavigate = (tab: string, item?: any) => {
    if (item) {
      setSelectedPost(item);
    }
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
          onLogout={() => {
            useAuthStore.getState().clearSession();
            navigation.replace('Login');
          }}
        />
      )}

      <Modal
        visible={screen === 'video'}
        animationType="slide"
        onRequestClose={() => setScreen('home')}
      >
        <VideoDetailScreen
          post={selectedPost}
          onBack={() => setScreen('home')}
          onNavigateMap={() => handleNavigate('map')}
          onNavigateSearch={() => setScreen('home')}
          onSelectRelatedPost={(p) => setSelectedPost(p)}
        />
      </Modal>
      <Modal
        visible={screen === 'blog'}
        animationType="slide"
        onRequestClose={() => setScreen('home')}
      >
        <BlogDetailScreen
          post={selectedPost}
          onBack={() => setScreen('home')}
          onNavigateSearch={() => setScreen('home')}
        />
      </Modal>

      {showFooter && <UserFooter activeTab={footerActiveTab} onTabSelect={handleNavigate} />}
    </View>
  );
};

export default UserNavigator;
