// src/screens/learning/ProgressTrackingScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { Trophy, Star, BookOpen, Flame } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radii } from '../../theme';
import { apiGet } from '../../services/api/client';
import { UserFooter, UserTabKey } from '../../components/common';

interface TrackProgress {
  trackId: number;
  trackTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  xpEarned: number;
}

interface StreakResponse {
  currentStreakDays: number;
  last7Days: boolean[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnimatedProgressBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent, { duration: 1000 });
  }, [percent]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressBarBackground}>
      <Animated.View style={[styles.progressBarFill, animatedStyle]} />
    </View>
  );
}

export default function ProgressTrackingScreen() {
  const navigation = useNavigation();
  const [trackProgress, setTrackProgress] = useState<TrackProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const handleTabSelect = (tab: UserTabKey) => {
    if (tab === 'home' || tab === 'map' || tab === 'profile') {
      navigation.navigate('User' as never);
    } else if (tab === 'market') {
      navigation.navigate('Creator' as never);
    } else if (tab === 'learn') {
      navigation.navigate('CourseTracksList' as never);
    }
  };

  const [streak, setStreak] = useState<StreakResponse>({
    currentStreakDays: 0,
    last7Days: [false, false, false, false, false, false, false],
  });

  useEffect(() => {
    loadTrackProgress();
  }, []);

  const loadTrackProgress = async () => {
    try {
      setLoading(true);
      const data = await apiGet<TrackProgress[]>('/learning/progress/tracks/me');
      setTrackProgress(data);
      const streakData = await apiGet<StreakResponse>('/learning/progress/me/streak');
      setStreak(streakData);
    } catch (error) {
      console.log('PROGRESS / STREAK ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const startedTracks = trackProgress.filter(t => t.completedLessons > 0 || t.xpEarned > 0);
  const tracksStarted = startedTracks.length;
  const lessonsCompleted = trackProgress.reduce((total, track) => total + track.completedLessons, 0);
  const totalLessons = startedTracks.reduce((total, track) => total + track.totalLessons, 0);
  const totalXp = trackProgress.reduce((total, track) => total + track.xpEarned, 0);
  const overallProgress = totalLessons === 0 ? 0 : Math.round((lessonsCompleted / totalLessons) * 100);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        style={{ flex: 1 }}
        data={startedTracks}
        keyExtractor={(item) => item.trackId.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPad}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerSubtitle}>Your Analytics</Text>
                <Text style={styles.header}>My Progress</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.badgesButton, pressed && { opacity: 0.8 }]}
                onPress={() => navigation.navigate('BadgesStreaks' as never)}
              >
                <Trophy size={16} color={Colors.accent} />
                <Text style={styles.badgesButtonText}>Badges</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCardGlass}>
                <View style={styles.statIconWrapper}>
                  <BookOpen size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.statValue}>{lessonsCompleted}</Text>
                <Text style={styles.statLabel}>Lessons</Text>
              </View>
              <View style={styles.statCardGlass}>
                <View style={styles.statIconWrapper}>
                  <Star size={20} color={Colors.accent} />
                </View>
                <Text style={styles.statValue}>{totalXp}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Overall Progress</Text>
                <Text style={styles.percentageText}>{overallProgress}%</Text>
              </View>
              <Text style={styles.summaryText}>
                {lessonsCompleted} of {totalLessons} lessons completed across {tracksStarted} tracks
              </Text>
              <AnimatedProgressBar percent={overallProgress} />
            </View>

            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <Flame size={24} color={Colors.accent} fill={Colors.accent} />
                <Text style={styles.streakHeadline}>{streak.currentStreakDays} Day Streak</Text>
              </View>
              <View style={styles.weekRow}>
                {DAY_LABELS.map((day, index) => {
                  const isActive = streak.last7Days[index];
                  return (
                    <View key={day} style={styles.dayColumn}>
                      <View style={[styles.dayDot, isActive && styles.dayDotActive]}>
                        {isActive && <CheckIcon size={12} color={Colors.white} />}
                      </View>
                      <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Active Tracks</Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 100).duration(500)}>
            <View style={styles.trackRow}>
              <View style={styles.trackHeader}>
                <Text style={styles.trackTitle}>{item.trackTitle}</Text>
                <Text style={styles.trackPercentage}>{item.progressPercentage}%</Text>
              </View>
              <AnimatedProgressBar percent={item.progressPercentage} />
              <View style={styles.trackInfoRow}>
                <Text style={styles.trackSubtext}>
                  {item.completedLessons} of {item.totalLessons} lessons
                </Text>
                <Text style={styles.trackXp}>+{item.xpEarned} XP</Text>
              </View>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(300)}>
            <View style={[styles.emptyCard, { marginTop: Spacing.sm }]}>
              <Text style={styles.emptyText}>You haven't started any tracks yet.</Text>
            </View>
          </Animated.View>
        }
      />

      <UserFooter activeTab="learn" onTabSelect={handleTabSelect} />
    </View>
  );
}

import Svg, { Polyline } from 'react-native-svg';

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 60,
  },
  contentPad: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  loadingText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
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
  badgesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  badgesButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCardGlass: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 2,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  summaryCard: {
    backgroundColor: Colors.secondaryDark,
    borderRadius: Radii.xl + 4,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.white,
  },
  percentageText: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.accent,
  },
  summaryText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    borderRadius: Radii.xl + 4,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  streakHeadline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dayLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    color: Colors.textMuted,
  },
  dayLabelActive: {
    color: Colors.secondary,
  },

  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  trackRow: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
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
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  trackPercentage: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD,
    color: Colors.secondaryDark,
  },
  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  trackSubtext: {
    fontFamily: Typography.fontBodySemi,
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