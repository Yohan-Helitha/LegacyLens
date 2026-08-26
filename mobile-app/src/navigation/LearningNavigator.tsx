// src/navigation/LearningNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DevPreviewScreen from '../screens/learning/DevPreviewScreen';
import CourseTracksListScreen from '../screens/learning/CourseTracksListScreen';
import TrackDetailScreen from '../screens/learning/TrackDetailScreen';
import FlashcardScreen from '../screens/learning/FlashcardScreen';
import QuizScreen from '../screens/learning/QuizScreen';
import QuizResultScreen from '../screens/learning/QuizResultScreen';
import ProgressTrackingScreen from '../screens/learning/ProgressTrackingScreen';
import BadgesStreaksScreen from '../screens/learning/BadgesStreaksScreen';
import CertificateScreen from '../screens/learning/CertificateScreen';

// Defines all the Learning Engine screens and what params each one takes.
export type LearningStackParamList = {
  CourseTracksList: undefined;
  TrackDetail: { trackId: string };
  Flashcard: { lessonId: string };
  Quiz: { lessonId: string };
  QuizResult: undefined;
  ProgressTracking: undefined;
  BadgesStreaks: undefined;
  Certificate: { trackId: string };
  DevPreview: undefined;
};

const Stack = createNativeStackNavigator<LearningStackParamList>();

export default function LearningNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseTracksList" component={CourseTracksListScreen} />
      <Stack.Screen name="DevPreview" component={DevPreviewScreen} />
      
      <Stack.Screen name="TrackDetail" component={TrackDetailScreen} />
      <Stack.Screen name="Flashcard" component={FlashcardScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="ProgressTracking" component={ProgressTrackingScreen} />
      <Stack.Screen name="BadgesStreaks" component={BadgesStreaksScreen} />
      <Stack.Screen name="Certificate" component={CertificateScreen} />
    </Stack.Navigator>
  );
}