// src/screens/learning/CourseTracksListScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { mockTracks } from '../../constants/mockLearningData';
import { Track } from '../../types/learning';

export default function CourseTracksListScreen() {
  const renderTrack = ({ item }: { item: Track }) => {
    const progressPercent = Math.round((item.completedLessons / item.totalLessons) * 100);

    return (
      <Pressable style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>

        <View style={styles.tagsRow}>
          <Text style={styles.tag}>{item.region}</Text>
          <Text style={styles.tag}>{item.occupation}</Text>
          <Text style={[styles.tag, styles.difficultyTag]}>{item.difficulty}</Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {item.completedLessons} of {item.totalLessons} lessons · {progressPercent}%
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Learning Tracks</Text>
      <FlatList
        data={mockTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrack}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#3E2723', marginBottom: 16 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#3E2723', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: '#6D4C41', marginBottom: 10 },
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
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EFE3D0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#C9782E', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6D4C41', marginTop: 6 },
});