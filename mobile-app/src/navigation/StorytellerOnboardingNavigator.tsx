import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContentPreferencesScreen } from '../screens/onboarding/storyteller/ContentPreferencesScreen';
import type { StorytellerPreferences } from '../screens/onboarding/storyteller/ContentPreferencesScreen';
import { VerifyOtpScreen } from '../screens/auth/verify_otp';
import { storytellerApi } from '../services/api/storytellerApi';
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
 * OTP confirmation is the only verification step — there's no separate
 * admin review, matching POST /api/users/me/storyteller/**.
 */
export const StorytellerOnboardingNavigator: React.FC<StorytellerOnboardingNavigatorProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<Step>('preferences');
  const [preferences, setPreferences] = useState<StorytellerPreferences | null>(null);
  const phone = useAuthStore((s) => s.user?.phoneNumber);

  const requestOtp = (data: StorytellerPreferences) =>
    storytellerApi.requestUpgrade({
      contentTypes: data.contentTypes,
      topics: data.topics,
      otherTopic: data.otherTopic || undefined,
    });

  return (
    <>
      {step === 'preferences' && (
        <ContentPreferencesScreen
          onBack={() => navigation.goBack()}
          onContinue={async (data) => {
            await requestOtp(data);
            setPreferences(data);
            setStep('otp');
          }}
        />
      )}

      {step === 'otp' && (
        <VerifyOtpScreen
          phone={phone}
          onSubmit={async (code) => {
            const response = await storytellerApi.confirmUpgrade({ otpCode: code });
            // Role claims changed (GENERAL_USER -> +ELDER) — the old token
            // no longer reflects reality, so swap in the fresh one now.
            useAuthStore.getState().setSession(response.token, {
              userId: response.userId,
              fullName: response.fullName,
              phoneNumber: response.phoneNumber,
              roles: response.roles,
            });
          }}
          onResend={async () => {
            if (preferences) {
              await requestOtp(preferences);
            }
          }}
          onComplete={() => navigation.replace('ContentCapture')}
          onBack={() => setStep('preferences')}
        />
      )}
    </>
  );
};

export default StorytellerOnboardingNavigator;
