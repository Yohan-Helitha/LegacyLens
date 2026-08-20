// src/screens/learning/DevPreviewScreen.tsx
// TEMPORARY dev-only screen for quickly jumping to any Learning Engine screen
// while testing. Not part of the real app flow — remove before final submission.
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList>;

const SCREENS: { label: string; route: keyof LearningStackParamList; params?: any }[] = [
  { label: 'Course Tracks List', route: 'CourseTracksList' },
  { label: 'Track Detail', route: 'TrackDetail', params: { trackId: 'track-1' } },
  { label: 'Flashcard', route: 'Flashcard', params: { lessonId: 'lesson-1' } },
  { label: 'Quiz', route: 'Quiz', params: { lessonId: 'lesson-2' } },
  { label: 'Quiz Result', route: 'QuizResult' },
  { label: 'Progress Tracking', route: 'ProgressTracking' },
  { label: 'Badges & Streaks', route: 'BadgesStreaks' },
  { label: 'Certificate', route: 'Certificate', params: { trackId: 'track-1' } },
];

export default function DevPreviewScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.header}>🧪 Dev Preview — Learning Screens</Text>
      {SCREENS.map((s) => (
        <Pressable
          key={s.route}
          style={styles.button}
          onPress={() => navigation.navigate(s.route as any, s.params)}
        >
          <Text style={styles.buttonText}>{s.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC' },
  header: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#3E2723' },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#3E2723' },
});