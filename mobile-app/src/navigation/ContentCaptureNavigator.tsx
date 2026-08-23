import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ElderDashboard } from '../screens/content-capture/elder_dashboard';
import { RecordMethodSelect } from '../screens/content-capture/record_method_select';
import { RecordPrompt } from '../screens/content-capture/record_prompt';
import { RecordCapture } from '../screens/content-capture/record_capture';
import type { RecordedClip } from '../screens/content-capture/record_capture';
import { StoryDetails } from '../screens/content-capture/story_details';
import type { RootStackParamList } from './RootNavigator';

type Step = 'dashboard' | 'method' | 'prompt' | 'capture' | 'details';

interface ContentCaptureNavigatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Elder content-capture flow — landing dashboard plus the record-a-story
 * chain (choose method → prompt → live capture → review & save). Nested as
 * a single 'ContentCapture' route, same pattern as CreatorNavigator.
 * Reached today from the "Become a Storyteller" onboarding hand-off; the
 * writing method doesn't have a screen yet, so it's left as a no-op back to
 * the dashboard.
 */
export const ContentCaptureNavigator: React.FC<ContentCaptureNavigatorProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<Step>('dashboard');
  const [clip, setClip] = useState<RecordedClip | null>(null);

  return (
    <>
      {step === 'dashboard' && (
        <ElderDashboard
          onRecordStory={() => setStep('method')}
          onTabPress={(tab) => {
            if (tab === 'learn') navigation.navigate('Learning');
            if (tab === 'market') navigation.navigate('Creator');
            if (tab === 'profile') navigation.replace('User');
          }}
        />
      )}

      {step === 'method' && (
        <RecordMethodSelect
          onBack={() => setStep('dashboard')}
          onSelectVoiceVideo={() => setStep('prompt')}
          onSelectWriting={() => setStep('dashboard')}
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
            setStep('details');
          }}
        />
      )}

      {step === 'details' && (
        <StoryDetails
          clip={clip}
          onBack={() => setStep('capture')}
          onRerecord={() => {
            setClip(null);
            setStep('capture');
          }}
          onDiscard={() => {
            setClip(null);
            setStep('dashboard');
          }}
          onSave={() => {
            setClip(null);
            setStep('dashboard');
          }}
        />
      )}
    </>
  );
};

export default ContentCaptureNavigator;
