// src/screens/learning/QuizResultScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { useLearningStore } from '../../store/learningStore';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'QuizResult'>;

export default function QuizResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const quiz = useLearningStore((state) => state.quiz);
  const resetQuiz = useLearningStore((state) => state.resetQuiz);

  const totalQuestions = quiz.totalQuestions;
  const correctCount = quiz.score;
  const xpEarned = correctCount * 10; // simple XP rule: 10 XP per correct answer
  const currentStreakDays = 5; // will come from LearnerProgress later

  const percent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const starCount = percent >= 90 ? 3 : percent >= 60 ? 2 : 1;

  return (
    <View style={styles.container}>
      <Text style={styles.trophy}>🏆</Text>
      <Text style={styles.headline}>Great Job!</Text>

      <Text style={styles.scoreText}>{correctCount} / {totalQuestions} Correct</Text>
      <Text style={styles.stars}>{'⭐'.repeat(starCount)}{'☆'.repeat(3 - starCount)}</Text>
      <Text style={styles.percentText}>{percent}%</Text>

      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownIcon}>✅</Text>
          <Text style={styles.breakdownLabel}>{correctCount} Correct</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownIcon}>❌</Text>
          <Text style={styles.breakdownLabel}>{totalQuestions - correctCount} Incorrect</Text>
        </View>
      </View>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardText}>+{xpEarned} XP</Text>
        <Text style={styles.streakText}>🔥 {currentStreakDays} day streak</Text>
      </View>

      <Pressable
        style={styles.continueButton}
        onPress={() => {
          resetQuiz();
          navigation.navigate('ProgressTracking');
        }}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
      <Pressable
        style={styles.retryButton}
        onPress={() => {
          resetQuiz();
          navigation.navigate('Quiz', { lessonId: 'lesson-2' });
        }}
      >
        <Text style={styles.retryButtonText}>Retry Quiz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 60, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  trophy: { fontSize: 60, marginBottom: Spacing.xs },
  headline: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: Colors.text, marginBottom: Spacing.md },
  scoreText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG + 2, color: Colors.text },
  stars: { fontSize: 24, marginVertical: Spacing.xs + 2 },
  percentText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: Spacing.md },
  breakdownRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  breakdownItem: { alignItems: 'center' },
  breakdownIcon: { fontSize: 20, marginBottom: Spacing.xs },
  breakdownLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: Colors.textMuted },
  rewardCard: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl - 8,
    width: '100%',
  },
  rewardText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.accent, marginBottom: Spacing.xs },
  streakText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: Colors.secondary },
  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.sm + 2,
  },
  continueButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
  retryButton: { paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  retryButtonText: { color: Colors.accent, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
});