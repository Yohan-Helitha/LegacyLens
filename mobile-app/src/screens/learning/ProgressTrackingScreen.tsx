// src/screens/learning/ProgressTrackingScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { mockProgress } from '../../constants/mockLearningData';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'ProgressTracking'>;

export default function ProgressTrackingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { tracksStarted, lessonsCompleted, totalXp, currentStreakDays, last7Days, trackProgress } =
    mockProgress;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Progress</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tracksStarted}</Text>
          <Text style={styles.statLabel}>Tracks Started</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lessonsCompleted}</Text>
          <Text style={styles.statLabel}>Lessons Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalXp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
      </View>

      <View style={styles.streakCard}>
        <Text style={styles.streakHeadline}>🔥 {currentStreakDays} Day Streak</Text>
        <View style={styles.weekRow}>
          {last7Days.map((done, i) => (
            <View key={i} style={styles.dayColumn}>
              <View style={[styles.dayDot, done && styles.dayDotDone]} />
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Tracks</Text>
      <FlatList
        data={trackProgress}
        keyExtractor={(item) => item.trackId}
                renderItem={({ item }) => {
          const percent = Math.round((item.completedLessons / item.totalLessons) * 100);
          return (
            <Pressable
              style={styles.trackRow}
              onPress={() => navigation.navigate('TrackDetail', { trackId: item.trackId })}
            >
              <Text style={styles.trackTitle}>{item.trackTitle}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.trackSubtext}>
                {item.completedLessons} of {item.totalLessons} lessons done
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  header: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: Colors.text, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm + 2, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, paddingVertical: Spacing.sm + 6, alignItems: 'center' },
  statValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG + 2, color: Colors.accent },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS - 1, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  streakCard: { backgroundColor: Colors.secondarySubtle, borderRadius: Radii.xl, padding: Spacing.md, marginBottom: Spacing.lg - 4 },
  streakHeadline: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.secondary, marginBottom: Spacing.sm + 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center' },
  dayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surface, marginBottom: Spacing.xs },
  dayDotDone: { backgroundColor: Colors.accent },
  dayLabel: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.secondary },
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.text, marginBottom: Spacing.sm + 2 },
  trackRow: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.sm + 6, marginBottom: Spacing.sm + 2 },
  trackTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1, color: Colors.text, marginBottom: Spacing.sm },
  progressBarBackground: { height: 8, backgroundColor: Colors.surface, borderRadius: Radii.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radii.sm },
  trackSubtext: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS - 1, color: Colors.textMuted, marginTop: Spacing.xs + 2 },
});