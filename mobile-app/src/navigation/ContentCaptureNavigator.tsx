import React, { useEffect, useState } from 'react';
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
import { HireConversationScreen } from '../screens/content-capture/HireConversationScreen';
import { StoryReview } from '../screens/content-capture/story_review';
import { YourStories } from '../screens/content-capture/your_stories';
import { TrustScoreDetail } from '../screens/content-capture/trust_score_detail';
import { ReviewsRatingsScreen } from '../screens/content-capture/ReviewsRatingsScreen';
import { storiesApi } from '../services/api/storiesApi';
import { useStoryDraft } from '../hooks/useStoryDraft';
import { useAuthStore } from '../store/authStore';
import type { ElderDrawerItem } from '../components/module-specific/content-capture';
import type { HireRequestItem } from '../hooks/useHireRequests';
import type { StoryMediaType, StoryResponse, StoryStatus } from '../types/story';
import type { RootStackParamList } from './RootNavigator';

type Step =
  | 'dashboard'
  | 'method'
  | 'audioRecording'
  | 'videoRecording'
  | 'voiceTyping'
  | 'form'
  | 'stories'
  | 'review'
  | 'trustScore'
  | 'reviews'
  | 'hirePost'
  | 'hireRequests'
  | 'hireApplicants'
  | 'hireConversation';

/** Only these statuses can be edited — everything else opens as read-only review. */
const isEditableStatus = (status: StoryStatus) => status === 'DRAFT' || status === 'REJECTED';

/** Which step "back"/"deleted" from the review screen, or a cancelled create, should return to. */
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
  const [reviewStory, setReviewStory] = useState<StoryResponse | null>(null);
  const [reviewOrigin, setReviewOrigin] = useState<ReturnOrigin>('dashboard');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formStoryId, setFormStoryId] = useState<string | undefined>(undefined);
  const [formOrigin, setFormOrigin] = useState<ReturnOrigin>('dashboard');
  /** Where the X/close on a recording screen should return to — 'form' when reached via "Re-record" on an in-progress draft, 'dashboard' when starting fresh. */
  const [recordingCloseTarget, setRecordingCloseTarget] = useState<Step>('dashboard');

  /** Hire flow: shows the "we're reviewing it" banner on My Requests right after posting. */
  const [hireJustPosted, setHireJustPosted] = useState(false);
  const [applicantsRequest, setApplicantsRequest] = useState<{ id: string; title: string } | null>(null);
  const [conversation, setConversation] = useState<{ creatorName: string; jobTitle: string } | null>(null);

  const { startNewDraft, setMediaUri, setTranscript } = useStoryDraft();

  // Hardware back inside the hire flow steps back through it instead of leaving the whole module.
  useEffect(() => {
    const target: Partial<Record<Step, Step>> = {
      hirePost: 'dashboard',
      hireRequests: 'dashboard',
      hireApplicants: 'hireRequests',
      hireConversation: 'hireRequests',
    };
    const previous = target[step];
    if (!previous) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(previous);
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  const openReview = (story: StoryResponse, origin: ReturnOrigin) => {
    setReviewStory(story);
    setReviewOrigin(origin);
    setStep('review');
  };

  /** My Stories (Screen 6) only has story ids from the search endpoint's summary rows — fetch the full record before opening it. */
  const openReviewById = async (storyId: string, origin: ReturnOrigin) => {
    const story = await storiesApi.getById(storyId);
    openReview(story, origin);
  };

  /** Routes to the shared edit form for DRAFT/REJECTED stories, or the read-only review screen for everything else. */
  const openStory = (storyId: string, status: StoryStatus, origin: ReturnOrigin) => {
    if (isEditableStatus(status)) {
      setFormMode('edit');
      setFormStoryId(storyId);
      setFormOrigin(origin);
      setStep('form');
    } else {
      openReviewById(storyId, origin);
    }
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
    if (item === 'hire') setStep('hirePost');
    if (item === 'myRequests') {
      setHireJustPosted(false);
      setStep('hireRequests');
    }
    // 'requests' (incoming), 'voiceHelp' and 'settings' have no screen yet.
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
          onReviewStory={(story) => openStory(story.id, story.status, 'dashboard')}
          onOpenTrustScore={() => setStep('trustScore')}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'stories' && (
        <YourStories
          onOpenStory={(storyId, status) => openStory(storyId, status, 'stories')}
          onNewStory={() => beginNewStory('stories')}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
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

      {step === 'review' && reviewStory && (
        <StoryReview
          story={reviewStory}
          onBack={() => setStep(reviewOrigin)}
          onDeleted={() => setStep(reviewOrigin)}
          onTabPress={handleTabPress}
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
          onRerecord={handleRerecord}
        />
      )}

      {step === 'hirePost' && (
        <PostHireRequestScreen
          onSubmitted={() => {
            setHireJustPosted(true);
            setStep('hireRequests');
          }}
          onDrawerNavigate={handleDrawerNavigate}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'hireRequests' && (
        <MyHireRequestsScreen
          justPosted={hireJustPosted}
          onPostRequest={() => setStep('hirePost')}
          onViewApplicants={(request: HireRequestItem) => {
            setApplicantsRequest({ id: request.id, title: request.title });
            setStep('hireApplicants');
          }}
          onMessageCreator={(request: HireRequestItem) => {
            setConversation({
              creatorName: request.assignedCreator?.name ?? '',
              jobTitle: request.title,
            });
            setStep('hireConversation');
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

      {step === 'hireConversation' && conversation && (
        <HireConversationScreen
          creatorName={conversation.creatorName}
          jobTitle={conversation.jobTitle}
          onBack={() => setStep('hireRequests')}
        />
      )}
    </>
  );
};

export default ContentCaptureNavigator;
