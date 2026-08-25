import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { LoadingScreen } from '../screens/onboarding/loading/LoadingScreen';
import { LanguageSelectionScreen } from '../screens/onboarding/loading/Language';
import { LoginScreen } from '../screens/auth/login_user';
import { SignUpScreen, SignUpDetails } from '../screens/auth/signup_user';
import { SetPhotoScreen } from '../screens/auth/set_photo';
import { SetPinScreen } from '../screens/auth/set_pin';
import { VerifyOtpScreen } from '../screens/auth/verify_otp';
import { FingerprintScreen } from '../screens/auth/fingerprint';
import { ForgotPinScreen } from '../screens/auth/forgot_pin';
import { OnBoarding1 } from '../screens/onboarding/weolcome/OnBoarding1';
import { OnBoarding2 } from '../screens/onboarding/weolcome/OnBoarding2';
import { OnBoarding3 } from '../screens/onboarding/weolcome/OnBoarding3';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { PrivacyDataScreen } from '../screens/profile/PrivacyDataScreen';
import { ChangePhoneScreen } from '../screens/profile/ChangePhoneScreen';
import { ChangeNicScreen } from '../screens/profile/ChangeNicScreen';
import LearningNavigator from './LearningNavigator';
import { CreatorNavigator, CreatorScreen } from './CreatorNavigator';
import { authApi } from '../services/api/authApi';
import { profileApi } from '../services/api/profileApi';
import { useAuthStore } from '../store/authStore';

export type RootStackParamList = {
  Loading: undefined;
  Language: undefined;
  Login: undefined;
  SignUp: undefined;
  // Carried forward from SignUp through SetPhoto to SetPin — the backend
  // requires the PIN as part of registration itself, so the actual
  // POST /api/auth/register call happens once the PIN is confirmed.
  SetPhoto: SignUpDetails;
  SetPin: SignUpDetails;
  VerifyOtp: { phone: string };
  Fingerprint: undefined;
  ForgotPin: undefined;
  ResetVerifyOtp: { phone: string; nic: string };
  ResetSetPin: { phone: string; otpCode: string };
  OnBoarding1: undefined;
  OnBoarding2: undefined;
  OnBoarding3: undefined;
  Profile: undefined;
  PrivacyData: undefined;
  ChangePhone: undefined;
  ChangePhoneVerify: { newPhoneNumber: string };
  ChangeNic: undefined;
  ChangeNicVerify: { newNicNumber: string };
  ChangePin: undefined;
  ChangePinVerify: { pin: string };
  Learning: undefined;
  Creator: { initialScreen?: CreatorScreen } | undefined;
};

/** True only when the device has fingerprint/biometric hardware with at least one enrolled credential. */
const isFingerprintAvailable = async (): Promise<boolean> => {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Loading">
        {({ navigation }) => (
          <LoadingScreen onFinish={() => navigation.replace('Language')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Language">
        {({ navigation }) => (
          <LanguageSelectionScreen onContinue={() => navigation.navigate('Login')} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onLoginSuccess={() => {
              // Already-verified content creators skip the general elder
              // "Become a Freelancer" profile screen (a stopgap from when the
              // elder home experience wasn't built yet) and land directly in
              // their own creator profile instead.
              const roles = useAuthStore.getState().user?.roles ?? [];
              if (roles.includes('YOUTH_CREATOR')) {
                navigation.replace('Creator', { initialScreen: 'profile' });
              } else {
                navigation.replace('Profile');
              }
            }}
            onSignUp={() => navigation.navigate('SignUp')}
            onForgotPin={() => navigation.navigate('ForgotPin')}
            onNeedsVerification={(phone) => navigation.navigate('VerifyOtp', { phone })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            onContinue={(details) => navigation.navigate('SetPhoto', details)}
            onLogin={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SetPhoto">
        {({ navigation, route }) => (
          <SetPhotoScreen
            onContinue={() => navigation.navigate('SetPin', route.params)}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SetPin">
        {({ navigation, route }) => (
          <SetPinScreen
            onSubmit={async (pin) => {
              await authApi.register({
                fullName: route.params.fullName,
                phoneNumber: route.params.phone,
                dateOfBirth: route.params.dateOfBirth,
                nicNumber: route.params.nic,
                cityId: route.params.cityId,
                pin,
              });
            }}
            onComplete={() => navigation.navigate('VerifyOtp', { phone: route.params.phone })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="VerifyOtp">
        {({ navigation, route }) => (
          <VerifyOtpScreen
            phone={route.params.phone}
            onSubmit={async (code) => {
              await authApi.verifyOtp({ phoneNumber: route.params.phone, otpCode: code });
            }}
            onResend={async () => {
              await authApi.resendOtp({ phoneNumber: route.params.phone });
            }}
            onComplete={async () => {
              const canUseFingerprint = await isFingerprintAvailable();
              navigation.navigate(canUseFingerprint ? 'Fingerprint' : 'Login');
            }}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Fingerprint">
        {({ navigation }) => (
          <FingerprintScreen
            onComplete={() => navigation.navigate('Login')}
            onSkip={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      {/* ── Forgot-PIN recovery flow ────────────────────────────────────────── */}
      <Stack.Screen name="ForgotPin">
        {({ navigation }) => (
          <ForgotPinScreen
            onVerified={(details) => navigation.navigate('ResetVerifyOtp', details)}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ResetVerifyOtp">
        {({ navigation, route }) => (
          <VerifyOtpScreen
            phone={route.params.phone}
            onSubmit={async (code) => {
              await authApi.verifyResetOtp({ phoneNumber: route.params.phone, otpCode: code });
            }}
            onResend={async () => {
              // There's no dedicated "resend for PIN reset" endpoint — re-issuing
              // via forgot-pin (same phone+NIC, already confirmed to match) goes
              // through the same OTP cooldown protection and purpose.
              await authApi.forgotPin({
                phoneNumber: route.params.phone,
                nicNumber: route.params.nic,
              });
            }}
            onComplete={(code) =>
              navigation.navigate('ResetSetPin', { phone: route.params.phone, otpCode: code })
            }
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ResetSetPin">
        {({ navigation, route }) => (
          <SetPinScreen
            onSubmit={async (pin) => {
              await authApi.resetPin({
                phoneNumber: route.params.phone,
                otpCode: route.params.otpCode,
                newPin: pin,
                confirmNewPin: pin,
              });
            }}
            onComplete={() => navigation.navigate('Login')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="OnBoarding1">
        {({ navigation }) => (
          <OnBoarding1
            onNext={() => navigation.navigate('OnBoarding2')}
            onSkip={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="OnBoarding2">
        {({ navigation }) => (
          <OnBoarding2
            onNext={() => navigation.navigate('OnBoarding3')}
            onSkip={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="OnBoarding3">
        {({ navigation }) => (
          <OnBoarding3
            onGetStarted={() => navigation.navigate('Login')}
            onSkip={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>

      {/* ── Profile & account security ────────────────────────────────────── */}
      <Stack.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen
            onOpenPrivacyData={() => navigation.navigate('PrivacyData')}
            onLogout={() => {
              useAuthStore.getState().clearSession();
              navigation.replace('Login');
            }}
            onTabPress={(tab) => {
              // Home has no screen yet — Learn, Market, and Profile are real.
              if (tab === 'learn') navigation.navigate('Learning');
              if (tab === 'market') navigation.navigate('Creator');
            }}
            onBecomeFreelancer={() => navigation.navigate('Creator', { initialScreen: 'apply' })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="PrivacyData">
        {({ navigation }) => (
          <PrivacyDataScreen
            onChangePhone={() => navigation.navigate('ChangePhone')}
            onChangeNic={() => navigation.navigate('ChangeNic')}
            onChangePin={() => navigation.navigate('ChangePin')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangePhone">
        {({ navigation }) => (
          <ChangePhoneScreen
            currentPhone={useAuthStore.getState().user?.phoneNumber}
            onSubmit={async (newPhoneNumber) => {
              await profileApi.requestPhoneChange({ newPhoneNumber });
            }}
            onComplete={(newPhoneNumber) =>
              navigation.navigate('ChangePhoneVerify', { newPhoneNumber })
            }
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangePhoneVerify">
        {({ navigation, route }) => (
          <VerifyOtpScreen
            phone={route.params.newPhoneNumber}
            onSubmit={async (code) => {
              await profileApi.confirmPhoneChange({
                newPhoneNumber: route.params.newPhoneNumber,
                otpCode: code,
              });
            }}
            onResend={async () => {
              await profileApi.requestPhoneChange({ newPhoneNumber: route.params.newPhoneNumber });
            }}
            onComplete={() => navigation.navigate('PrivacyData')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangeNic">
        {({ navigation }) => (
          <ChangeNicScreen
            onSubmit={async (newNicNumber) => {
              await profileApi.requestNicChange({ newNicNumber });
            }}
            onComplete={(newNicNumber) => navigation.navigate('ChangeNicVerify', { newNicNumber })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangeNicVerify">
        {({ navigation, route }) => (
          <VerifyOtpScreen
            phone={useAuthStore.getState().user?.phoneNumber}
            onSubmit={async (code) => {
              await profileApi.confirmNicChange({
                newNicNumber: route.params.newNicNumber,
                otpCode: code,
              });
            }}
            onResend={async () => {
              await profileApi.requestNicChange({ newNicNumber: route.params.newNicNumber });
            }}
            onComplete={() => navigation.navigate('PrivacyData')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangePin">
        {({ navigation }) => (
          <SetPinScreen
            variant="change"
            onSubmit={async () => {
              await profileApi.requestPinChange();
            }}
            onComplete={(pin) => navigation.navigate('ChangePinVerify', { pin })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ChangePinVerify">
        {({ navigation, route }) => (
          <VerifyOtpScreen
            phone={useAuthStore.getState().user?.phoneNumber}
            onSubmit={async (code) => {
              await profileApi.confirmPinChange({
                newPin: route.params.pin,
                confirmNewPin: route.params.pin,
                otpCode: code,
              });
            }}
            onResend={async () => {
              await profileApi.requestPinChange();
            }}
            onComplete={() => navigation.navigate('PrivacyData')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      {/* ── Learning Engine ────────────────────────────────────────────────── */}
      <Stack.Screen name="Learning" component={LearningNavigator} />

      {/* ── Creator marketplace ────────────────────────────────────────────── */}
      <Stack.Screen name="Creator">
        {({ route }) => <CreatorNavigator initialScreen={route.params?.initialScreen} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
