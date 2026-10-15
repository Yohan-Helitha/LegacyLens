import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ElderDashboard } from '../screens/content-capture/elder_dashboard';
import { ChooseCaptureMethodScreen } from '../screens/content-capture/ChooseCaptureMethodScreen';
import { AudioRecordingScreen } from '../screens/content-capture/AudioRecordingScreen';
import { VideoRecordingScreen } from '../screens/content-capture/VideoRecordingScreen';
import { VoiceTypingScreen } from '../screens/content-capture/VoiceTypingScreen';
import { ContentFormScreen } from '../screens/content-capture/ContentFormScreen';
import { PostHireRequestScreen } from '../screens/content-capture/PostHireRequestScreen';
import { MyHireRequestsScreen } from '../screens/content-capture/MyHireRequestsScreen';
import { ApplicantReviewScreen } from '../screens/content-capture/ApplicantReviewScreen';
import { InApp, InboxMessage } from '../screens/messaging';
import { ApplicationDetailScreen } from '../screens/content-capture/ApplicationDetailScreen';
import { SubmittedWorkScreen } from '../screens/content-capture/SubmittedWorkScreen';
import { WorkDetailScreen } from '../screens/content-capture/WorkDetailScreen';
import { usePushNotificationEvents } from '../hooks/usePushNotifications';
import { Header, UserFooter } from '../components/common';
import { useTranslation } from 'react-i18next';
import { CreatorRecommendationsScreen } from '../screens/content-capture/CreatorRecommendationsScreen';
import { YourStories } from '../screens/content-capture/your_stories';
import type { StoriesTab } from '../screens/content-capture/your_stories';
import { StoryAnalytics } from '../screens/content-capture/story_analytics';
import { TrustScoreDetail } from '../screens/content-capture/trust_score_detail';
import { ReviewsRatingsScreen } from '../screens/content-capture/ReviewsRatingsScreen';
import { useStoryDraft } from '../hooks/useStoryDraft';
import type { HireRequestVoiceNote } from '../hooks/usePostHireRequest';
import { useAuthStore } from '../store/authStore';
import type { ElderDrawerItem } from '../components/module-specific/content-capture';
import type { HireRequestItem } from '../hooks/useHireRequests';
import type { StoryMediaType } from '../types/story';
import type { RootStackParamList } from './RootNavigator';

type Step =
  | 'dashboard'
  | 'method'
  | 'audioRecording'
  | 'videoRecording'
  | 'voiceTyping'
  | 'form'
  | 'stories'
  | 'storyAnalytics'
  | 'trustScore'
  | 'reviews'
  | 'hirePost'
  | 'hirePostRecording'
  | 'hireRequests'
  | 'hireApplicants'
  | 'hireRecommendations'
  | 'inbox'
  | 'chat'
  | 'applicationDetail'
  | 'submittedWork'
  | 'workDetail';

/** Which step "back"/"deleted" from the story form, or a cancelled create, should return to. */
type ReturnOrigin = 'dashboard' | 'stories';

interface ContentCaptureNavigatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Elder content-capture flow — landing dashboard plus the record-a-story
 * chain (choose method → record → form) and the shared ContentFormScreen
 * used for both creating new content and editing an existing
 * DRAFT/REJECTED story. Nested as a single 'ContentCapture' route, same
 * pattern as CreatorNavigator. Reached today from the "Become a
 * Storyteller" onboarding hand-off.
 *
 * Also hosts the Hire a Creator flow (post a request → My Requests →
 * applicant review / creator conversation), reached from the side drawer.
 */
export const ContentCaptureNavigator: React.FC<ContentCaptureNavigatorProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<Step>('dashboard');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formStoryId, setFormStoryId] = useState<string | undefined>(undefined);
  const [formOrigin, setFormOrigin] = useState<ReturnOrigin>('dashboard');
  /** My Stories' selected tab, kept here because opening a story's analytics unmounts that screen. */
  const [storiesTab, setStoriesTab] = useState<StoriesTab>('inProgress');
  const [analyticsStoryId, setAnalyticsStoryId] = useState<string | undefined>(undefined);
  /** Where the X/close on a recording screen should return to — 'form' when reached via "Re-record" on an in-progress draft, 'dashboard' when starting fresh. */
  const [recordingCloseTarget, setRecordingCloseTarget] = useState<Step>('dashboard');

  /** Hire flow: shows the "we're reviewing it" banner on My Requests right after posting. */
  const [hireJustPosted, setHireJustPosted] = useState(false);
  /**
   * Screen 8's in-progress title and voice note both live here, not inside
   * PostHireRequestScreen itself — recording the Details clip means leaving
   * that screen entirely (for AudioRecordingScreen) and coming back, which
   * unmounts it and would reset any state kept locally there. (The title
   * field used to live in local state and lost whatever the elder had
   * typed/dictated on that exact round trip — this is the fix.)
   */
  const [hirePostTitle, setHirePostTitle] = useState('');
  const [hirePostVoiceNote, setHirePostVoiceNote] = useState<HireRequestVoiceNote | null>(null);
  /** The "I understand the 1-hour deletion window" checkbox — lifted for the same reason as title/voiceNote above. */
  const [hirePostAcknowledged, setHirePostAcknowledged] = useState(false);
  const [applicantsRequest, setApplicantsRequest] = useState<{ id: string; title: string } | null>(null);
  /** Messaging with creators: which chat is open, and the step "back" from it returns to. */
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatReturn, setChatReturn] = useState<Step>('inbox');
  /** The creator application / submitted job the elder is looking at (each has its own screen). */
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [workJobId, setWorkJobId] = useState<string | null>(null);

  /** A fresh visit to Screen 8 starts a clean request — a title/clip left over from an abandoned one shouldn't silently reappear. */
  const startFreshHireRequest = () => {
    setHirePostTitle('');
    setHirePostVoiceNote(null);
    setHirePostAcknowledged(false);
    setStep('hirePost');
  };

  const { t: tc } = useTranslation('contentCapture');
  const { startNewDraft, setMediaUri, setTranscript } = useStoryDraft();

  const openChat = (conversationId: string, origin: Step) => {
    setChatId(conversationId);
    setChatReturn(origin);
    setStep('chat');
  };

  // What a tapped notification opens: a new message opens that chat, a new application opens it for review,
  // and newly submitted work opens its review screen. Anything else just opens the app where it is.
  const openFromNotification = useCallback((data: Record<string, unknown>) => {
    if (data.type === 'new-message' && typeof data.conversationId === 'string') {
      setChatId(data.conversationId);
      setChatReturn('inbox');
      setStep('chat');
    } else if (data.type === 'application-received' && typeof data.applicationId === 'string') {
      setApplicationId(data.applicationId);
      setStep('applicationDetail');
    } else if (data.type === 'work-submitted' && typeof data.jobId === 'string') {
      setWorkJobId(data.jobId);
      setStep('workDetail');
    }
  }, []);
  usePushNotificationEvents({ onTapped: openFromNotification });

  // Hardware back inside the hire flow steps back through it instead of leaving the whole module.
  useEffect(() => {
    const target: Partial<Record<Step, Step>> = {
      storyAnalytics: 'stories',
      hirePost: 'dashboard',
      hirePostRecording: 'hirePost',
      hireRequests: 'dashboard',
      hireApplicants: 'hireRequests',
      hireRecommendations: 'dashboard',
      inbox: 'dashboard',
      chat: chatReturn,
      applicationDetail: 'hireRequests',
      submittedWork: 'dashboard',
      workDetail: 'submittedWork',
    };
    const previous = target[step];
    if (!previous) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(previous);
      return true;
    });
    return () => subscription.remove();
  }, [step, chatReturn]);

  /** Every existing story opens in the shared form — it locks itself read-only for PUBLISHED/ARCHIVED. */
  const openStory = (storyId: string, origin: ReturnOrigin) => {
    setFormMode('edit');
    setFormStoryId(storyId);
    setFormOrigin(origin);
    setStep('form');
  };

  const beginNewStory = (origin: ReturnOrigin) => {
    setFormMode('create');
    setFormStoryId(undefined);
    setFormOrigin(origin);
    setRecordingCloseTarget('dashboard');
    setStep('method');
  };

  const handleTabPress = (tab: 'home' | 'learn' | 'market' | 'map' | 'profile') => {
    if (tab === 'learn') navigation.navigate('Learning');
    if (tab === 'market') navigation.navigate('Creator');
    if (tab === 'profile') navigation.replace('User');
    // 'map' has no elder-facing equivalent yet and 'home' is already the
    // dashboard's own tab — both are no-ops here.
  };

  /** Every elder drawer item that has a screen inside this navigator — shared so each screen's drawer behaves the same. */
  const handleDrawerNavigate = (item: ElderDrawerItem) => {
    if (item === 'home') setStep('dashboard');
    if (item === 'stories') setStep('stories');
    if (item === 'trust') setStep('trustScore');
    if (item === 'reviews') setStep('reviews');
    // "Hire a Creator" shows the creators recommended for each of the elder's
    // open opportunities; posting a new request lives under My Requests.
    if (item === 'hire') setStep('hireRecommendations');
    if (item === 'myRequests') {
      setHireJustPosted(false);
      setStep('hireRequests');
    }
    if (item === 'submittedWork') setStep('submittedWork');
    // "Requests" is the elder's messages with creators.
    if (item === 'requests') setStep('inbox');
    // 'voiceHelp' and 'settings' have no screen yet.
  };

  const handleLogout = () => {
    useAuthStore.getState().clearSession();
    navigation.replace('Login');
  };

  const handleSelectMethod = (mediaType: StoryMediaType | null) => {
    startNewDraft(mediaType);
    setRecordingCloseTarget('dashboard');
    if (mediaType === 'AUDIO') setStep('audioRecording');
    else if (mediaType === 'VIDEO') setStep('videoRecording');
    else setStep('voiceTyping');
  };

  const handleRerecord = (mediaType: StoryMediaType) => {
    setRecordingCloseTarget('form');
    setStep(mediaType === 'AUDIO' ? 'audioRecording' : 'videoRecording');
  };

  return (
    <>
      {step === 'dashboard' && (
        <ElderDashboard
          onRecordStory={() => beginNewStory('dashboard')}
          onViewAllStories={() => setStep('stories')}
          onOpenAnalytics={() => {
            setStoriesTab('published');
            setStep('stories');
          }}
          onOpenStory={(storyId) => openStory(storyId, 'dashboard')}
          onOpenPublishedStory={(storyId) => {
            setAnalyticsStoryId(storyId);
            setStep('storyAnalytics');
          }}
          onOpenTrustScore={() => setStep('trustScore')}
          onOpenChat={(conversationId) => openChat(conversationId, 'dashboard')}
          onOpenMessages={() => setStep('inbox')}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'stories' && (
        <YourStories
          onOpenStory={(storyId) => openStory(storyId, 'stories')}
          onOpenPublishedStory={(storyId) => {
            setAnalyticsStoryId(storyId);
            setStep('storyAnalytics');
          }}
          initialTab={storiesTab}
          onTabChange={setStoriesTab}
          onNewStory={() => beginNewStory('stories')}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'storyAnalytics' && !!analyticsStoryId && (
        <StoryAnalytics
          storyId={analyticsStoryId}
          onBack={() => setStep('stories')}
          onTabPress={handleTabPress}
        />
      )}

      {step === 'trustScore' && (
        <TrustScoreDetail
          onOpenReviews={() => setStep('reviews')}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'reviews' && (
        <ReviewsRatingsScreen
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'method' && (
        <ChooseCaptureMethodScreen
          onBack={() => setStep(formOrigin)}
          onSelectMethod={handleSelectMethod}
        />
      )}

      {step === 'audioRecording' && (
        <AudioRecordingScreen
          onClose={() => setStep(recordingCloseTarget)}
          onFinish={({ uri, durationMillis }) => {
            setMediaUri(uri, durationMillis);
            setStep('form');
          }}
        />
      )}

      {step === 'videoRecording' && (
        <VideoRecordingScreen
          onClose={() => setStep(recordingCloseTarget)}
          onFinish={({ uri, durationMillis }) => {
            setMediaUri(uri, durationMillis);
            setStep('form');
          }}
        />
      )}

      {step === 'voiceTyping' && (
        <VoiceTypingScreen
          onClose={() => setStep('dashboard')}
          onFinish={(transcript) => {
            setTranscript(transcript);
            setStep('form');
          }}
        />
      )}

      {step === 'form' && (
        <ContentFormScreen
          mode={formMode}
          storyId={formStoryId}
          onBack={() => setStep(formOrigin)}
          onSaved={() => setStep('stories')}
          onDeleted={() => setStep(formOrigin)}
          onRerecord={handleRerecord}
        />
      )}

      {step === 'hirePost' && (
        <PostHireRequestScreen
          title={hirePostTitle}
          onTitleChange={setHirePostTitle}
          voiceNote={hirePostVoiceNote}
          onRecordVoiceNote={() => setStep('hirePostRecording')}
          acknowledged={hirePostAcknowledged}
          onAcknowledgedChange={setHirePostAcknowledged}
          onSubmitted={() => {
            setHirePostTitle('');
            setHirePostVoiceNote(null);
            setHirePostAcknowledged(false);
            setHireJustPosted(true);
            setStep('hireRequests');
          }}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'hirePostRecording' && (
        <AudioRecordingScreen
          onClose={() => setStep('hirePost')}
          onFinish={({ uri, durationMillis }) => {
            setHirePostVoiceNote({ uri, durationMillis });
            setStep('hirePost');
          }}
        />
      )}

      {step === 'hireRequests' && (
        <MyHireRequestsScreen
          justPosted={hireJustPosted}
          onPostRequest={startFreshHireRequest}
          onViewApplicants={(request: HireRequestItem) => {
            setApplicantsRequest({ id: request.id, title: request.title });
            setStep('hireApplicants');
          }}
          onMessageCreator={() => setStep('inbox')}
          onOpenApplication={(id) => {
            setApplicationId(id);
            setStep('applicationDetail');
          }}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'hireApplicants' && applicantsRequest && (
        <ApplicantReviewScreen
          jobRequestId={applicantsRequest.id}
          jobTitle={applicantsRequest.title}
          onBack={() => setStep('hireRequests')}
          onCreatorChosen={() => {
            setHireJustPosted(false);
            setStep('hireRequests');
          }}
        />
      )}

      {step === 'hireRecommendations' && (
        <CreatorRecommendationsScreen
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'inbox' && (
        <InApp
          header={<Header title={tc('inbox.headerTitle')} showBack onBackPress={() => setStep('dashboard')} />}
          footer={<UserFooter activeTab="home" onTabSelect={handleTabPress} />}
          onOpenConversation={(conversationId) => openChat(conversationId, 'inbox')}
        />
      )}

      {step === 'chat' && !!chatId && (
        <InboxMessage
          conversationId={chatId}
          onBack={() => setStep(chatReturn)}
          header={<Header title={tc('inbox.headerTitle')} showBack onBackPress={() => setStep(chatReturn)} />}
        />
      )}
      {step === 'applicationDetail' && !!applicationId && (
        <ApplicationDetailScreen
          applicationId={applicationId}
          onBack={() => setStep('hireRequests')}
          onOpenChat={(conversationId) => openChat(conversationId, 'applicationDetail')}
        />
      )}

      {step === 'submittedWork' && (
        <SubmittedWorkScreen
          onOpenWork={(jobId) => {
            setWorkJobId(jobId);
            setStep('workDetail');
          }}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'workDetail' && !!workJobId && (
        <WorkDetailScreen
          jobId={workJobId}
          onBack={() => setStep('submittedWork')}
          onOpenChat={(conversationId) => openChat(conversationId, 'workDetail')}
        />
      )}
    </>
  );
};

export default ContentCaptureNavigator;
