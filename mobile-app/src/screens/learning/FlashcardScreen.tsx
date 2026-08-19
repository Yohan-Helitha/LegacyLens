// src/screens/learning/FlashcardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { mockFlashcards } from '../../constants/mockLearningData';

// Hardcoded for now — later this comes from navigation params (lessonId)
const CURRENT_LESSON_ID = 'lesson-1';

export default function FlashcardScreen() {
  const cards = mockFlashcards.filter((c) => c.lessonId === CURRENT_LESSON_ID);
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

  if (!card) {
    return (
      <View style={styles.container}>
        <Text>No flashcards found for this lesson.</Text>
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

      <Pressable style={styles.quizButton}>
        <Text style={styles.quizButtonText}>Take Quiz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 18, fontWeight: '700', color: '#3E2723' },
  counter: { fontSize: 13, color: '#6D4C41' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 20,
  },
  word: { fontSize: 32, fontWeight: '800', color: '#3E2723', marginBottom: 20, textAlign: 'center' },
  playButton: {
    backgroundColor: '#F4E1C6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  playButtonText: { color: '#8D6E38', fontWeight: '700' },
  hint: { fontSize: 12, color: '#9B7653' },
  meaning: { fontSize: 22, fontWeight: '700', color: '#3E2723', marginBottom: 12, textAlign: 'center' },
  note: { fontSize: 13, color: '#6D4C41', textAlign: 'center', marginBottom: 12 },
  recordedBy: { fontSize: 12, color: '#9B7653', fontStyle: 'italic' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  navButton: { paddingVertical: 10, paddingHorizontal: 16 },
  navButtonText: { color: '#C9782E', fontWeight: '700' },
  quizButton: { backgroundColor: '#C9782E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  quizButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});