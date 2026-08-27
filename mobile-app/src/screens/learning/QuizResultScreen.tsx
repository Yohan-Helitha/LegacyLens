import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography, Spacing, Radii } from '../../theme';
import { LearningStackParamList } from '../../navigation/LearningNavigator';

type NavigationProp = NativeStackNavigationProp<
  LearningStackParamList,
  'QuizResult'
>;

type QuizResultRouteProp = RouteProp<
  LearningStackParamList,
  'QuizResult'
>;

export default function QuizResultScreen() {
  const navigation = useNavigation<NavigationProp>();

  const route = useRoute<QuizResultRouteProp>();

  const {
    lessonId,
    totalQuestions,
    correctCount,
    xpEarned,
    currentStreakDays,
  } = route.params;

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

  return (
    <View style={styles.container}>

      {/* Trophy */}
      <Text style={styles.trophy}>🏆</Text>

      {/* Headline */}
      <Text style={styles.headline}>
        Great Job!
      </Text>

      {/* Score */}
      <Text style={styles.scoreText}>
        {correctCount} / {totalQuestions} Correct
      </Text>

      {/* Stars */}
      <Text style={styles.stars}>
        {'⭐'.repeat(starCount)}
        {'☆'.repeat(3 - starCount)}
      </Text>

      {/* Percentage */}
      <Text style={styles.percentText}>
        {percent}%
      </Text>

      {/* Breakdown */}
      <View style={styles.breakdownRow}>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownIcon}>
            ✅
          </Text>

          <Text style={styles.breakdownLabel}>
            {correctCount} Correct
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownIcon}>
            ❌
          </Text>

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

        <Text style={styles.streakText}>
          🔥 {currentStreakDays} day streak
        </Text>

      </View>

      {/* Continue */}
      <Pressable
        style={styles.continueButton}
        onPress={() =>
          navigation.navigate('ProgressTracking')
        }
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
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  trophy: {
    fontSize: 60,
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

  stars: {
    fontSize: 24,
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
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },

  breakdownItem: {
    alignItems: 'center',
  },

  breakdownIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
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

});