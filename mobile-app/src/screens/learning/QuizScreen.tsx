// src/screens/learning/QuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { mockQuizQuestions } from '../../constants/mockLearningData';
import { QuestionOptionId } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';

const CURRENT_LESSON_ID = 'lesson-2';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Quiz'>;

export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const questions = mockQuizQuestions.filter((q) => q.lessonId === CURRENT_LESSON_ID);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionId | null>(null);
  const [score, setScore] = useState(0);

  const question = questions[questionIndex];

  if (!question) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>No quiz questions found for this lesson.</Text>
      </View>
    );
  }

  const handleSelect = (optionId: QuestionOptionId) => {
    setSelectedOption(optionId);
  };

    const handleSubmit = () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === question.correctOptionId;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      navigation.navigate('QuizResult');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.progressLabel}>Question {questionIndex + 1} of {questions.length}</Text>
        <Text style={styles.hearts}>❤️❤️❤️</Text>
      </View>

      <Text style={styles.streak}>🔥 Score: {score}</Text>

      <View style={styles.questionCard}>
        <Text style={styles.prompt}>{question.prompt}</Text>
        {question.word ? <Text style={styles.word}>{question.word}</Text> : null}

        {question.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => handleSelect(opt.id)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {opt.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.submitButton, !selectedOption && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!selectedOption}
      >
        <Text style={styles.submitButtonText}>Check Answer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  progressLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: Colors.textMuted },
  hearts: { fontSize: 14 },
  streak: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS + 1,
    color: Colors.accent,
    marginBottom: Spacing.lg - 4,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg - 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: Spacing.lg,
  },
  prompt: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  word: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg - 4,
  },
  optionButton: {
    borderWidth: 1.5,
    borderColor: Colors.surface,
    backgroundColor: Colors.dominant,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionButtonSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentSubtle },
  optionText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1, color: Colors.text },
  optionTextSelected: { color: Colors.accent },
  submitButton: { backgroundColor: Colors.accent, borderRadius: Radii.lg + 2, paddingVertical: Spacing.sm + 6, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: Colors.accentSubtle },
  submitButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});