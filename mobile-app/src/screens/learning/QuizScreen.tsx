// src/screens/learning/QuizScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeInRight,
  FadeOutLeft
} from 'react-native-reanimated';
import { QuestionOptionId } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { apiGet, apiPost } from '../../services/api/client';

interface BackendQuizQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}
type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Quiz'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function QuizOption({ text, isSelected, onPress }: { text: string; isSelected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const onPressIn = () => { scale.value = withSpring(0.96); };
  const onPressOut = () => { scale.value = withSpring(1); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected,
        animatedStyle
      ]}
    >
      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {text}
      </Text>
    </AnimatedPressable>
  );
}

export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LearningStackParamList, 'Quiz'>>();

  const [answers, setAnswers] = useState<{ questionId: number; selectedOption: QuestionOptionId }[]>([]);
  const [questions, setQuestions] = useState<BackendQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<BackendQuizQuestion[]>(`/learning/lessons/${route.params.lessonId}/questions`);
        setQuestions(data);
      } catch (err) {
        setError('Could not load quiz questions.');
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [route.params.lessonId]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionId | null>(null);

  // Progress Bar Animation
  const progressPercent = questions.length > 0 ? (questionIndex / questions.length) * 100 : 0;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progressPercent, { duration: 500 });
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  const question = questions[questionIndex];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>Loading quiz...</Text>
      </View>
    );
  }

  if (error || !question) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>
          {error || 'No quiz questions found.'}
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
      const updatedAnswers = [...answers, { questionId: question.id, selectedOption }];
      setAnswers(updatedAnswers);

      if (questionIndex < questions.length - 1) {
        setQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        return;
      }

      // Submit
      const result = await apiPost<any>(`/learning/lessons/${route.params.lessonId}/submit`, { answers: updatedAnswers });
      const correctCount = result.results.filter((item: any) => item.correct).length;
      const progressResult = await apiPost<any>(`/learning/lessons/${route.params.lessonId}/complete`, { correctAnswers: correctCount });

      navigation.replace('QuizResult', {
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
      {/* Header & Progress */}
      <View style={styles.header}>
        <Text style={styles.progressLabel}>Question {questionIndex + 1} of {questions.length}</Text>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
      </View>

      <Animated.View 
        key={questionIndex} 
        entering={FadeInRight.duration(400)} 
        exiting={FadeOutLeft.duration(300)}
        style={{ flex: 1 }}
      >
        <View style={styles.questionCard}>
          <Text style={styles.prompt}>{question.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {(['A', 'B', 'C', 'D'] as const).map((optionId) => {
            const optionText = {
              A: question.optionA,
              B: question.optionB,
              C: question.optionC,
              D: question.optionD,
            }[optionId];

            return (
              <QuizOption
                key={optionId}
                text={optionText}
                isSelected={selectedOption === optionId}
                onPress={() => handleSelect(optionId)}
              />
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton, 
            !selectedOption && styles.submitButtonDisabled,
            pressed && selectedOption && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
          onPress={handleSubmit}
          disabled={!selectedOption}
        >
          <Text style={styles.submitButtonText}>
            {questionIndex < questions.length - 1 ? 'Continue' : 'Check Answers'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  header: { marginBottom: Spacing.xl },
  progressLabel: { 
    fontFamily: Typography.fontDisplay, 
    fontSize: Typography.sizeLG, 
    color: Colors.text,
    marginBottom: Spacing.sm
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full
  },

  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl + 4,
    padding: Spacing.xl,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: Spacing.xl,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prompt: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL - 2,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },

  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionButtonSelected: { 
    borderColor: Colors.secondary, 
    backgroundColor: Colors.secondarySubtle 
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioCircleSelected: {
    borderColor: Colors.secondary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  optionText: { 
    flex: 1,
    fontFamily: Typography.fontBodySemi, 
    fontSize: Typography.sizeMD, 
    color: Colors.text 
  },
  optionTextSelected: { 
    color: Colors.secondaryDark 
  },

  footer: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  submitButton: { 
    backgroundColor: Colors.secondary, 
    borderRadius: Radii.full, 
    paddingVertical: Spacing.md, 
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: { 
    backgroundColor: Colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: { 
    color: Colors.white, 
    fontFamily: Typography.fontBodySemi, 
    fontSize: Typography.sizeMD 
  },
});