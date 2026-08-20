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
import { authApi } from '../services/api/authApi';

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
            onLoginSuccess={() => navigation.navigate('OnBoarding1')}
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
    </Stack.Navigator>
  );
};

export default RootNavigator;
