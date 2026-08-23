import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContentPreferencesScreen } from '../screens/onboarding/storyteller/ContentPreferencesScreen';
import type { StorytellerPreferences } from '../screens/onboarding/storyteller/ContentPreferencesScreen';
import { VerifyOtpScreen } from '../screens/auth/verify_otp';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from './RootNavigator';

type Step = 'preferences' | 'otp';

interface StorytellerOnboardingNavigatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * "Become a Storyteller" flow, entered from the Profile screen's upgrade
 * card: a couple of preference questions, then phone verification, then a
 * hand-off into the elder content-capture flow. Nested as a single
 * 'StorytellerOnboarding' route — same pattern as CreatorNavigator.
 *
 * There's no backend endpoint yet for storyteller preferences or a
 * dedicated verification purpose, so OTP verification here is stubbed
 * (always succeeds after a short delay) rather than calling authApi.
 */
export const StorytellerOnboardingNavigator: React.FC<StorytellerOnboardingNavigatorProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<Step>('preferences');
  const [preferences, setPreferences] = useState<StorytellerPreferences | null>(null);
  const phone = useAuthStore((s) => s.user?.phoneNumber);

  return (
    <>
      {step === 'preferences' && (
        <ContentPreferencesScreen
          onBack={() => navigation.goBack()}
          onContinue={(data) => {
            setPreferences(data);
            setStep('otp');
          }}
        />
      )}

      {step === 'otp' && (
        <VerifyOtpScreen
          phone={phone}
          onSubmit={async () => {
            // Stub: no verification-purpose endpoint exists yet, so this
            // just simulates the network round trip and always succeeds.
            await new Promise((resolve) => setTimeout(resolve, 700));
          }}
          onResend={async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }}
          onComplete={() => {
            // `preferences` is captured above ready for a real submit call
            // once a backend endpoint exists — for now the flow just hands
            // off to the elder content-capture experience.
            void preferences;
            navigation.replace('ContentCapture');
          }}
          onBack={() => setStep('preferences')}
        />
      )}
    </>
  );
};

export default StorytellerOnboardingNavigator;
