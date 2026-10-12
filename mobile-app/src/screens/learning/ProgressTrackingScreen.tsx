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
import { Trophy, Star, BookOpen, Flame, Sparkles, Award, ArrowLeft, Target, ChevronRight, Check } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radii } from '../../theme';
import { apiGet } from '../../services/api/client';
import { UserFooter, UserTabKey } from '../../components/common';
import { learningStrings } from '../../constants/learningStrings';

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

interface ProgressSummary {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  currentStreakDays: number;
  last7Days: boolean[];
  completedLessons: number;
  completedTracks: number;
  levelUp: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnimatedProgressBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);
  const clampedPercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));

  useEffect(() => {
    width.value = withTiming(clampedPercent, { duration: 1000 });
  }, [clampedPercent]);

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
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
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
      const [data, streakData, summaryData] = await Promise.all([
        apiGet<TrackProgress[]>('/learning/progress/tracks/me').catch(() => []),
        apiGet<StreakResponse>('/learning/progress/me/streak').catch(() => ({
          currentStreakDays: 0,
          last7Days: [false, false, false, false, false, false, false],
        })),
        apiGet<ProgressSummary>('/learning/progress/me/summary').catch(() => null),
      ]);
      setTrackProgress(data);
      setStreak(streakData);
      setSummary(summaryData);
    } catch (error) {
      console.log('PROGRESS / STREAK ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const startedTracks = trackProgress.filter(t => t.completedLessons > 0 || t.xpEarned > 0);
  const tracksStarted = startedTracks.length;
  const lifetimeLessonsCompleted = summary?.completedLessons ?? trackProgress.reduce((total, track) => total + track.completedLessons, 0);
  const totalXp = summary?.totalXp ?? trackProgress.reduce((total, track) => total + track.xpEarned, 0);

  const tracksToAggregate = startedTracks.length > 0 ? startedTracks : trackProgress;
  const totalLessonsAcrossTracks = tracksToAggregate.reduce((total, track) => {
    return total + Math.max(track.totalLessons, track.completedLessons);
  }, 0);
  const completedLessonsAcrossTracks = tracksToAggregate.reduce((total, track) => {
    const trackTotal = Math.max(track.totalLessons, track.completedLessons);
    return total + Math.min(track.completedLessons, trackTotal);
  }, 0);

  const overallCompleted = Math.min(completedLessonsAcrossTracks, totalLessonsAcrossTracks);
  const overallTotal = totalLessonsAcrossTracks;
  const overallProgress = overallTotal === 0 ? 0 : Math.min(100, Math.max(0, Math.round((overallCompleted / overallTotal) * 100)));

  const level = summary?.level ?? 1;
  const xpToNextLevel = summary?.xpToNextLevel ?? 0;
  const xpForCurrentLevel = summary?.xpForCurrentLevel ?? 0;
  const xpForNextLevel = summary?.xpForNextLevel ?? 100;
  const levelSpan = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  const levelProgressXp = Math.max(0, totalXp - xpForCurrentLevel);
  const levelProgressPercent = Math.min(100, Math.round((levelProgressXp / levelSpan) * 100));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.contentPad}>
          <Pressable
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('CourseTracksList' as never);
            }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
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
            {/* Top Navigation Bar: Back button on left, Review & Badges on right */}
            <View style={styles.navBar}>
              <Pressable
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate('CourseTracksList' as never);
                }}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Back to Discover Tracks"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ArrowLeft size={20} color={Colors.text} />
              </Pressable>

              <View style={styles.headerActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
                  onPress={() => navigation.navigate('WeakWordReview' as never)}
                  accessibilityRole="button"
                  accessibilityLabel="Weak Word Review"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <BookOpen size={16} color={Colors.accent} />
                  <Text style={styles.actionButtonText}>Review</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
                  onPress={() => navigation.navigate('BadgesStreaks' as never)}
                  accessibilityRole="button"
                  accessibilityLabel="Badges"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Trophy size={16} color={Colors.accent} />
                  <Text style={styles.actionButtonText}>Badges</Text>
                </Pressable>
              </View>
            </View>

            {/* Page Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.headerSubtitle}>{learningStrings.progress.subtitle}</Text>
              <Text style={styles.header}>{learningStrings.progress.title}</Text>
            </View>

            {/* Level-Up Celebration Banner (if leveled up) */}
            {summary?.levelUp && (
              <Animated.View entering={FadeInDown.duration(500)} style={styles.levelUpBanner}>
                <View style={styles.levelUpIconCircle}>
                  <Sparkles size={22} color={Colors.white} />
                </View>
                <View style={styles.levelUpTextWrapper}>
                  <Text style={styles.levelUpBannerTitle}>{learningStrings.progress.levelUpTitle}</Text>
                  <Text style={styles.levelUpBannerSubtitle}>
                    {learningStrings.progress.levelUpSubtitle(level)}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Level Progress Card */}
            <View style={styles.levelCard}>
              <View style={styles.levelCardHeader}>
                <View style={styles.levelBadge}>
                  <Award size={16} color={Colors.white} />
                  <Text style={styles.levelBadgeText}>{learningStrings.progress.levelLabel(level)}</Text>
                </View>
                <Text style={styles.levelTitle}>{learningStrings.progress.scholarTitle(level)}</Text>
              </View>

              <View style={styles.levelProgressRow}>
                <Text style={styles.levelXpInfo}>
                  {xpToNextLevel > 0
                    ? learningStrings.progress.xpToNext(xpToNextLevel)
                    : learningStrings.progress.maxLevel}
                </Text>
                <Text style={styles.levelPercentText}>{levelProgressPercent}%</Text>
              </View>
              <AnimatedProgressBar percent={levelProgressPercent} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCardGlass}>
                <View style={styles.statIconWrapper}>
                  <BookOpen size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.statValue}>{lifetimeLessonsCompleted}</Text>
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
                {overallCompleted} of {overallTotal} lessons completed across {tracksStarted} {tracksStarted === 1 ? 'track' : 'tracks'}
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
                        {isActive && <Check size={12} color={Colors.white} strokeWidth={3} />}
                      </View>
                      <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weak Words Practice Banner */}
            <Pressable
              style={({ pressed }) => [styles.weakWordsReviewCard, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate('WeakWordReview' as never)}
            >
              <View style={styles.weakWordsRow}>
                <View style={styles.weakWordsIconWrapper}>
                  <Target size={22} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weakWordsTitle}>Adaptive Weak-Words Review</Text>
                  <Text style={styles.weakWordsSubtitle}>Master terms you previously missed in quizzes</Text>
                </View>
                <ChevronRight size={20} color={Colors.secondary} />
              </View>
            </Pressable>

            <Text style={styles.sectionTitle}>Active Tracks</Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const itemTotal = Math.max(item.totalLessons, item.completedLessons);
          const itemCompleted = Math.min(item.completedLessons, itemTotal);
          const itemPercent = Math.min(100, Math.max(0, item.progressPercentage ?? (itemTotal === 0 ? 0 : Math.round((itemCompleted / itemTotal) * 100))));

          return (
            <Animated.View entering={FadeInRight.delay(index * 100).duration(500)}>
              <View style={styles.trackRow}>
                <View style={styles.trackHeader}>
                  <Text style={styles.trackTitle}>{item.trackTitle}</Text>
                  <Text style={styles.trackPercentage}>{itemPercent}%</Text>
                </View>
                <AnimatedProgressBar percent={itemPercent} />
                <View style={styles.trackInfoRow}>
                  <Text style={styles.trackSubtext}>
                    {itemCompleted} of {itemTotal} lessons
                  </Text>
                  <Text style={styles.trackXp}>+{item.xpEarned} XP</Text>
                </View>
              </View>
            </Animated.View>
          );
        }}
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

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md - 2,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
    marginBottom: 2,
  },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 4,
    color: Colors.text,
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  levelUpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelUpTextWrapper: {
    flex: 1,
  },
  levelUpBannerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.white,
  },
  levelUpBannerSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  levelCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  levelBadgeText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.white,
  },
  levelTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  levelProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  levelXpInfo: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
  },
  levelPercentText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
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
  weakWordsReviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#0F5C5C',
    elevation: 2,
  },
  weakWordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weakWordsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakWordsTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: '#0F5C5C',
  },
  weakWordsSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
});