// src/screens/learning/TrackDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';
import { Track, Lesson } from '../../types/learning';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'TrackDetail'>;

const LESSON_ICON: Record<string, string> = {
  flashcards: '🗂️',
  quiz: '❓',
  audio: '🔊',
};

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  completed: { color: Colors.secondary, label: '✓ Completed' },
  in_progress: { color: Colors.accent, label: '▶ In Progress' },
  locked: { color: Colors.textMuted, label: '🔒 Locked' },
};

export default function TrackDetailScreen() {
  const route = useRoute<RouteProp<LearningStackParamList, 'TrackDetail'>>();
  const navigation = useNavigation<NavigationProp>();

  const [track, setTrack] = useState<Track | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const trackId = route.params.trackId;

        const [trackData, lessonsData] = await Promise.all([
          apiGet<Track>(`/learning/tracks/${trackId}`),
          apiGet<Lesson[]>(`/learning/tracks/${trackId}/lessons`),
        ]);

        setTrack(trackData);
        setLessons(lessonsData);
      } catch (error: any) {
        console.log('Failed to load track:', error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [route.params.trackId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading track...</Text>
      </View>
    );
  }

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

  const renderLesson = ({ item, index }: { item: Lesson; index: number }) => {
    const status = STATUS_STYLE[item.status ?? 'locked'];
    return (
      <Pressable
        style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonRowPressed]}
        onPress={() =>
          item.type.toLowerCase() === 'quiz'
            ? navigation.navigate('Quiz', { lessonId: item.id })
            : navigation.navigate('Flashcard', { lessonId: item.id })
        }
      >
        <View style={[styles.lessonBadge, { borderColor: status.color }]}>
          <Text style={styles.lessonBadgeIcon}>{LESSON_ICON[item.type.toLowerCase()] ?? '📘'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle}>{item.title}</Text>
          <Text style={styles.lessonType}>{item.type}</Text>
        </View>
        <Text style={[styles.lessonStatus, { color: status.color }]}>{status.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.heroCard}>
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
                <Defs>
                  <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={Colors.secondary} />
                    <Stop offset="1" stopColor={Colors.secondaryDark} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="60" fill="url(#heroGrad)" />
                <Circle cx="94" cy="4" r="24" fill={Colors.accent} opacity={0.18} />
              </Svg>

              <Text style={styles.heroTitle}>{track.title}</Text>
              <View style={styles.tagsRow}>
                <Text style={styles.tag}>📍 {track.region}</Text>
                <Text style={styles.tag}>🛠 {track.occupation}</Text>
                <Text style={[styles.tag, styles.difficultyTag]}>{track.difficulty}</Text>
              </View>
              <Text style={styles.description}>{track.description}</Text>

              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {completedLessons} of {track.totalLessons} lessons completed · {progressPercent}%
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Lessons</Text>
          </>
        }
        ListFooterComponent={
          <>
            {progressPercent >= 100 ? (
              <Pressable
                style={({ pressed }) => [styles.certificateButton, pressed && styles.continueButtonPressed]}
                onPress={() => navigation.navigate('Certificate', { trackId: track.id })}
              >
                <Text style={styles.certificateButtonText}>🎓 View Certificate</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}
              onPress={() => navigation.navigate('Flashcard', { lessonId: lessons[0]?.id ?? '' })}
            >
              <Text style={styles.continueButtonText}>Continue Learning</Text>
            </Pressable>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  list: { paddingBottom: Spacing.lg - 4 },

  heroCard: {
    overflow: 'hidden',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL - 2,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm + 4, flexWrap: 'wrap' },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  difficultyTag: { backgroundColor: Colors.accent },
  description: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.sm + 6,
  },
  progressBarBackground: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radii.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radii.sm },
  progressText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs + 2,
  },

  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.sm + 2,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  lessonRowPressed: { opacity: 0.9 },
  lessonBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonBadgeIcon: { fontSize: 16 },
  lessonTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.text },
  lessonType: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  lessonStatus: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS - 1 },

  certificateButton: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm + 2,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  certificateButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },

  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg - 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  continueButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});