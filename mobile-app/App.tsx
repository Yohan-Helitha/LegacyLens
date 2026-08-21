import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/home';
import { CulturalMapScreen } from './src/screens/cultural-map';
import { TreasureHuntScreen } from './src/screens/cultural-map/treasure-hunt';
import { BadgesScreen } from './src/screens/cultural-map/badges';
import { AdminHomeScreen } from './src/screens/admin/home';
import { ModerationQueueScreen } from './src/screens/admin/moderation';
import { CreateOpportunityScreen } from './src/screens/admin/opportunity-create';
import { OpportunityIntakeScreen, OpportunityReviewScreen } from './src/screens/admin/opportunity-intake';
import { VideoDetailScreen, BlogDetailScreen } from './src/screens/content-details';
import { UserFooter, AdminFooter, AdminHeader, Header, UserTabKey, AdminTabKey } from './src/components/common';
import { Colors } from './src/theme';
import { LoadingScreen } from './src/screens/onboarding';
import { TreasureHuntProvider } from './src/context/TreasureHuntContext';

type ExtraTabKey = 'hunt' | 'badges' | 'video' | 'blog' | 'add_opp' | 'admin_profile' | 'opp_review';
type TabKey = UserTabKey | AdminTabKey | ExtraTabKey;

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('admin_home');
  const [showLoading, setShowLoading] = useState(true);
  const [hasVisitedMap, setHasVisitedMap] = useState(false);

  React.useEffect(() => {
    if (currentTab === 'map' && !hasVisitedMap) {
      setHasVisitedMap(true);
    }
  }, [currentTab, hasVisitedMap]);

  React.useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => setShowLoading(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showLoading]);

  if (showLoading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <TreasureHuntProvider>
      <View style={{ flex: 1 }}>
        {['admin_home', 'intake', 'admin_profile', 'review', 'add_opp', 'opp_review'].includes(currentTab) && <AdminHeader onNavigate={(tab) => setCurrentTab(tab as any)} />}
        {['learn', 'market', 'map', 'profile', 'hunt', 'badges'].includes(currentTab) && <Header onNavigate={(tab) => setCurrentTab(tab as any)} />}
        {currentTab === 'home'   && <HomeScreen />}
        {hasVisitedMap && (
          <View style={{ flex: currentTab === 'map' ? 1 : 0, display: currentTab === 'map' ? 'flex' : 'none' }}>
            <CulturalMapScreen isActive={currentTab === 'map'} onNavigate={(tab) => setCurrentTab(tab as any)} />
          </View>
        )}
        {currentTab === 'hunt'   && <TreasureHuntScreen onNavigate={(tab) => setCurrentTab(tab as any)} />}
        {currentTab === 'badges' && <BadgesScreen onNavigate={(tab) => setCurrentTab(tab as any)} />}
        {currentTab === 'admin_home' && <AdminHomeScreen onNavigate={(tab) => setCurrentTab(tab as any)} />}
        {currentTab === 'intake' && <OpportunityIntakeScreen onOpenReview={() => setCurrentTab('opp_review')} />}
        {currentTab === 'add_opp' && <CreateOpportunityScreen />}
        {currentTab === 'opp_review' && <OpportunityReviewScreen onBack={() => setCurrentTab('intake')} onApprove={() => setCurrentTab('add_opp')} />}

        {currentTab === 'review' && <ModerationQueueScreen />}
        {currentTab === 'video' && <VideoDetailScreen />}
        {currentTab === 'blog' && <BlogDetailScreen />}
        {/* Placeholder screens for unbuilt tabs */}
        {currentTab === 'admin_profile' && <View style={{ flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' }}><Text>Admin Profile (Coming Soon)</Text></View>}
        {currentTab === 'learn' && <View style={{ flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' }}><Text>Learn (Coming Soon)</Text></View>}
        {currentTab === 'market' && <View style={{ flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' }}><Text>Market (Coming Soon)</Text></View>}
        {currentTab === 'profile' && <View style={{ flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' }}><Text>Profile (Coming Soon)</Text></View>}

        {['admin_home', 'intake', 'admin_profile', 'review', 'add_opp', 'opp_review'].includes(currentTab) ? (
          <AdminFooter activeTab={currentTab as AdminTabKey} onTabSelect={setCurrentTab} />
        ) : ['home', 'learn', 'market', 'map', 'profile', 'hunt', 'badges'].includes(currentTab) ? (
          <UserFooter activeTab={currentTab as UserTabKey} onTabSelect={setCurrentTab} />
        ) : (
          <View style={styles.fallbackBar}>
            <TouchableOpacity onPress={() => setCurrentTab('home')} style={styles.fallbackBtn}><Text>To User</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentTab('admin_home')} style={styles.fallbackBtn}><Text>To Admin</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLoading(true)} style={styles.fallbackBtn}><Text>Onboarding</Text></TouchableOpacity>
          </View>
        )}
      </View>
      </TreasureHuntProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fallbackBar: { flexDirection: 'row', backgroundColor: '#e1e3e2', padding: 12, justifyContent: 'space-around' },
  fallbackBtn: { padding: 8, backgroundColor: Colors.white, borderRadius: 8 },
});
