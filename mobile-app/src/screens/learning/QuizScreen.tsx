// src/screens/learning/QuizScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { mockQuizQuestions } from '../../constants/mockLearningData';
import { QuestionOptionId } from '../../types/learning';

const CURRENT_LESSON_ID = 'lesson-2';

export default function QuizScreen() {
  const questions = mockQuizQuestions.filter((q) => q.lessonId === CURRENT_LESSON_ID);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionId | null>(null);
  const [score, setScore] = useState(0);

  const question = questions[questionIndex];

  if (!question) {
    return (
      <View style={styles.container}>
        <Text>No quiz questions found for this lesson.</Text>
      </View>
    );
  }

  const handleSelect = (optionId: QuestionOptionId) => {
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    if (selectedOption === question.correctOptionId) {
      setScore((prev) => prev + 1);
    }
    // Move to next question, or this is where we'd navigate to QuizResultScreen
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Last question answered — navigation to QuizResultScreen will go here
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
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#6D4C41', fontWeight: '600' },
  hearts: { fontSize: 14 },
  streak: { fontSize: 13, color: '#C9782E', fontWeight: '700', marginBottom: 20 },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 24,
  },
  prompt: { fontSize: 16, color: '#6D4C41', marginBottom: 8, textAlign: 'center' },
  word: { fontSize: 26, fontWeight: '800', color: '#3E2723', textAlign: 'center', marginBottom: 20 },
  optionButton: {
    borderWidth: 1.5,
    borderColor: '#EFE3D0',
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  optionButtonSelected: { borderColor: '#C9782E', backgroundColor: '#F9E8D5' },
  optionText: { fontSize: 15, color: '#3E2723', fontWeight: '600' },
  optionTextSelected: { color: '#C9782E' },
  submitButton: { backgroundColor: '#C9782E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#E8D5BC' },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});