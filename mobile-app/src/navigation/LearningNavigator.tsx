import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CourseTracksListScreen from '../screens/learning/CourseTracksListScreen';
import TrackDetailScreen from '../screens/learning/TrackDetailScreen';
import FlashcardScreen from '../screens/learning/FlashcardScreen';
import QuizScreen from '../screens/learning/QuizScreen';
import QuizResultScreen from '../screens/learning/QuizResultScreen';
import ProgressTrackingScreen from '../screens/learning/ProgressTrackingScreen';
import BadgesStreaksScreen from '../screens/learning/BadgesStreaksScreen';
import CertificateScreen from '../screens/learning/CertificateScreen';
import StudyBuilderSelectScreen from '../screens/learning/StudyBuilderSelectScreen';
import StudyBuilderConfigureScreen from '../screens/learning/StudyBuilderConfigureScreen';
import StudyBuilderGenerateScreen from '../screens/learning/StudyBuilderGenerateScreen';
import MyStudySetsScreen from '../screens/learning/MyStudySetsScreen';
import StudySetRetakeScreen from '../screens/learning/StudySetRetakeScreen';
import { WeakWordReviewScreen } from '../screens/learning/WeakWordReviewScreen';
import { CreateStudyJobRequest } from '../types/studyBuilder';

export type LearningStackParamList = {
  CourseTracksList: undefined;

  TrackDetail: {
    trackId: string;
  };

  Flashcard: {
    lessonId: string;
  };

  Quiz: {
    lessonId: string;
  };

  QuizResult: {
    lessonId: string;
    totalQuestions: number;
    correctCount: number;
    xpEarned: number;
    currentStreakDays: number;
  };

  ProgressTracking: undefined;

  BadgesStreaks: undefined;

  Certificate: {
    trackId: string;
  };

  StudyBuilderSelect: undefined;

  StudyBuilderConfigure: {
    selectedSourceIds: string[];
  };

  StudyBuilderGenerate: {
    jobRequest: CreateStudyJobRequest;
  };

  MyStudySets: undefined;

  StudySetRetake: {
    trackId: number;
    title?: string;
  };

  WeakWordReview: undefined;
};

const Stack = createNativeStackNavigator<LearningStackParamList>();

export default function LearningNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CourseTracksList"
        component={CourseTracksListScreen}
      />

      <Stack.Screen
        name="TrackDetail"
        component={TrackDetailScreen}
      />

      <Stack.Screen
        name="Flashcard"
        component={FlashcardScreen}
      />

      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
      />

      <Stack.Screen
        name="QuizResult"
        component={QuizResultScreen}
      />

      <Stack.Screen
        name="ProgressTracking"
        component={ProgressTrackingScreen}
      />

      <Stack.Screen
        name="BadgesStreaks"
        component={BadgesStreaksScreen}
      />

      <Stack.Screen
        name="Certificate"
        component={CertificateScreen}
      />

      <Stack.Screen
        name="StudyBuilderSelect"
        component={StudyBuilderSelectScreen}
      />

      <Stack.Screen
        name="StudyBuilderConfigure"
        component={StudyBuilderConfigureScreen}
      />

      <Stack.Screen
        name="StudyBuilderGenerate"
        component={StudyBuilderGenerateScreen}
      />

      <Stack.Screen
        name="MyStudySets"
        component={MyStudySetsScreen}
      />

      <Stack.Screen
        name="StudySetRetake"
        component={StudySetRetakeScreen}
      />

      <Stack.Screen
        name="WeakWordReview"
        component={WeakWordReviewScreen}
      />
    </Stack.Navigator>
  );
}