import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal } from 'react-native';
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
  const [intakeBadge, setIntakeBadge] = useState<string | null>('18');
  const [reviewBadge, setReviewBadge] = useState<string | null>('5');

  // Clear badges when target screens are opened
  const handleNavigate = (tab: string) => {
    if (tab === 'home') {
      navigation.replace('User');
      return;
    }

    if (tab === 'intake' || tab === 'opp_review') {
      setIntakeBadge(null);
    }
    if (tab === 'review') {
      setReviewBadge(null);
    }

    setScreen(tab as AdminScreen);
  };

  // Simulate newly added content after some time on Home screen
  React.useEffect(() => {
    if (screen === 'admin_home') {
      const timer = setTimeout(() => {
        setIntakeBadge('19'); // Simulates a newly added voice recording
        setReviewBadge('6');  // Simulates a newly added reported moderation item
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [screen]);

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

      {screen === 'admin_home' && (
        <AdminHomeScreen
          onNavigate={handleNavigate}
          intakeBadge={intakeBadge}
          reviewBadge={reviewBadge}
        />
      )}
      {screen === 'intake' && (
        <OpportunityIntakeScreen onOpenReview={() => {
          setIntakeBadge(null);
          setScreen('opp_review');
        }} />
      )}
      {screen === 'add_opp' && <CreateOpportunityScreen onNavigate={handleNavigate} />}
      {screen === 'opp_review' && (
        <OpportunityReviewScreen
          onBack={() => {
            setIntakeBadge(null);
            setScreen('intake');
          }}
          onApprove={() => setScreen('add_opp')}
        />
      )}
      {screen === 'drafts' && <OpportunityDraftsScreen onNavigate={handleNavigate} />}
      {screen === 'review' && <ModerationQueueScreen />}
      <Modal
        visible={screen === 'video'}
        animationType="slide"
        onRequestClose={() => setScreen('admin_home')}
      >
        <VideoDetailScreen onBack={() => setScreen('admin_home')} />
      </Modal>
      <Modal
        visible={screen === 'blog'}
        animationType="slide"
        onRequestClose={() => setScreen('admin_home')}
      >
        <BlogDetailScreen onBack={() => setScreen('admin_home')} />
      </Modal>

      {screen === 'admin_profile' && (
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>Admin Profile (Coming Soon)</Text>
        </View>
      )}

      {showChrome && (
        <AdminFooter 
          activeTab={footerActiveTab} 
          onTabSelect={handleNavigate} 
          intakeBadge={intakeBadge}
          reviewBadge={reviewBadge}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: '#f8faf9', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: Colors.text },
});

export default AdminNavigator;
