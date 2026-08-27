// src/screens/learning/QuizScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { QuestionOptionId } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { apiGet,apiPost  } from '../../services/api/client';

interface BackendQuizQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}
type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Quiz'>;

export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();

  const route = useRoute<RouteProp<LearningStackParamList, 'Quiz'>>();

  console.log('QUIZ LESSON ID:', route.params.lessonId);
  const [answers, setAnswers] = useState<
  { questionId: number; selectedOption: QuestionOptionId }[]
>([]);
  const [questions, setQuestions] = useState<BackendQuizQuestion[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<BackendQuizQuestion[]>(
        `/learning/lessons/${route.params.lessonId}/questions`
      );

      console.log('QUIZ QUESTIONS:', data);

      setQuestions(data);
    } catch (err) {
      console.log('QUIZ QUESTIONS ERROR:', err);
      setError('Could not load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  loadQuestions();
}, [route.params.lessonId]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionId | null>(null);

  const question = questions[questionIndex];

if (loading) {
  return (
    <View style={styles.container}>
      <Text style={{ color: Colors.text }}>
        Loading quiz...
      </Text>
    </View>
  );
}

if (error) {
  return (
    <View style={styles.container}>
      <Text style={{ color: Colors.text }}>
        {error}
      </Text>
    </View>
  );
}

if (!question) {
  return (
    <View style={styles.container}>
      <Text style={{ color: Colors.text }}>
        No quiz questions found for this lesson.
      </Text>
    </View>
  );
}

  const handleSelect = (optionId: QuestionOptionId) => {
    setSelectedOption(optionId);
  };

  const handleSubmit = async () => {
  if (!selectedOption) return;

  try {
    const updatedAnswers = [
      ...answers,
      {
        questionId: question.id,
        selectedOption,
      },
    ];

    setAnswers(updatedAnswers);

    // More questions remaining
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    // Final question → submit complete quiz
    console.log('SUBMITTING QUIZ:', updatedAnswers);

    const result = await apiPost<{
      results: {
        questionId: number;
        correct: boolean;
        score: number;
      }[];
      totalScore: number;
      totalQuestions: number;
      completed: boolean;
      xpEarned: number;
    }>(
      `/learning/lessons/${route.params.lessonId}/submit`,
      {
        answers: updatedAnswers,
      }
    );

    console.log('QUIZ SUBMIT RESULT:', result);

    // Calculate number of correct answers
    const correctCount = result.results.filter(
      (item) => item.correct
    ).length;

    console.log('CORRECT COUNT:', correctCount);

    // Mark lesson as completed and save progress
    const progressResult = await apiPost<{
      lessonId: number;
      completed: boolean;
      score: number;
      xpEarned: number;
    }>(
      `/learning/lessons/${route.params.lessonId}/complete`,
      {
        correctAnswers: correctCount,
      }
    );

    console.log('LESSON PROGRESS RESULT:', progressResult);

    // Go to result screen
    navigation.navigate('QuizResult', {
      lessonId: route.params.lessonId,
      totalQuestions: result.totalQuestions,
      correctCount,
      xpEarned: progressResult.xpEarned,
      currentStreakDays: 0,
    });

  } catch (error) {
    console.log('QUIZ SUBMIT ERROR:', error);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.progressLabel}>Question {questionIndex + 1} of {questions.length}</Text>
        <Text style={styles.hearts}>❤️❤️❤️</Text>
      </View>
      <Text style={styles.streak}>
  📝 Answered: {answers.length} / {questions.length}
</Text>

      <View style={styles.questionCard}>
        <Text style={styles.prompt}>{question.question}</Text>

{(['A', 'B', 'C', 'D'] as const).map((optionId) => {
  const optionText = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  }[optionId];

  const isSelected = selectedOption === optionId;

  return (
    <Pressable
      key={optionId}
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected,
      ]}
      onPress={() => handleSelect(optionId)}
    >
      <Text
        style={[
          styles.optionText,
          isSelected && styles.optionTextSelected,
        ]}
      >
        {optionText}
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