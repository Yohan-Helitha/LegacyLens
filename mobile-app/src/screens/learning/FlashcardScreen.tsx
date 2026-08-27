// src/screens/learning/FlashcardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { apiGet } from '../../services/api/client';
type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Flashcard'>;

export default function FlashcardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LearningStackParamList, 'Flashcard'>>();

console.log('SELECTED LESSON ID:', route.params.lessonId);

  const [cards, setCards] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadFlashcards = async () => {
    try {
      const data = await apiGet<any[]>(
        `/learning/lessons/${route.params.lessonId}/flashcards`
      );

      console.log('FLASHCARDS:', data);

      setCards(data);
    } catch (error: any) {
      console.log('FLASHCARD ERROR:', error);
      console.log('FLASHCARD ERROR MESSAGE:', error?.message);
      console.log('FLASHCARD ERROR STATUS:', error?.status);
      console.log('FLASHCARD FIELD ERRORS:', error?.fieldErrors);
    } finally {
      setLoading(false);
    }
  };

  loadFlashcards();
}, [route.params.lessonId]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  const goNext = () => {
    setFlipped(false);
    setIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
  return (
    <View style={styles.container}>
      <Text style={{ color: Colors.text }}>
        Loading flashcards...
      </Text>
    </View>
  );
}

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>No flashcards found for this lesson.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Boat Parts Vocabulary</Text>
        <Text style={styles.counter}>{index + 1} / {cards.length}</Text>
      </View>

      <Pressable style={styles.card} onPress={() => setFlipped(!flipped)}>
        {!flipped ? (
          <>
            <Text style={styles.word}>{card.word}</Text>
            <Pressable style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play Pronunciation</Text>
            </Pressable>
            <Text style={styles.hint}>Tap to flip</Text>
          </>
        ) : (
          <>
            <Text style={styles.meaning}>{card.meaning}</Text>
            {card.culturalNote ? <Text style={styles.note}>{card.culturalNote}</Text> : null}
            {card.recordedBy ? <Text style={styles.recordedBy}>Recorded by: {card.recordedBy}</Text> : null}
          </>
        )}
      </Pressable>

      <View style={styles.navRow}>
        <Pressable style={styles.navButton} onPress={goPrev}>
          <Text style={styles.navButtonText}>← Previous</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={goNext}>
          <Text style={styles.navButtonText}>Next →</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.quizButton}
        onPress={() =>
  navigation.navigate('Quiz', {
    lessonId: route.params.lessonId,
  })
}
      >
        <Text style={styles.quizButtonText}>Take Quiz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg - 4 },
  header: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.text },
  counter: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS + 1, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: Spacing.lg - 4,
  },
  word: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    color: Colors.text,
    marginBottom: Spacing.lg - 4,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.lg,
    marginBottom: Spacing.lg - 4,
  },
  playButtonText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  hint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },
  meaning: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL - 2,
    color: Colors.text,
    marginBottom: Spacing.sm + 4,
    textAlign: 'center',
  },
  note: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm + 4,
  },
  recordedBy: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.secondary, fontStyle: 'italic' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg - 4 },
  navButton: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md },
  navButtonText: { color: Colors.accent, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  quizButton: { backgroundColor: Colors.accent, borderRadius: Radii.lg + 2, paddingVertical: Spacing.sm + 6, alignItems: 'center' },
  quizButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});