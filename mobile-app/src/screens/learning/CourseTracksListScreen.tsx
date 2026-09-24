// src/screens/learning/CourseTracksListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { MapPin, Briefcase, Zap, CheckCircle2 } from 'lucide-react-native';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrackCard({ item, index, navigation }: { item: Track; index: number; navigation: NavigationProp }) {
  const completed = item.completedLessons ?? 0;
  const progressPercent = item.totalLessons
    ? Math.round((completed / item.totalLessons) * 100)
    : 0;
  const isComplete = progressPercent >= 100;
  const stripeColor = DIFFICULTY_COLOR[item.difficulty] ?? Colors.secondary;

  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <AnimatedPressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => navigation.navigate('TrackDetail', { trackId: item.id })}
        style={[styles.card, animatedStyle]}
      >
        <View style={[styles.accentStripe, { backgroundColor: stripeColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {isComplete && (
              <View style={styles.completeBadge}>
                <CheckCircle2 size={12} color={Colors.secondary} strokeWidth={3} />
                <Text style={styles.completeBadgeText}>Done</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tagWrapper}>
              <MapPin size={12} color={Colors.secondary} />
              <Text style={styles.tag}>{item.region}</Text>
            </View>
            <View style={styles.tagWrapper}>
              <Briefcase size={12} color={Colors.secondary} />
              <Text style={styles.tag}>{item.occupation}</Text>
            </View>
            <View style={[styles.tagWrapper, styles.difficultyTagWrapper]}>
              <Zap size={12} color={stripeColor} />
              <Text style={[styles.tag, { color: stripeColor }]}>{item.difficulty}</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <GradientProgressFill percent={progressPercent} />
          </View>
          <Text style={styles.progressText}>
            {completed} of {item.totalLessons} lessons · {progressPercent}%
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CourseTracksListScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const [tracksData, progressData] = await Promise.all([
          apiGet<Track[]>('/learning/tracks'),
          apiGet<any[]>('/learning/progress/tracks/me').catch(() => [])
        ]);

        const progressMap = new Map(progressData.map(p => [p.trackId, p]));
        
        const mergedTracks = tracksData.map(track => {
          const progress = progressMap.get(track.id);
          if (progress) {
            return {
              ...track,
              completedLessons: progress.completedLessons,
            };
          }
          return {
            ...track,
            completedLessons: 0,
          };
        });

        setTracks(mergedTracks);
      } catch (error: any) {
        console.log('Failed to load learning tracks:', error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>Ready to learn?</Text>
          <Text style={styles.header}>Discover Tracks</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.progressButton, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('ProgressTracking')}
        >
          <Text style={styles.progressButtonText}>📊 Progress</Text>
        </Pressable>
      </Animated.View>

      {loading ? (
        <Text style={styles.loadingText}>Loading tracks...</Text>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <TrackCard item={item} index={index} navigation={navigation} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 60, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
    marginBottom: 2,
  },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 2,
    color: Colors.text,
  },
  progressButton: {
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  progressButtonText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.secondary },
  loadingText: { fontFamily: Typography.fontBody, color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
  list: { paddingBottom: Spacing.xl },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl + 4,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  accentStripe: { width: 6 },
  cardBody: { flex: 1, padding: Spacing.lg },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  cardTitle: {
    flex: 1,
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    lineHeight: 26,
    paddingRight: Spacing.sm,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  completeBadgeText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS },

  cardDescription: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
  },
  difficultyTagWrapper: { backgroundColor: Colors.accentSubtle },
  tag: {
    color: Colors.secondary,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  progressText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});