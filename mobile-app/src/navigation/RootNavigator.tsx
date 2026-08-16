import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingScreen } from '../screens/onboarding/loading/LoadingScreen';
import { LanguageSelectionScreen } from '../screens/onboarding/loading/Language';
import { LoginScreen } from '../screens/auth/login_user';
import { SignUpScreen } from '../screens/auth/signup_user';
import { SetPhotoScreen } from '../screens/auth/set_photo';
import { SetPinScreen } from '../screens/auth/set_pin';
import { OnBoarding1 } from '../screens/onboarding/weolcome/OnBoarding1';
import { OnBoarding2 } from '../screens/onboarding/weolcome/OnBoarding2';
import { OnBoarding3 } from '../screens/onboarding/weolcome/OnBoarding3';

export type RootStackParamList = {
  Loading: undefined;
  Language: undefined;
  Login: undefined;
  SignUp: undefined;
  SetPhoto: undefined;
  SetPin: undefined;
  OnBoarding1: undefined;
  OnBoarding2: undefined;
  OnBoarding3: undefined;
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
          <LoadingScreen onFinish={() => navigation.replace('Login')} />
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
            onForgotPin={() => navigation.navigate('SignUp')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            onSetPhoto={() => navigation.navigate('SetPhoto')}
            onLogin={() => navigation.navigate('Login')}
            onSignUpSuccess={() => navigation.navigate('SetPhoto')}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SetPhoto">
        {({ navigation }) => (
          <SetPhotoScreen
            onContinue={() => navigation.navigate('SetPin')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="SetPin">
        {({ navigation }) => (
          <SetPinScreen
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
