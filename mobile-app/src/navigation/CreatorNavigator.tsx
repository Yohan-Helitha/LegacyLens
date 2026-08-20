import React, { useState } from 'react';
import { CreatorDashboard } from '../screens/marketplace/creator/CreatorDashboard';
import { OpportunityPage } from '../screens/marketplace/creator/OpportunityPage';
import { OpportunityDetailPage } from '../screens/marketplace/creator/OpportunityDetailPage';
import { BecomeCreatorApplication } from '../screens/marketplace/creator/BecomeCreatoApplication';
import { CreatorVerificationUpdatePage } from '../screens/marketplace/creator/CreatorVerificationUpdatePage';
import type { NavTab } from '../components/BottomNavBar';

export type CreatorScreen = 'dashboard' | 'market' | 'detail' | 'apply' | 'pending';

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

  /**
   * Shared navigation handler passed to all screens.
   * Maps nav tab keys to screens.
   */
  const handleNavigate = (tab: NavTab) => {
    if (tab === 'home') setScreen('dashboard');
    if (tab === 'market') setScreen('market');
    if (tab === 'profile') setScreen('apply');
    // inbox: placeholder — stay on current screen for now
  };

  /** Called when the Apply button is pressed on OpportunityPage */
  const handleApply = () => setScreen('detail');

  /** Called when back arrow is pressed on OpportunityDetailPage */
  const handleBack = () => setScreen('market');

  /** Called when the creator application is submitted */
  const handleApplicationSubmit = () => setScreen('pending');

  /** Called when "Back to Home" is pressed on the verification pending screen */
  const handleBackToHome = () => setScreen('dashboard');

  return (
    <>
      {screen === 'dashboard' && <CreatorDashboard onNavigate={handleNavigate} />}
      {screen === 'market' && (
        <OpportunityPage onNavigate={handleNavigate} onApply={handleApply} />
      )}
      {screen === 'detail' && (
        <OpportunityDetailPage onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {screen === 'apply' && (
        <BecomeCreatorApplication onNavigate={handleNavigate} onSubmit={handleApplicationSubmit} />
      )}
      {screen === 'pending' && (
        <CreatorVerificationUpdatePage onBackToHome={handleBackToHome} />
      )}
    </>
  );
};

export default CreatorNavigator;
