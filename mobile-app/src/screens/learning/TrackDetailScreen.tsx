// src/screens/learning/TrackDetailScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { mockTracks, mockLessons } from '../../constants/mockLearningData';
import { Lesson } from '../../types/learning';

// For now, hardcode which track we're viewing (track-1).
// Later, this will come from navigation params (e.g. route.params.trackId).
const CURRENT_TRACK_ID = 'track-1';

export default function TrackDetailScreen() {
  const track = mockTracks.find((t) => t.id === CURRENT_TRACK_ID);
  const lessons = mockLessons.filter((l) => l.trackId === CURRENT_TRACK_ID);

  if (!track) {
    return (
      <View style={styles.container}>
        <Text>Track not found.</Text>
      </View>
    );
  }

  const progressPercent = Math.round((track.completedLessons / track.totalLessons) * 100);

  const statusLabel = (status: Lesson['status']) => {
    if (status === 'completed') return '✓ Completed';
    if (status === 'in_progress') return '▶ In Progress';
    return '🔒 Locked';
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <Pressable style={styles.lessonRow}>
      <View style={{ flex: 1 }}>
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
        {track.completedLessons} of {track.totalLessons} lessons completed · {progressPercent}%
      </Text>

      <Text style={styles.sectionTitle}>Lessons</Text>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={renderLesson}
        contentContainerStyle={styles.list}
      />

      <Pressable style={styles.continueButton}>
        <Text style={styles.continueButtonText}>Continue Learning</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#3E2723', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: '#F4E1C6',
    color: '#8D6E38',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  difficultyTag: { backgroundColor: '#E3EFE0', color: '#4B7A51' },
  description: { fontSize: 13, color: '#6D4C41', marginBottom: 14 },
  progressBarBackground: { height: 8, backgroundColor: '#EFE3D0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#C9782E', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6D4C41', marginTop: 6, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3E2723', marginBottom: 8 },
  list: { paddingBottom: 12 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#3E2723' },
  lessonType: { fontSize: 12, color: '#9B7653', marginTop: 2, textTransform: 'capitalize' },
  lessonStatus: { fontSize: 12, color: '#6D4C41', fontWeight: '600' },
  continueButton: {
    backgroundColor: '#C9782E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  continueButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});