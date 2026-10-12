import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, Award, ArrowLeft, Trophy, Star, CheckCircle2, XCircle, Flame } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radii } from '../../theme';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<
  LearningStackParamList,
  'QuizResult'
>;

type QuizResultRouteProp = RouteProp<
  LearningStackParamList,
  'QuizResult'
>;

interface ProgressSummary {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  currentStreakDays: number;
  levelUp: boolean;
}

export default function QuizResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizResultRouteProp>();

  const {
    lessonId,
    totalQuestions,
    correctCount,
    xpEarned,
    currentStreakDays: initialStreak,
  } = route.params;

  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiGet<ProgressSummary>('/learning/progress/me/summary');
        setSummary(data);
      } catch (err) {
        console.log('Failed to fetch summary on quiz result:', err);
      }
    };
    fetchSummary();
  }, []);

  const percent =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const starCount =
    percent >= 90
      ? 3
      : percent >= 60
        ? 2
        : 1;

  const incorrectCount = totalQuestions - correctCount;
  const streakDays = summary?.currentStreakDays ?? initialStreak;
  const userLevel = summary?.level ?? 1;

  return (
    <View style={styles.container}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.navigate('CourseTracksList')}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover Tracks"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={Colors.text} />
          <Text style={styles.backButtonText}>Tracks</Text>
        </Pressable>
      </View>

      {/* Level-Up Moment */}
      {summary?.levelUp && (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.levelUpMomentCard}>
          <View style={styles.levelUpMomentIcon}>
            <Sparkles size={24} color={Colors.white} />
          </View>
          <View style={styles.levelUpMomentTextWrapper}>
            <Text style={styles.levelUpMomentTitle}>{learningStrings.progress.levelUpTitle}</Text>
            <Text style={styles.levelUpMomentSubtitle}>
              {learningStrings.progress.levelUpSubtitle(userLevel)}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Trophy */}
      <View style={styles.trophyWrapper}>
        <Trophy size={54} color={Colors.accent} />
      </View>

      {/* Headline */}
      <Text style={styles.headline}>
        Great Job!
      </Text>

      {/* Score */}
      <Text style={styles.scoreText}>
        {correctCount} / {totalQuestions} Correct
      </Text>

      {/* Stars */}
      <View style={styles.starsRow}>
        {[1, 2, 3].map((starIdx) => (
          <Star
            key={starIdx}
            size={24}
            color={Colors.accent}
            fill={starIdx <= starCount ? Colors.accent : 'transparent'}
          />
        ))}
      </View>

      {/* Percentage */}
      <Text style={styles.percentText}>
        {percent}%
      </Text>

      {/* Breakdown */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <CheckCircle2 size={20} color={Colors.secondary} />
          <Text style={styles.breakdownLabel}>
            {correctCount} Correct
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <XCircle size={20} color={Colors.accent} />
          <Text style={styles.breakdownLabel}>
            {incorrectCount} Incorrect
          </Text>
        </View>
      </View>

      {/* Reward Card */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardText}>
          +{xpEarned} XP
        </Text>

        <View style={styles.streakRow}>
          <Flame size={16} color={Colors.secondary} />
          <Text style={styles.streakText}>
            {streakDays} day streak
          </Text>
        </View>

        {summary && (
          <View style={styles.levelSummaryRow}>
            <Award size={14} color={Colors.secondary} />
            <Text style={styles.levelSummaryText}>
              Level {userLevel} · {summary.xpToNextLevel > 0 ? `${summary.xpToNextLevel} XP to next level` : 'Max Level'}
            </Text>
          </View>
        )}
      </View>

      {/* Continue */}
      <Pressable
        style={styles.continueButton}
        onPress={() =>
          navigation.navigate('ProgressTracking')
        }
        accessibilityRole="button"
        accessibilityLabel="Continue to Progress Tracking"
      >
        <Text style={styles.continueButtonText}>
          Continue
        </Text>
      </Pressable>

      {/* Retry */}
      <Pressable
        style={styles.retryButton}
        onPress={() =>
          navigation.navigate('Quiz', {
            lessonId,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Retry Quiz"
      >
        <Text style={styles.retryButtonText}>
          Retry Quiz
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  topBar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  backButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },

  trophyWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accentSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },

  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  scoreText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
  },

  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: Spacing.xs + 2,
  },

  percentText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  breakdownRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },

  breakdownItem: {
    alignItems: 'center',
    gap: 4,
  },

  breakdownLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
  },

  rewardCard: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl - 8,
    width: '100%',
  },

  rewardText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },

  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  streakText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS + 1,
    color: Colors.secondary,
  },

  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.sm + 2,
  },

  continueButtonText: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
  },

  retryButton: {
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },

  retryButtonText: {
    color: Colors.accent,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
  },
  levelUpMomentCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  levelUpMomentIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelUpMomentTextWrapper: {
    flex: 1,
  },
  levelUpMomentTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.white,
  },
  levelUpMomentSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  levelSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  levelSummaryText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
});