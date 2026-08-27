// src/screens/learning/ProgressTrackingScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

import { Colors, Typography, Spacing, Radii } from '../../theme';
import { apiGet } from '../../services/api/client';

interface TrackProgress {
  trackId: number;
  trackTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  xpEarned: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressTrackingScreen() {
  const [trackProgress, setTrackProgress] = useState<TrackProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackProgress();
  }, []);

  const loadTrackProgress = async () => {
    try {
      setLoading(true);

      const data = await apiGet<TrackProgress[]>(
        '/learning/progress/tracks/me'
      );

      console.log('TRACK PROGRESS:', data);

      setTrackProgress(data);
    } catch (error) {
      console.log('TRACK PROGRESS ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  // Total number of tracks the user has started
  const tracksStarted = trackProgress.length;

  // Total completed lessons across all tracks
  const lessonsCompleted = trackProgress.reduce(
    (total, track) => total + track.completedLessons,
    0
  );

  // Total lessons across all started tracks
  const totalLessons = trackProgress.reduce(
    (total, track) => total + track.totalLessons,
    0
  );

  // Total XP across all tracks
  const totalXp = trackProgress.reduce(
    (total, track) => total + track.xpEarned,
    0
  );

  // Overall progress percentage
  const overallProgress =
    totalLessons === 0
      ? 0
      : Math.round((lessonsCompleted / totalLessons) * 100);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        My Progress
      </Text>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {tracksStarted}
          </Text>

          <Text style={styles.statLabel}>
            Tracks Started
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {lessonsCompleted}
          </Text>

          <Text style={styles.statLabel}>
            Lessons Done
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {totalXp}
          </Text>

          <Text style={styles.statLabel}>
            Total XP
          </Text>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Overall Learning Progress
        </Text>

        <Text style={styles.summaryText}>
          {lessonsCompleted} of {totalLessons} lessons completed
        </Text>

        <Text style={styles.percentageText}>
          {overallProgress}%
        </Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${overallProgress}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakHeadline}>
          🔥 Learning Streak
        </Text>

        <View style={styles.weekRow}>
          {DAY_LABELS.map((day) => (
            <View
              key={day}
              style={styles.dayColumn}
            >
              <View style={styles.dayDot} />

              <Text style={styles.dayLabel}>
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tracks */}
      <Text style={styles.sectionTitle}>
        My Tracks
      </Text>

      {trackProgress.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            You haven't started any learning tracks yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trackProgress}
          keyExtractor={(item) =>
            item.trackId.toString()
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.trackRow}>
              <View style={styles.trackHeader}>
                <Text style={styles.trackTitle}>
                  {item.trackTitle}
                </Text>

                <Text style={styles.trackPercentage}>
                  {item.progressPercentage}%
                </Text>
              </View>

              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.progressPercentage}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.trackInfoRow}>
                <Text style={styles.trackSubtext}>
                  {item.completedLessons} of {item.totalLessons} lessons
                </Text>

                <Text style={styles.trackXp}>
                  +{item.xpEarned} XP
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 50,
    paddingHorizontal: Spacing.md,
  },

  loadingText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },

  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
  },

  statValue: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG + 2,
    color: Colors.accent,
  },

  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS - 1,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  summaryCard: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  summaryTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },

  summaryText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },

  percentageText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: Colors.accent,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
  },

  streakCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },

  streakHeadline: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.secondary,
    marginBottom: Spacing.sm + 2,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dayColumn: {
    alignItems: 'center',
  },

  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },

  dayLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.secondary,
  },

  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    marginBottom: Spacing.sm + 2,
  },

  trackRow: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm + 6,
    marginBottom: Spacing.sm + 2,
  },

  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  trackTitle: {
    flex: 1,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.text,
  },

  trackPercentage: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
  },

  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs + 2,
  },

  trackSubtext: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },

  trackXp: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
  },

  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },

  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});