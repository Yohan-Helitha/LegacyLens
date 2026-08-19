// src/screens/learning/QuizResultScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Hardcoded for now — later this comes from navigation params
// (passed from QuizScreen once real navigation is wired up)
const MOCK_RESULT = {
  totalQuestions: 5,
  correctCount: 4,
  xpEarned: 50,
  currentStreakDays: 5,
};

export default function QuizResultScreen() {
  const { totalQuestions, correctCount, xpEarned, currentStreakDays } = MOCK_RESULT;
  const percent = Math.round((correctCount / totalQuestions) * 100);

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

      <Pressable style={styles.continueButton}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
      <Pressable style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Retry Quiz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 60, paddingHorizontal: 24, alignItems: 'center' },
  trophy: { fontSize: 60, marginBottom: 8 },
  headline: { fontSize: 24, fontWeight: '800', color: '#3E2723', marginBottom: 16 },
  scoreText: { fontSize: 20, fontWeight: '700', color: '#3E2723' },
  stars: { fontSize: 24, marginVertical: 6 },
  percentText: { fontSize: 14, color: '#6D4C41', marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  breakdownItem: { alignItems: 'center' },
  breakdownIcon: { fontSize: 20, marginBottom: 4 },
  breakdownLabel: { fontSize: 13, color: '#6D4C41', fontWeight: '600' },
  rewardCard: {
    backgroundColor: '#F4E1C6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  rewardText: { fontSize: 18, fontWeight: '800', color: '#C9782E', marginBottom: 4 },
  streakText: { fontSize: 13, color: '#8D6E38', fontWeight: '600' },
  continueButton: {
    backgroundColor: '#C9782E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  continueButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  retryButton: { paddingVertical: 10, alignItems: 'center' },
  retryButtonText: { color: '#C9782E', fontWeight: '700', fontSize: 14 },
});