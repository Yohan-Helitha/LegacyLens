// src/screens/learning/CourseTracksListScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Track } from '../../types/learning'
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api/client';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'CourseTracksList'>;

export default function CourseTracksListScreen() {

    const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await apiGet<Track[]>('/learning/tracks');
        console.log('LEARNING TRACKS:', data);
        setTracks(data);
      } catch (error) {
        console.error('Failed to load learning tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  const navigation = useNavigation<NavigationProp>();
  const renderTrack = ({ item }: { item: Track }) => {
    const progressPercent = Math.round((item.completedLessons / item.totalLessons) * 100);

    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('TrackDetail', { trackId: item.id })}>
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
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrack}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  list: { paddingBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.sm + 2,
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
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radii.sm },
  progressText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
  },
});