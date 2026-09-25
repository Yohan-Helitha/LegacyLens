// src/screens/learning/FlashcardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Polygon } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate, 
  withSpring,
  FadeIn
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { apiGet, apiPut } from '../../services/api/client';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { RefreshCcw } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Flashcard'>;

function PlayButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Defs>
          <LinearGradient id="playGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accent} />
            <Stop offset="1" stopColor={Colors.secondary} />
          </LinearGradient>
        </Defs>
        <Circle cx="12" cy="12" r="12" fill="url(#playGrad)" />
        <Polygon points="9.5,7.5 17,12 9.5,16.5" fill={Colors.white} />
      </Svg>
      <Text style={styles.playButtonText}>Pronunciation</Text>
    </Pressable>
  );
}



const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FlashcardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LearningStackParamList, 'Flashcard'>>();

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  

  const flipValue = useSharedValue(0);

  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        const data = await apiGet<any[]>(`/learning/lessons/${route.params.lessonId}/flashcards`);
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

  const safePause = () => {
    try { player.pause(); } catch (e) {}
  };

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    safePause();
    if (card?.audioUrl) player.replace({ uri: card.audioUrl });
  }, [card?.audioUrl]);

  useEffect(() => {
    return () => { safePause(); };
  }, []);

  const playPronunciation = async () => {
    if (!card?.audioUrl) return;
    try {
      await player.seekTo(0);
      await player.play();
    } catch (e) {}
  };



  const goNext = () => {
    flipValue.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setIndex((prev) => Math.min(prev + 1, cards.length - 1));
    }, 150);
  };

  const goPrev = () => {
    flipValue.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setIndex((prev) => Math.max(prev - 1, 0));
    }, 150);
  };

  const toggleFlip = () => {
    flipValue.value = withSpring(flipValue.value === 0 ? 1 : 0, { damping: 15, stiffness: 100 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      zIndex: flipValue.value < 0.5 ? 1 : 0,
      opacity: flipValue.value < 0.5 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      zIndex: flipValue.value > 0.5 ? 1 : 0,
      opacity: flipValue.value > 0.5 ? 1 : 0,
    };
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>Loading flashcards...</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 100 }}>No flashcards found.</Text>
      </View>
    );
  }

  const isFirst = index === 0;
  const isLast = index === cards.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Vocabulary Training</Text>
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

      <View style={styles.cardContainer}>
        {/* Front of Card */}
        <AnimatedPressable style={[styles.card, styles.cardFront, frontAnimatedStyle]} onPress={toggleFlip}>
          <View style={styles.flipHint}>
            <RefreshCcw size={16} color={Colors.textMuted} />
          </View>
          
          <Text style={styles.word}>{card.word}</Text>
          {card.audioUrl ? (
            <PlayButton onPress={playPronunciation} />
          ) : (
            <Text style={styles.hint}>No audio available</Text>
          )}
          

        </AnimatedPressable>

        {/* Back of Card */}
        <AnimatedPressable style={[styles.card, styles.cardBack, backAnimatedStyle]} onPress={toggleFlip}>
          <View style={styles.flipHint}>
            <RefreshCcw size={16} color={Colors.white} />
          </View>
          
          <Text style={styles.meaning}>{card.meaning}</Text>
          {card.culturalNote ? <Text style={styles.note}>{card.culturalNote}</Text> : null}
          {card.recordedBy ? <Text style={styles.recordedBy}>Recorded by: {card.recordedBy}</Text> : null}
        </AnimatedPressable>
      </View>

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
        style={({ pressed }) => [styles.quizButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={async () => {
          try {
            await apiPut(`/learning/progress/me/lessons/${route.params.lessonId}?completed=true&score=100&xpEarned=20`, {});
            navigation.goBack();
          } catch (error) {
            navigation.goBack();
          }
        }}
      >
        <Text style={styles.quizButtonText}>Complete Lesson</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  header: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: Colors.text },
  counter: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.textMuted },

  progressRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  progressDot: { flex: 1, height: 6, borderRadius: Radii.full, backgroundColor: Colors.surface },
  progressDotDone: { backgroundColor: Colors.secondary },
  progressDotActive: { backgroundColor: Colors.accent },

  cardContainer: {
    height: 420,
    marginBottom: Spacing.xl,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radii.xl + 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: Colors.white,
  },
  cardBack: {
    backgroundColor: Colors.secondaryDark,
  },
  flipHint: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL + 4,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    marginBottom: Spacing.md,
  },
  playButtonText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  

  hint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: Spacing.lg },
  meaning: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 4,
    color: Colors.white,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  note: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  recordedBy: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.accent },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  navButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  navButtonDisabled: { opacity: 0.3 },
  navButtonText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD },
  navButtonTextDisabled: { color: Colors.textMuted },

  quizButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quizButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD },
});