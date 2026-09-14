// src/screens/learning/CourseTracksListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Track } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'CourseTracksList'>;

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: Colors.secondary,
  Intermediate: Colors.accent,
  Advanced: Colors.secondaryDark,
};

/** Gradient progress bar fill, mango → teal. */
function GradientProgressFill({ percent }: { percent: number }) {
  return (
    <Svg width={`${Math.max(percent, 2)}%`} height={8}>
      <Defs>
        <LinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={Colors.accent} />
          <Stop offset="1" stopColor={Colors.secondary} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="8" rx="4" fill="url(#progressGrad)" />
    </Svg>
  );
}

export default function CourseTracksListScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await apiGet<Track[]>('/learning/tracks');
        setTracks(data);
      } catch (error: any) {
        console.log('Failed to load learning tracks:', error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  const navigation = useNavigation<NavigationProp>();

  const renderTrack = ({ item }: { item: Track }) => {
    const completed = item.completedLessons ?? 0;
    const progressPercent = item.totalLessons
      ? Math.round((completed / item.totalLessons) * 100)
      : 0;
    const isComplete = progressPercent >= 100;
    const stripeColor = DIFFICULTY_COLOR[item.difficulty] ?? Colors.secondary;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('TrackDetail', { trackId: item.id })}
      >
        <View style={[styles.accentStripe, { backgroundColor: stripeColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {isComplete ? (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>✓ Done</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.cardDescription}>{item.description}</Text>

          <View style={styles.tagsRow}>
            <Text style={styles.tag}>📍 {item.region}</Text>
            <Text style={styles.tag}>🛠 {item.occupation}</Text>
            <Text style={[styles.tag, styles.difficultyTag, { color: stripeColor }]}>{item.difficulty}</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <GradientProgressFill percent={progressPercent} />
          </View>
          <Text style={styles.progressText}>
            {completed} of {item.totalLessons} lessons · {progressPercent}%
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Learning Tracks</Text>
        <Pressable
          style={styles.progressButton}
          onPress={() => navigation.navigate('ProgressTracking')}
        >
          <Text style={styles.progressButtonText}>📊 Progress</Text>
        </Pressable>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading tracks...</Text>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrack}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
  },
  progressButton: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
  },
  progressButtonText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: Colors.secondary },
  loadingText: { fontFamily: Typography.fontBody, color: Colors.textMuted },
  list: { paddingBottom: Spacing.lg },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    marginBottom: Spacing.sm + 6,
    overflow: 'hidden',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  accentStripe: { width: 5 },
  cardBody: { flex: 1, padding: Spacing.md },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  cardTitle: {
    flex: 1,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: Colors.text,
  },
  completeBadge: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.sm,
  },
  completeBadgeText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS - 2 },

  cardDescription: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.sm + 2,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm + 4, flexWrap: 'wrap' },
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
  difficultyTag: { backgroundColor: Colors.accentSubtle },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  progressText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
  },
});