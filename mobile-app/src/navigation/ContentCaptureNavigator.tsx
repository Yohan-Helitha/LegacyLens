import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ElderDashboard } from '../screens/content-capture/elder_dashboard';
import { RecordMethodSelect } from '../screens/content-capture/record_method_select';
import { RecordPrompt } from '../screens/content-capture/record_prompt';
import { RecordCapture } from '../screens/content-capture/record_capture';
import type { RecordedClip } from '../screens/content-capture/record_capture';
import { StoryDetails } from '../screens/content-capture/story_details';
import type { StoryDraft } from '../screens/content-capture/story_details';
import { StoryReview } from '../screens/content-capture/story_review';
import { YourStories } from '../screens/content-capture/your_stories';
import { storiesApi } from '../services/api/storiesApi';
import { useAuthStore } from '../store/authStore';
import type { StoryResponse } from '../types/story';
import type { RootStackParamList } from './RootNavigator';

type Step = 'dashboard' | 'method' | 'prompt' | 'capture' | 'details' | 'stories' | 'review';
type ClipSource = 'recorded' | 'uploaded';
/** Which step "back"/"deleted" from the review screen should return to */
type ReviewOrigin = 'dashboard' | 'stories';

interface ContentCaptureNavigatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Elder content-capture flow — landing dashboard plus the record-a-story
 * chain (choose method → prompt → live capture → review & save). Nested as
 * a single 'ContentCapture' route, same pattern as CreatorNavigator.
 * Reached today from the "Become a Storyteller" onboarding hand-off.
 */
export const ContentCaptureNavigator: React.FC<ContentCaptureNavigatorProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<Step>('dashboard');
  const [clip, setClip] = useState<RecordedClip | null>(null);
  const [clipSource, setClipSource] = useState<ClipSource>('recorded');
  const [reviewStory, setReviewStory] = useState<StoryResponse | null>(null);
  const [reviewOrigin, setReviewOrigin] = useState<ReviewOrigin>('dashboard');

  const openReview = (story: StoryResponse, origin: ReviewOrigin) => {
    setReviewStory(story);
    setReviewOrigin(origin);
    setStep('review');
  };

  const handleTabPress = (tab: 'home' | 'learn' | 'market' | 'map' | 'profile') => {
    if (tab === 'learn') navigation.navigate('Learning');
    if (tab === 'market') navigation.navigate('Creator');
    if (tab === 'profile') navigation.replace('User');
    // 'map' has no elder-facing equivalent yet and 'home' is already the
    // dashboard's own tab — both are no-ops here.
  };

  const handleLogout = () => {
    useAuthStore.getState().clearSession();
    navigation.replace('Login');
  };

  /** Opens the system file picker for an audio or video file — used by the Writing form's upload field. */
  const pickMediaFromDevice = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*', 'video/*'] });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const kind: 'audio' | 'video' = asset.mimeType?.startsWith('video/') ? 'video' : 'audio';
    setClip({ uri: asset.uri, durationMillis: 0, kind, mimeType: asset.mimeType, fileName: asset.name });
    setClipSource('uploaded');
  };

  const saveStory = async (draft: StoryDraft) => {
    const clipToSave = draft.clip;
    await storiesApi.create({
      title: draft.title,
      description: draft.description || undefined,
      method: clipSource === 'uploaded' ? 'UPLOADED' : 'RECORDED',
      mediaDurationMillis: clipToSave?.durationMillis,
      media: clipToSave
        ? {
            uri: clipToSave.uri,
            name: clipToSave.fileName ?? (clipToSave.kind === 'video' ? 'video.mp4' : 'voice.m4a'),
            type: clipToSave.mimeType ?? (clipToSave.kind === 'video' ? 'video/mp4' : 'audio/m4a'),
          }
        : null,
    });
    setClip(null);
    setStep('dashboard');
  };

  return (
    <>
      {step === 'dashboard' && (
        <ElderDashboard
          onRecordStory={() => setStep('method')}
          onViewAllStories={() => setStep('stories')}
          onReviewStory={(story) => openReview(story, 'dashboard')}
          onDrawerNavigate={(item) => {
            if (item === 'stories') setStep('stories');
          }}
          onTabPress={handleTabPress}
          onLogout={handleLogout}
        />
      )}

      {step === 'stories' && (
        <YourStories
          onReviewStory={(story) => openReview(story, 'stories')}
          onDrawerNavigate={(item) => {
            if (item === 'home') setStep('dashboard');
          }}
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
        <RecordMethodSelect
          onBack={() => setStep('dashboard')}
          onSelectVoiceVideo={() => setStep('prompt')}
          onSelectWriting={() => {
            setClip(null);
            setClipSource('uploaded');
            setStep('details');
          }}
        />
      )}

      {step === 'prompt' && (
        <RecordPrompt
          onMenuPress={() => setStep('dashboard')}
          onStartRecording={() => setStep('capture')}
        />
      )}

      {step === 'capture' && (
        <RecordCapture
          onClose={() => setStep('dashboard')}
          onFinish={(result) => {
            setClip(result);
            setClipSource('recorded');
            setStep('details');
          }}
        />
      )}

      {step === 'details' && (
        <StoryDetails
          clip={clip}
          clipSource={clipSource}
          onBack={() => setStep(clipSource === 'uploaded' ? 'method' : 'capture')}
          onRerecord={() => {
            setClip(null);
            if (clipSource === 'uploaded') {
              pickMediaFromDevice();
            } else {
              setStep('capture');
            }
          }}
          onRemoveClip={() => setClip(null)}
          onPickMedia={pickMediaFromDevice}
          onDiscard={() => {
            setClip(null);
            setStep('dashboard');
          }}
          onSave={saveStory}
        />
      )}
    </>
  );
};

export default ContentCaptureNavigator;
