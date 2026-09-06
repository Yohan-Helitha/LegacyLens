import React, { useState } from 'react';
import { CreatorDashboard } from '../screens/marketplace/creator/CreatorDashboard';
import { OpportunityPage } from '../screens/marketplace/creator/OpportunityPage';
import { OpportunityDetailPage } from '../screens/marketplace/creator/OpportunityDetailPage';
import { BecomeCreatorApplication } from '../screens/marketplace/creator/BecomeCreatoApplication';
import { CreatorVerificationUpdatePage } from '../screens/marketplace/creator/CreatorVerificationUpdatePage';
import { InApp } from '../screens/marketplace/creator/InApp';
import { InboxMessage } from '../screens/marketplace/creator/InboxMessage';
import { PaymentHistoryPage } from '../screens/marketplace/creator/PaymentHistoryPage';
import { CreatorProfile } from '../screens/marketplace/creator/CreatorProfile';
import { OpportunityApplicationForm } from '../screens/marketplace/creator/OpportunityApplicationForm';
import { OpportunitySchedulePage } from '../screens/marketplace/creator/OpportunitySchedulePage';
import { SavedOpportunityApplication } from '../screens/marketplace/creator/SavedOpportunityApplication';
import { MyWorkList } from '../screens/marketplace/creator/MyWorkList';
import { ContinueMyWorkPage } from '../screens/marketplace/creator/ContinueMyWorkPage';
import { SavedCompletedWorkPage } from '../screens/marketplace/creator/SavedCompletedWorkPage';
import { SubmittedWorkDetailPage } from '../screens/marketplace/creator/SubmittedWorkDetailPage';
import type { NavTab } from '../components/BottomNavBar';

export type CreatorScreen =
  | 'dashboard'
  | 'market'
  | 'detail'
  | 'apply'
  | 'pending'
  | 'inbox'
  | 'conversation'
  | 'payment-history'
  | 'profile'
  | 'apply-opportunity'
  | 'schedule'
  | 'saved-applications'
  | 'my-work'
  | 'continue-work'
  | 'saved-completed-work'
  | 'submitted-work';

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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobSteps, setSelectedJobSteps] = useState(0);

  /**
   * Shared navigation handler passed to all screens.
   * Maps nav tab keys to screens.
   */
  const handleNavigate = (tab: NavTab) => {
    if (tab === 'home') setScreen('dashboard');
    if (tab === 'market') setScreen('market');
    if (tab === 'profile') setScreen('profile');
    if (tab === 'inbox') setScreen('inbox');
  };

  /** Called when a "View Details"/"Apply" action is pressed on OpportunityPage */
  const handleViewDetail = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setScreen('detail');
  };

  /** Called when back arrow is pressed on OpportunityDetailPage */
  const handleBack = () => setScreen('market');

  /** Called when the "Apply" button is pressed on OpportunityDetailPage */
  const handleApplyToOpportunity = () => setScreen('apply-opportunity');

  /** Called when "Discard"/"View Opportunity" is pressed on the application form */
  const handleBackToOpportunityDetail = () => setScreen('detail');

  /** Called when "Save" is pressed on the application form */
  const handleOpenSavedApplications = () => setScreen('saved-applications');

  /** Called when "Edit" is pressed on a saved draft in SavedOpportunityApplication */
  const handleEditDraft = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setScreen('apply-opportunity');
  };

  /** Called when "View" is pressed on a submitted application with a real linked opportunity */
  const handleViewOpportunityFromApplication = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setScreen('detail');
  };

  /** Called when a conversation card is tapped on InApp */
  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setScreen('conversation');
  };

  /** Called when back arrow is pressed on InboxMessage */
  const handleBackToInbox = () => setScreen('inbox');

  /** Called when "History" is pressed on CreatorDashboard's Collected Today card */
  const handleOpenHistory = () => setScreen('payment-history');

  /** Called when the "Schedule" tab is pressed on CreatorDashboard */
  const handleOpenSchedule = () => setScreen('schedule');

  /** Called when a job card is pressed on CreatorDashboard */
  const handleOpenMyWork = () => setScreen('my-work');

  /** Called when "Continue Work" is pressed on a card in MyWorkList */
  const handleContinueWork = (jobId: string, currentSteps: number) => {
    setSelectedJobId(jobId);
    setSelectedJobSteps(currentSteps);
    setScreen('continue-work');
  };

  /** Called when back arrow is pressed on ContinueMyWorkPage */
  const handleBackToMyWork = () => setScreen('my-work');

  /** Called when "Save As a Draft" is pressed on ContinueMyWorkPage */
  const handleOpenSavedDrafts = () => setScreen('saved-completed-work');

  /** Called when "View & Edit" is pressed on a draft in SavedCompletedWorkPage */
  const handleEditWorkDraft = (jobId: string, currentSteps: number) => {
    setSelectedJobId(jobId);
    setSelectedJobSteps(currentSteps);
    setScreen('continue-work');
  };

  /** Called when "View" is pressed on a Submitted/Completed card in MyWorkList */
  const handleOpenSubmittedWork = () => setScreen('submitted-work');

  /** Called when back arrow is pressed on PaymentHistoryPage */
  const handleBackToDashboard = () => setScreen('dashboard');

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
      {screen === 'dashboard' && (
        <CreatorDashboard
          onNavigate={handleNavigate}
          onOpenHistory={handleOpenHistory}
          onOpenSchedule={handleOpenSchedule}
          onOpenMyWork={handleOpenMyWork}
        />
      )}
      {screen === 'market' && (
        <OpportunityPage
          onNavigate={handleNavigate}
          onViewDetail={handleViewDetail}
          onOpenSavedApplications={handleOpenSavedApplications}
        />
      )}
      {screen === 'detail' && (
        <OpportunityDetailPage
          onNavigate={handleNavigate}
          onBack={handleBack}
          onApply={handleApplyToOpportunity}
          opportunityId={selectedOpportunityId}
        />
      )}
      {screen === 'apply-opportunity' && (
        <OpportunityApplicationForm
          onNavigate={handleNavigate}
          onBack={handleBackToOpportunityDetail}
          onSave={handleOpenSavedApplications}
          opportunityId={selectedOpportunityId}
        />
      )}
      {screen === 'saved-applications' && (
        <SavedOpportunityApplication
          onNavigate={handleNavigate}
          onBack={handleBack}
          onEditDraft={handleEditDraft}
          onViewOpportunity={handleViewOpportunityFromApplication}
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
      {screen === 'payment-history' && (
        <PaymentHistoryPage onNavigate={handleNavigate} onBack={handleBackToDashboard} />
      )}
      {screen === 'profile' && <CreatorProfile onNavigate={handleNavigate} />}
      {screen === 'schedule' && (
        <OpportunitySchedulePage onNavigate={handleNavigate} onBack={handleBackToDashboard} />
      )}
      {screen === 'my-work' && (
        <MyWorkList
          onNavigate={handleNavigate}
          onBack={handleBackToDashboard}
          onContinueWork={handleContinueWork}
          onViewSubmittedWork={handleOpenSubmittedWork}
        />
      )}
      {screen === 'continue-work' && (
        <ContinueMyWorkPage
          onNavigate={handleNavigate}
          onBack={handleBackToMyWork}
          onSaveDraft={handleOpenSavedDrafts}
          jobId={selectedJobId}
          initialSteps={selectedJobSteps}
        />
      )}
      {screen === 'saved-completed-work' && (
        <SavedCompletedWorkPage
          onNavigate={handleNavigate}
          onBack={handleBackToMyWork}
          onEditDraft={handleEditWorkDraft}
        />
      )}
      {screen === 'submitted-work' && (
        <SubmittedWorkDetailPage onNavigate={handleNavigate} onBack={handleBackToMyWork} />
      )}
    </>
  );
};

export default CreatorNavigator;
