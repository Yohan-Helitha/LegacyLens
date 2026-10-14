import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CreatorDashboard } from '../screens/marketplace/creator/CreatorDashboard';
import { OpportunityPage } from '../screens/marketplace/creator/OpportunityPage';
import { OpportunityDetailPage } from '../screens/marketplace/creator/OpportunityDetailPage';
import { BecomeCreatorApplication } from '../screens/marketplace/creator/BecomeCreatoApplication';
import { CreatorVerificationUpdatePage } from '../screens/marketplace/creator/CreatorVerificationUpdatePage';
import { InApp, InboxMessage } from '../screens/messaging';
import { CreatorTopAppBar } from '../components/CreatorTopAppBar';
import { BottomNavBar } from '../components/BottomNavBar';
import { PaymentHistoryPage } from '../screens/marketplace/creator/PaymentHistoryPage';
import { CreatorProfile } from '../screens/marketplace/creator/CreatorProfile';
import { OpportunityApplicationForm } from '../screens/marketplace/creator/OpportunityApplicationForm';
import { OpportunitySchedulePage } from '../screens/marketplace/creator/OpportunitySchedulePage';
import { SavedOpportunityApplication } from '../screens/marketplace/creator/SavedOpportunityApplication';
import { MyWorkList } from '../screens/marketplace/creator/MyWorkList';
import { ContinueMyWorkPage } from '../screens/marketplace/creator/ContinueMyWorkPage';
import { PublicationPreviewPage } from '../screens/marketplace/creator/PublicationPreviewPage';
import type { JobResponse } from '../types/creatorDashboard';
import { LogPaymentPage } from '../screens/marketplace/creator/LogPaymentPage';
import { RejectedWorkPage } from '../screens/marketplace/creator/RejectedWorkPage';
import { RejectedApplicationsPage } from '../screens/marketplace/creator/RejectedApplicationsPage';
import { CreatorMenuContext } from './CreatorMenuContext';
import { useMyApplications } from '../hooks/useMyApplications';
import { groupApplications } from '../utils/applicationGroups';
import { creatorScreenForNotification } from './creatorNotificationRouting';
import { workProgressApi } from '../services/api/workProgressApi';
import { usePushNotificationEvents } from '../hooks/usePushNotifications';
import type { NavTab } from '../components/BottomNavBar';
import type { WorkTab } from '../screens/marketplace/creator/MyWorkList';

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
  | 'publication-preview'
  | 'log-payment'
  | 'rejected-work'
  | 'rejected-applications';

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
  const [previewJob, setPreviewJob] = useState<JobResponse | null>(null);
  // Which tab My Work opens on: Saved right after "Save As a Draft", and the last one used when coming back.
  const [myWorkTab, setMyWorkTab] = useState<WorkTab>('active');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null);
  const [selectedJobElderName, setSelectedJobElderName] = useState<string | null>(null);
  const [selectedJobLocation, setSelectedJobLocation] = useState<string | null>(null);

  // The red number on the side menu: how many applications have been rejected. Asked of the server
  // again whenever the creator moves to another screen, so a fresh rejection shows up promptly.
  const { applications: myApplications, reload: reloadApplications } = useMyApplications();
  // Only rejections the creator has not looked at yet - opening Rejected Applications clears them.
  const rejectedApplicationsCount = groupApplications(myApplications).unseenRejected.length;
  // Refreshed a moment after the screen opens, so the screen's own data gets the connection first.
  useEffect(() => {
    const timer = setTimeout(reloadApplications, 1200);
    return () => clearTimeout(timer);
  }, [screen, reloadApplications]);

  // Phone notifications. The phone itself is registered once for everyone at the top of the app;
  // here the creator side decides what a tap opens, and refreshes the red number when one arrives
  // while the app is open. On a build without notification support this does nothing.
  const openFromNotification = useCallback((data: Record<string, unknown>) => {
    const target = creatorScreenForNotification(data);
    if (target) setScreen(target);
  }, []);
  // The red number beside Rejected Submissions: rejected work the creator has not opened the page to see.
  const [rejectedWorkCount, setRejectedWorkCount] = useState(0);
  const reloadRejectedWork = useCallback(() => {
    workProgressApi.unseenRejectedCount().then(setRejectedWorkCount).catch(() => {});
  }, []);
  useEffect(() => {
    const timer = setTimeout(reloadRejectedWork, 1200);
    return () => clearTimeout(timer);
  }, [screen, reloadRejectedWork]);
  const reloadOnArrival = useCallback(() => {
    reloadApplications();
    reloadRejectedWork();
  }, [reloadApplications, reloadRejectedWork]);
  usePushNotificationEvents({ onTapped: openFromNotification, onReceived: reloadOnArrival });

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

  /** Called when "Add" is pressed on CreatorDashboard's Collected Today card */
  const handleOpenLogPayment = () => setScreen('log-payment');

  /** Called when a payment is successfully logged on LogPaymentPage */
  const handlePaymentSaved = () => setScreen('dashboard');

  /** Called when the "Schedule" tab is pressed on CreatorDashboard */
  const [scheduleFocusDate, setScheduleFocusDate] = useState<string | null>(null);
  const handleOpenSchedule = (focusDateKey?: string) => {
    setScheduleFocusDate(focusDateKey ?? null);
    setScreen('schedule');
  };

  /** Called when a job card is pressed on CreatorDashboard */
  const handleOpenMyWork = () => {
    setMyWorkTab('active');
    setScreen('my-work');
  };

  /** Called when "View All" is pressed on CreatorDashboard's Client Feedback - feedback lives under each completed job */
  const handleOpenCompletedWork = () => {
    setMyWorkTab('completed');
    setScreen('my-work');
  };

  /** Called when "Rejected Submissions" is pressed in the side menu */
  const handleOpenRejectedWork = () => setScreen('rejected-work');

  /** Called when "Rejected Applications" is pressed in the side menu, or the rejected link on My Applications */
  const handleOpenRejectedApplications = () => setScreen('rejected-applications');

  /** Called when "View & Edit" is pressed on a card in RejectedWorkPage */
  const handleEditRejectedWork = (jobId: string, title: string, elderName: string, location: string | null) => {
    setSelectedJobId(jobId);
    setSelectedJobTitle(title);
    setSelectedJobElderName(elderName);
    setSelectedJobLocation(location);
    setScreen('continue-work');
  };

  /** Called when "Continue Work" is pressed on a card in MyWorkList */
  const handleContinueWork = (jobId: string, title: string, elderName: string, location: string | null) => {
    setSelectedJobId(jobId);
    setSelectedJobTitle(title);
    setSelectedJobElderName(elderName);
    setSelectedJobLocation(location);
    setScreen('continue-work');
  };

  /** Called when back arrow is pressed on ContinueMyWorkPage */
  const handleBackToMyWork = () => setScreen('my-work');

  /** Called when "Save As a Draft" is pressed on ContinueMyWorkPage */
  /** After "Save As a Draft": straight to the Saved tab of My Work. */
  const handleOpenSavedDrafts = () => {
    setMyWorkTab('saved');
    setScreen('my-work');
  };

  /** Called when "View Publication" is pressed on a completed job in MyWorkList */
  const handleOpenPublicationPreview = (job: JobResponse) => {
    setPreviewJob(job);
    setScreen('publication-preview');
  };

  /** Called when back arrow is pressed on PaymentHistoryPage */
  const handleBackToDashboard = () => setScreen('dashboard');

  /**
   * Called when the creator application is submitted: the admin decides next, so the creator waits on
   * the status page (which has temporary test buttons for the admin's decision until their screen exists).
   */
  const handleApplicationSubmit = () => setScreen('pending');

  /** Called when "Back to Home" is pressed on the verification pending screen */
  const handleBackToHome = () => setScreen('dashboard');


  /** The creator app bar (with its side menu) shown above the shared messaging screens. */
  const creatorMenuBar = (
    <CreatorTopAppBar
      variant="menu"
      onOpenMyWork={handleOpenMyWork}
      onOpenSavedApplications={handleOpenSavedApplications}
      onOpenRejectedWork={handleOpenRejectedWork}
    />
  );

  const menuValue = useMemo(
    () => ({ rejectedApplicationsCount, rejectedWorkCount, onOpenRejectedApplications: handleOpenRejectedApplications }),
    [rejectedApplicationsCount, rejectedWorkCount],
  );

  return (
    <CreatorMenuContext.Provider value={menuValue}>
      {screen === 'dashboard' && (
        <CreatorDashboard
          onNavigate={handleNavigate}
          onOpenHistory={handleOpenHistory}
          onOpenSchedule={handleOpenSchedule}
          onOpenMyWork={handleOpenMyWork}
          onOpenCompletedWork={handleOpenCompletedWork}
          onAddPayment={handleOpenLogPayment}
          onOpenSavedApplications={handleOpenSavedApplications}
          onOpenRejectedWork={handleOpenRejectedWork}
        />
      )}
      {screen === 'market' && (
        <OpportunityPage
          onNavigate={handleNavigate}
          onViewDetail={handleViewDetail}
          onOpenMyWork={handleOpenMyWork}
          onOpenSavedApplications={handleOpenSavedApplications}
          onOpenRejectedWork={handleOpenRejectedWork}
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
          onOpenRejectedApplications={handleOpenRejectedApplications}
        />
      )}
      {screen === 'rejected-applications' && (
        <RejectedApplicationsPage
          onNavigate={handleNavigate}
          onBack={handleOpenSavedApplications}
          onViewOpportunity={handleViewOpportunityFromApplication}
          onSeen={reloadApplications}
        />
      )}
      {screen === 'apply' && (
        <BecomeCreatorApplication
          onNavigate={handleNavigate}
          onSubmit={handleApplicationSubmit}
          onOpenMyWork={handleOpenMyWork}
          onOpenSavedApplications={handleOpenSavedApplications}
          onOpenRejectedWork={handleOpenRejectedWork}
        />
      )}
      {screen === 'pending' && (
        <CreatorVerificationUpdatePage
          onBackToHome={handleBackToHome}
          onReapply={() => setScreen('apply')}
          onOpenMyWork={handleOpenMyWork}
          onOpenSavedApplications={handleOpenSavedApplications}
          onOpenRejectedWork={handleOpenRejectedWork}
        />
      )}
      {/* Shared messaging screens (also used by the elder side) — the creator side supplies its own app bar + tabs. */}
      {screen === 'inbox' && (
        <InApp
          insetTop
          header={creatorMenuBar}
          footer={<BottomNavBar activeTab="inbox" onNavigate={handleNavigate} />}
          onOpenConversation={handleOpenConversation}
        />
      )}
      {screen === 'conversation' && selectedConversationId && (
        <InboxMessage
          insetTop
          conversationId={selectedConversationId}
          onBack={handleBackToInbox}
          header={creatorMenuBar}
          footer={<BottomNavBar activeTab="inbox" onNavigate={handleNavigate} />}
        />
      )}
      {screen === 'payment-history' && (
        <PaymentHistoryPage onNavigate={handleNavigate} onBack={handleBackToDashboard} />
      )}
      {screen === 'log-payment' && (
        <LogPaymentPage onNavigate={handleNavigate} onBack={handleBackToDashboard} onSaved={handlePaymentSaved} />
      )}
      {screen === 'profile' && (
        <CreatorProfile
          onNavigate={handleNavigate}
          onOpenMyWork={handleOpenMyWork}
          onOpenSavedApplications={handleOpenSavedApplications}
          onOpenRejectedWork={handleOpenRejectedWork}
        />
      )}
      {screen === 'schedule' && (
        <OpportunitySchedulePage
          focusDate={scheduleFocusDate}
          onNavigate={handleNavigate}
          onBack={handleBackToDashboard}
          onOpenMyWork={handleOpenMyWork}
        />
      )}
      {screen === 'my-work' && (
        <MyWorkList
          onNavigate={handleNavigate}
          onBack={handleBackToDashboard}
          onContinueWork={handleContinueWork}
          onViewPublication={handleOpenPublicationPreview}
          initialTab={myWorkTab}
          onTabChange={setMyWorkTab}
        />
      )}
      {screen === 'continue-work' && (
        <ContinueMyWorkPage
          onNavigate={handleNavigate}
          onBack={handleBackToMyWork}
          onSaveDraft={handleOpenSavedDrafts}
          jobId={selectedJobId}
          jobTitle={selectedJobTitle}
          elderName={selectedJobElderName}
          location={selectedJobLocation}
        />
      )}
      {screen === 'rejected-work' && (
        <RejectedWorkPage
          onNavigate={handleNavigate}
          onBack={handleBackToDashboard}
          onEditWork={handleEditRejectedWork}
          onSeen={reloadRejectedWork}
        />
      )}
      {screen === 'publication-preview' && previewJob && (
        <PublicationPreviewPage job={previewJob} onNavigate={handleNavigate} onBack={handleBackToMyWork} />
      )}
    </CreatorMenuContext.Provider>
  );
};

export default CreatorNavigator;
