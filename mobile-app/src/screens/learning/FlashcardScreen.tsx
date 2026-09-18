// src/screens/learning/FlashcardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Polygon } from 'react-native-svg';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { apiGet, apiPostMultiPart } from '../../services/api/client';
import { useAudioPlayer, setAudioModeAsync, useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Flashcard'>;

/** Circular gradient play button with a triangle glyph drawn in SVG. */
function PlayButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}>
      <Svg width={22} height={22} viewBox="0 0 22 22">
        <Defs>
          <LinearGradient id="playGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accent} />
            <Stop offset="1" stopColor={Colors.secondary} />
          </LinearGradient>
        </Defs>
        <Circle cx="11" cy="11" r="11" fill="url(#playGrad)" />
        <Polygon points="8.5,6.5 16,11 8.5,15.5" fill={Colors.white} />
      </Svg>
      <Text style={styles.playButtonText}>Play Pronunciation</Text>
    </Pressable>
  );
}

function RecordButton({ isRecording, onPress, disabled }: { isRecording: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.recordButton, isRecording && styles.recordButtonActive, pressed && styles.recordButtonPressed, disabled && styles.recordButtonDisabled]}>
      <Text style={[styles.recordButtonText, isRecording && styles.recordButtonTextActive]}>
        {isRecording ? '⏹ Stop Recording' : '🎙 Record Pronunciation'}
      </Text>
    </Pressable>
  );
}

export default function FlashcardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LearningStackParamList, 'Flashcard'>>();

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        const data = await apiGet<any[]>(
          `/learning/lessons/${route.params.lessonId}/flashcards`
        );
        setCards(data);
      } catch (error: any) {
        console.log('FLASHCARD ERROR:', error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };

    loadFlashcards();
  }, [route.params.lessonId]);

  const card = cards[index];

  const player = useAudioPlayer(card?.audioUrl ? { uri: card.audioUrl } : null);

  // expo-audio can release the native player object before React runs our
  // cleanup (e.g. on unmount / fast navigation). Calling pause() on it then
  // throws "Unable to find the native shared object..." — harmless in that
  // case, since there's nothing left to pause. Swallow it here.
  const safePause = () => {
    try {
      player.pause();
    } catch (error: any) {
      console.log('AUDIO PAUSE (already released):', error?.message ?? error);
    }
  };

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch((err) =>
      console.log('AUDIO MODE ERROR:', err?.message ?? err)
    );
  }, []);

  useEffect(() => {
    safePause();
    if (card?.audioUrl) {
      player.replace({ uri: card.audioUrl });
    }
  }, [card?.audioUrl]);

  // Stop playback if the learner navigates away from this screen entirely
  // (e.g. backs out mid-clip or jumps to the quiz).
  useEffect(() => {
    return () => {
      safePause();
    };
  }, []);

  const playPronunciation = async () => {
    if (!card?.audioUrl) return;
    try {
      await player.seekTo(0);
      await player.play();
    } catch (error: any) {
      console.log('AUDIO PLAY ERROR:', error?.message ?? error);
    }
  };

  const toggleRecording = async () => {
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
        
        const uri = audioRecorder.uri;
        if (uri) {
          submitRecording(uri);
        }
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (permission.status === 'granted') {
          await audioRecorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
          audioRecorder.record();
        } else {
          console.log('Recording permission not granted');
        }
      }
    } catch (error) {
      console.log('RECORDING ERROR:', error);
    }
  };

  const submitRecording = async (uri: string) => {
    if (!card?.id) return;
    setEvaluating(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'pronunciation.m4a',
        type: 'audio/m4a',
      } as any);

      const res = await apiPostMultiPart<{ passed: boolean; score: number; feedback: string }>(
        `/learning/flashcards/${card.id}/evaluate-pronunciation`,
        formData
      );
      setResult(res);
    } catch (error) {
      console.log('EVALUATE ERROR:', error);
      setResult({ passed: false, score: 0, feedback: 'Failed to evaluate audio.' });
    } finally {
      setEvaluating(false);
    }
  };

  const goNext = () => {
    setFlipped(false);
    setResult(null);
    setIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setResult(null);
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading flashcards...</Text>
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

  const isFirst = index === 0;
  const isLast = index === cards.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Boat Parts Vocabulary</Text>
        <Text style={styles.counter}>{index + 1} / {cards.length}</Text>
      </View>

      <View style={styles.progressRow}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === index && styles.progressDotActive,
              i < index && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      <Pressable style={styles.card} onPress={() => setFlipped(!flipped)}>
        <View style={styles.flipHint}>
          <Text style={styles.flipHintText}>⟳</Text>
        </View>

        {!flipped ? (
          <>
            <Text style={styles.word}>{card.word}</Text>
            {card.audioUrl ? (
              <PlayButton onPress={playPronunciation} />
            ) : (
              <Text style={styles.hint}>No audio for this word</Text>
            )}
            
            <RecordButton 
              isRecording={audioRecorder.isRecording} 
              onPress={toggleRecording}
              disabled={evaluating}
            />
            
            {evaluating && (
              <Text style={styles.evaluatingText}>Evaluating pronunciation...</Text>
            )}
            
            {result && !evaluating && (
              <View style={[styles.resultCard, result.passed ? styles.resultPass : styles.resultFail]}>
                <Text style={styles.resultScore}>{result.score}/100 - {result.passed ? 'Pass' : 'Try Again'}</Text>
                <Text style={styles.resultFeedback}>{result.feedback}</Text>
              </View>
            )}

            <Text style={styles.tapHint}>Tap card to flip</Text>
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
        <Pressable
          style={[styles.navButton, isFirst && styles.navButtonDisabled]}
          onPress={goPrev}
          disabled={isFirst}
        >
          <Text style={[styles.navButtonText, isFirst && styles.navButtonTextDisabled]}>← Previous</Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, isLast && styles.navButtonDisabled]}
          onPress={goNext}
          disabled={isLast}
        >
          <Text style={[styles.navButtonText, isLast && styles.navButtonTextDisabled]}>Next →</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.quizButton, pressed && styles.quizButtonPressed]}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  header: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.text },
  counter: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS + 1, color: Colors.textMuted },

  progressRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg - 4 },
  progressDot: { flex: 1, height: 4, borderRadius: Radii.full, backgroundColor: Colors.surface },
  progressDotDone: { backgroundColor: Colors.secondary },
  progressDotActive: { backgroundColor: Colors.accent },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: Spacing.lg - 4,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  flipHint: {
    position: 'absolute',
    top: Spacing.sm + 2,
    right: Spacing.sm + 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dominant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipHintText: { fontSize: 15, color: Colors.textMuted },
  word: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    color: Colors.text,
    marginBottom: Spacing.lg - 4,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.full,
    marginBottom: Spacing.lg - 4,
  },
  playButtonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  playButtonText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  
  recordButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.full,
    marginBottom: Spacing.lg - 4,
  },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  recordButtonPressed: { opacity: 0.8 },
  recordButtonDisabled: { opacity: 0.5 },
  recordButtonText: { color: Colors.text, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  recordButtonTextActive: { color: Colors.white },
  
  evaluatingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.accent, marginBottom: Spacing.sm },
  
  resultCard: {
    padding: Spacing.sm,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  resultPass: { backgroundColor: 'rgba(52, 199, 89, 0.15)' },
  resultFail: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  resultScore: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.text },
  resultFeedback: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  hint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.lg - 4 },
  tapHint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },
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
  navButtonDisabled: { opacity: 0.35 },
  navButtonText: { color: Colors.accent, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  navButtonTextDisabled: { color: Colors.textMuted },

  quizButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quizButtonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  quizButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});