import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminHomeScreen } from '../screens/admin/home';
import { ModerationQueueScreen } from '../screens/admin/moderation';
import { CreateOpportunityScreen } from '../screens/admin/opportunity-create';
import { OpportunityIntakeScreen, OpportunityReviewScreen } from '../screens/admin/opportunity-intake';
import { OpportunityDraftsScreen } from '../screens/admin/opportunity-drafts';
import { VideoDetailScreen, BlogDetailScreen } from '../screens/content-details';
import { AdminHeader, AdminFooter } from '../components/common';
import type { AdminTabKey } from '../components/common';
import { Colors } from '../theme';
import type { RootStackParamList } from './RootNavigator';

export type AdminScreen = AdminTabKey | 'add_opp' | 'opp_review' | 'drafts' | 'video' | 'blog';

interface AdminNavigatorProps {
  /** Root stack navigation — used only to leave this flow ("Return to User View"). */
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Self-contained admin flow (home dashboard, opportunity intake/review/
 * drafts, moderation queue), nested inside RootNavigator as a single
 * 'Admin' route — same pattern as UserNavigator/CreatorNavigator. Only
 * reachable when the logged-in user's roles include 'ADMIN' (see
 * RootNavigator's Login screen).
 */
export const AdminNavigator: React.FC<AdminNavigatorProps> = ({ navigation }) => {
  const [screen, setScreen] = useState<AdminScreen>('admin_home');

  const handleNavigate = (tab: string) => {
    if (tab === 'home') {
      navigation.replace('User');
      return;
    }
    setScreen(tab as AdminScreen);
  };

  const footerActiveTab: AdminTabKey =
    screen === 'intake' || screen === 'opp_review'
      ? 'intake'
      : screen === 'review'
        ? 'review'
        : screen === 'admin_profile'
          ? 'admin_profile'
          : 'admin_home';

  const showChrome = screen !== 'video' && screen !== 'blog';

  return (
    <View style={{ flex: 1 }}>
      {showChrome && <AdminHeader onNavigate={handleNavigate} />}

      {screen === 'admin_home' && <AdminHomeScreen onNavigate={handleNavigate} />}
      {screen === 'intake' && (
        <OpportunityIntakeScreen onOpenReview={() => setScreen('opp_review')} />
      )}
      {screen === 'add_opp' && <CreateOpportunityScreen onNavigate={handleNavigate} />}
      {screen === 'opp_review' && (
        <OpportunityReviewScreen
          onBack={() => setScreen('intake')}
          onApprove={() => setScreen('add_opp')}
        />
      )}
      {screen === 'drafts' && <OpportunityDraftsScreen onNavigate={handleNavigate} />}
      {screen === 'review' && <ModerationQueueScreen />}
      {screen === 'video' && <VideoDetailScreen onBack={() => setScreen('admin_home')} />}
      {screen === 'blog' && <BlogDetailScreen onBack={() => setScreen('admin_home')} />}

      {screen === 'admin_profile' && (
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>Admin Profile (Coming Soon)</Text>
        </View>
      )}

      {showChrome && <AdminFooter activeTab={footerActiveTab} onTabSelect={handleNavigate} />}
    </View>
  );
};

const s = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: Colors.text },
});

export default AdminNavigator;
