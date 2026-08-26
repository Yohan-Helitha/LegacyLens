// src/screens/learning/TrackDetailScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api/client';
import { Track, Lesson } from '../../types/learning';
const CURRENT_TRACK_ID = 'track-1';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'TrackDetail'>;

export default function TrackDetailScreen() {

  
  const route = useRoute<RouteProp<LearningStackParamList, 'TrackDetail'>>();
  console.log('SELECTED TRACK ID:', route.params.trackId);
  const navigation = useNavigation<NavigationProp>();

  const [track, setTrack] = useState<Track | null>(null);
const [lessons, setLessons] = useState<Lesson[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadTrack = async () => {
    try {
      const trackId = route.params.trackId;

      const trackData = await apiGet<Track>(
            `/learning/tracks/${trackId}`
          );

          const lessonsData = await apiGet<Lesson[]>(
            `/learning/tracks/${trackId}/lessons`
          );

          setTrack(trackData);
          setLessons(lessonsData);
        } catch (error) {
          console.error('Failed to load track:', error);
        } finally {
          setLoading(false);
        }
      };

      loadTrack();
    }, [route.params.trackId]);

  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Track not found.</Text>
      </View>
    );
  }

  const completedLessons = track.completedLessons ?? 0;

const progressPercent =
  track.totalLessons === 0
    ? 0
    : Math.round((completedLessons / track.totalLessons) * 100);

  const statusLabel = (status: Lesson['status']) => {
    if (status === 'completed') return '✓ Completed';
    if (status === 'in_progress') return '▶ In Progress';
    return '🔒 Locked';
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <Pressable
      style={styles.lessonRow}
      onPress={() =>
        item.type.toLowerCase() === 'quiz'
          ? navigation.navigate('Quiz', { lessonId: item.id })
          : navigation.navigate('Flashcard', { lessonId: item.id })
      }
    >
      <View style={{ flex: 1 }} >
        <Text style={styles.lessonTitle}>{item.title}</Text>
        <Text style={styles.lessonType}>{item.type}</Text>
      </View>
      <Text style={styles.lessonStatus}>{statusLabel(item.status)}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{track.title}</Text>
      <View style={styles.tagsRow}>
        <Text style={styles.tag}>{track.region}</Text>
        <Text style={styles.tag}>{track.occupation}</Text>
        <Text style={[styles.tag, styles.difficultyTag]}>{track.difficulty}</Text>
      </View>

      <Text style={styles.description}>{track.description}</Text>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {completedLessons} of {track.totalLessons} lessons completed · {progressPercent}%
      </Text>

      <Text style={styles.sectionTitle}>Lessons</Text>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        contentContainerStyle={styles.list}
      />

      <Pressable
        style={styles.continueButton}
        onPress={() => navigation.navigate('Flashcard', { lessonId: lessons[0]?.id ?? '' })}
      >
        <Text style={styles.continueButtonText}>Continue Learning</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL - 2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm + 4 },
  tag: {
    backgroundColor: Colors.secondarySubtle,
    color: Colors.secondary,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  difficultyTag: { backgroundColor: Colors.accentSubtle, color: Colors.accent },
  description: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.sm + 6,
  },
  progressBarBackground: { height: 8, backgroundColor: Colors.surface, borderRadius: Radii.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radii.sm },
  progressText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  list: { paddingBottom: Spacing.sm + 4 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm + 2,
  },
  lessonTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.text },
  lessonType: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  lessonStatus: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: Colors.textMuted },
  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg - 4,
  },
  continueButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});