import React, { useState } from 'react';
import { CreatorDashboard } from '../screens/marketplace/creator/CreatorDashboard';
import { OpportunityPage } from '../screens/marketplace/creator/OpportunityPage';
import { OpportunityDetailPage } from '../screens/marketplace/creator/OpportunityDetailPage';
import { BecomeCreatorApplication } from '../screens/marketplace/creator/BecomeCreatoApplication';
import { CreatorVerificationUpdatePage } from '../screens/marketplace/creator/CreatorVerificationUpdatePage';
import { InApp } from '../screens/marketplace/creator/InApp';
import { InboxMessage } from '../screens/marketplace/creator/InboxMessage';
import type { NavTab } from '../components/BottomNavBar';

export type CreatorScreen = 'dashboard' | 'market' | 'detail' | 'apply' | 'pending' | 'inbox' | 'conversation';

interface CreatorNavigatorProps {
  /** Which internal screen to land on first — 'dashboard' unless entered directly into the application form. */
  initialScreen?: CreatorScreen;
}

/**
 * Self-contained marketplace/creator flow, nested inside RootNavigator as a
 * single 'Creator' route (same pattern as LearningNavigator). Originally this
 * was the app's own top-level navigator (a manual screen-switching state
 * machine, not yet using React Navigation) — relocated here unchanged so it
 * can be mounted as one screen instead of replacing the whole app.
 *
 * The original also opened on its own 'loading' splash; that's dropped here
 * since RootNavigator's own Loading screen already ran before a user could
 * ever reach this nested flow.
 */
export const CreatorNavigator: React.FC<CreatorNavigatorProps> = ({
  initialScreen = 'dashboard',
}) => {
  const [screen, setScreen] = useState<CreatorScreen>(initialScreen);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  /**
   * Shared navigation handler passed to all screens.
   * Maps nav tab keys to screens.
   */
  const handleNavigate = (tab: NavTab) => {
    if (tab === 'home') setScreen('dashboard');
    if (tab === 'market') setScreen('market');
    if (tab === 'profile') setScreen('apply');
    if (tab === 'inbox') setScreen('inbox');
  };

  /** Called when a "View Details"/"Apply" action is pressed on OpportunityPage */
  const handleViewDetail = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setScreen('detail');
  };

  /** Called when back arrow is pressed on OpportunityDetailPage */
  const handleBack = () => setScreen('market');

  /** Called when a conversation card is tapped on InApp */
  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setScreen('conversation');
  };

  /** Called when back arrow is pressed on InboxMessage */
  const handleBackToInbox = () => setScreen('inbox');

  /**
   * Called when the creator application is submitted.
   *
   * TEMPORARY: admin review isn't built yet, so there's no real way for a
   * PENDING application to ever become VERIFIED/REJECTED — landing on the
   * pending screen would strand testing here indefinitely. Skipping straight
   * to the dashboard for now so the rest of the app remains reachable.
   * Restore the commented line below once admin verification exists.
   */
  const handleApplicationSubmit = () => {
    // setScreen('pending');
    setScreen('dashboard');
  };

  /** Called when "Back to Home" is pressed on the verification pending screen */
  const handleBackToHome = () => setScreen('dashboard');

  return (
    <>
      {screen === 'dashboard' && <CreatorDashboard onNavigate={handleNavigate} />}
      {screen === 'market' && (
        <OpportunityPage onNavigate={handleNavigate} onViewDetail={handleViewDetail} />
      )}
      {screen === 'detail' && (
        <OpportunityDetailPage
          onNavigate={handleNavigate}
          onBack={handleBack}
          opportunityId={selectedOpportunityId}
        />
      )}
      {screen === 'apply' && (
        <BecomeCreatorApplication onNavigate={handleNavigate} onSubmit={handleApplicationSubmit} />
      )}
      {screen === 'pending' && (
        <CreatorVerificationUpdatePage
          onBackToHome={handleBackToHome}
          onReapply={() => setScreen('apply')}
        />
      )}
      {screen === 'inbox' && (
        <InApp onNavigate={handleNavigate} onOpenConversation={handleOpenConversation} />
      )}
      {screen === 'conversation' && (
        <InboxMessage
          onNavigate={handleNavigate}
          onBack={handleBackToInbox}
          conversationId={selectedConversationId}
        />
      )}
    </>
  );
};

export default CreatorNavigator;
