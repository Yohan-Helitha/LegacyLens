// src/screens/learning/ProgressTrackingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { mockProgress } from '../../constants/mockLearningData';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressTrackingScreen() {
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
            <View style={styles.trackRow}>
              <Text style={styles.trackTitle}>{item.trackTitle}</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.trackSubtext}>
                {item.completedLessons} of {item.totalLessons} lessons done
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#3E2723', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#C9782E' },
  statLabel: { fontSize: 11, color: '#6D4C41', marginTop: 4, textAlign: 'center' },
  streakCard: { backgroundColor: '#F4E1C6', borderRadius: 16, padding: 16, marginBottom: 20 },
  streakHeadline: { fontSize: 16, fontWeight: '700', color: '#8D6E38', marginBottom: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center' },
  dayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E8D5BC', marginBottom: 4 },
  dayDotDone: { backgroundColor: '#C9782E' },
  dayLabel: { fontSize: 10, color: '#8D6E38' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3E2723', marginBottom: 10 },
  trackRow: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#3E2723', marginBottom: 8 },
  progressBarBackground: { height: 8, backgroundColor: '#EFE3D0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#C9782E', borderRadius: 4 },
  trackSubtext: { fontSize: 11, color: '#6D4C41', marginTop: 6 },
});