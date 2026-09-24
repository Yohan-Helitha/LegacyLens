// src/screens/learning/TrackDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Line } from 'react-native-svg';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { BookOpen, Headphones, HelpCircle, Check, Lock, Play, MapPin, Briefcase, Zap } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';
import { Track, Lesson } from '../../types/learning';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'TrackDetail'>;

function PulsingNode({ color, isCompleted }: { color: string; isCompleted: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (!isCompleted) {
      scale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(withTiming(0, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
        -1,
        true
      );
    }
  }, [isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      {!isCompleted && <Animated.View style={[styles.pulseRing, { backgroundColor: color }, animatedStyle]} />}
      <View style={[styles.coreNode, { backgroundColor: color }]}>
        {isCompleted ? <Check size={16} color={Colors.white} strokeWidth={3} /> : <Play size={14} color={Colors.white} fill={Colors.white} />}
      </View>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LessonNode({ item, index, activeLessonIndex, totalLessons, navigation }: any) {
  const isCompleted = item.completed;
  const isActive = index === activeLessonIndex;
  const isLocked = true; // index > activeLessonIndex;

  const isQuiz = item.type.toLowerCase() === 'quiz';
  const IconComponent = isQuiz ? HelpCircle : BookOpen;
  
  const nodeColor = isCompleted ? Colors.accent : isActive ? Colors.secondary : Colors.surface;
  const cardScale = useSharedValue(1);

  const onPressIn = () => { if (!isLocked) cardScale.value = withSpring(0.95); };
  const onPressOut = () => { cardScale.value = withSpring(1); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 150).springify()}>
      <View style={styles.lessonRow}>
        {/* Journey Path Line */}
        <View style={styles.pathLineContainer}>
          {index !== totalLessons - 1 && (
            <Svg height="100%" width="4" style={styles.pathLine}>
              <Line x1="2" y1="0" x2="2" y2="100%" stroke={isCompleted ? Colors.accent : Colors.surface} strokeWidth="4" strokeDasharray={isCompleted ? "0" : "8, 6"} />
            </Svg>
          )}
          {isLocked ? (
            <View style={[styles.coreNode, { backgroundColor: Colors.surface }]}>
              <Lock size={14} color={Colors.textMuted} />
            </View>
          ) : (
            <PulsingNode color={nodeColor} isCompleted={isCompleted} />
          )}
        </View>

        {/* Lesson Card */}
        <AnimatedPressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isLocked}
          style={[
            styles.lessonCard,
            isLocked && styles.lessonCardLocked,
            isActive && styles.lessonCardActive,
            animatedStyle
          ]}
          onPress={() => {
            isQuiz
              ? navigation.navigate('Quiz', { lessonId: item.lessonId })
              : navigation.navigate('Flashcard', { lessonId: item.lessonId })
          }}
        >
          <View style={[styles.lessonBadge, { backgroundColor: isLocked ? Colors.surface : Colors.secondarySubtle }]}>
            <IconComponent size={20} color={isLocked ? Colors.textMuted : Colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.lessonTitle, isLocked && { color: Colors.textMuted }]}>{item.title}</Text>
            <Text style={styles.lessonType}>{item.type}</Text>
          </View>
          {isActive && <Text style={styles.activeTag}>Up Next</Text>}
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

export default function TrackDetailScreen() {
  const route = useRoute<RouteProp<LearningStackParamList, 'TrackDetail'>>();
  const navigation = useNavigation<NavigationProp>();

  const [track, setTrack] = useState<Track | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const trackId = route.params.trackId;
        const trackDashboardData = await apiGet<any>(`/learning/dashboard/me/tracks/${trackId}`);

        setTrack({
          ...trackDashboardData,
          id: trackDashboardData.trackId,
          title: trackDashboardData.trackTitle,
        });
        setLessons(trackDashboardData.lessons);
      } catch (error: any) {
        console.log('Failed to load track:', error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };
    loadTrack();
  }, [route.params.trackId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading track...</Text>
      </View>
    );
  }

  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Track not found.</Text>
      </View>
    );
  }

  const completedLessons = track.completedLessons ?? 0;
  const progressPercent =
    track.totalLessons === 0
      ? 0
      : Math.round((completedLessons / track.totalLessons) * 100);

  // Determine the next active lesson
  const firstIncompleteIndex = lessons.findIndex((l: any) => !l.completed);
  const activeLessonIndex = firstIncompleteIndex === -1 ? lessons.length : firstIncompleteIndex;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={lessons}
        keyExtractor={(item: any) => String(item.lessonId)}
        renderItem={({ item, index }) => (
          <LessonNode 
            item={item} 
            index={index} 
            activeLessonIndex={activeLessonIndex} 
            totalLessons={lessons.length} 
            navigation={navigation} 
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={styles.heroCard}>
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
                <Defs>
                  <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={Colors.secondary} />
                    <Stop offset="1" stopColor={Colors.secondaryDark} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="60" fill="url(#heroGrad)" />
                <Circle cx="94" cy="4" r="24" fill={Colors.accent} opacity={0.18} />
              </Svg>

              <Text style={styles.heroTitle}>{track.title}</Text>
              <View style={styles.tagsRow}>
                <View style={styles.tagWrapper}>
                  <MapPin size={12} color={Colors.white} />
                  <Text style={styles.tag}>{track.region}</Text>
                </View>
                <View style={styles.tagWrapper}>
                  <Briefcase size={12} color={Colors.white} />
                  <Text style={styles.tag}>{track.occupation}</Text>
                </View>
                <View style={[styles.tagWrapper, styles.difficultyTagWrapper]}>
                  <Zap size={12} color={Colors.white} />
                  <Text style={styles.tag}>{track.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.description}>{track.description}</Text>

              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {completedLessons} of {track.totalLessons} lessons completed · {progressPercent}%
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>Your Journey</Text>
          </Animated.View>
        }
        ListFooterComponent={
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            {progressPercent >= 100 ? (
              <Pressable
                style={({ pressed }) => [styles.certificateButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => navigation.navigate('Certificate', { trackId: track.id.toString() })}
              >
                <Text style={styles.certificateButtonText}>🎓 View Certificate</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => {
                const nextLesson: any = lessons.find((l: any) => !l.completed) || lessons[0];
                if (!nextLesson) return;
                
                nextLesson.type.toLowerCase() === 'quiz'
                  ? navigation.navigate('Quiz', { lessonId: nextLesson.lessonId })
                  : navigation.navigate('Flashcard', { lessonId: nextLesson.lessonId });
              }}
            >
              <Text style={styles.continueButtonText}>Continue Learning</Text>
            </Pressable>
          </Animated.View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  list: { paddingBottom: Spacing.xl },

  heroCard: {
    overflow: 'hidden',
    borderRadius: Radii.xl + 4,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.white,
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
  },
  tag: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  difficultyTagWrapper: { backgroundColor: Colors.accent },
  description: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  progressBarBackground: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radii.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radii.sm },
  progressText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.sm,
  },

  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: Spacing.sm,
  },
  pathLineContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  pathLine: {
    position: 'absolute',
    top: 24,
    left: 18,
    bottom: -10,
    zIndex: -1,
  },
  pulseContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  coreNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  lessonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  lessonCardActive: {
    borderColor: Colors.secondarySubtle,
    backgroundColor: Colors.white,
    shadowOpacity: 0.1,
  },
  lessonCardLocked: {
    backgroundColor: Colors.dominant,
    borderWidth: 1,
    borderColor: Colors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  lessonBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1, color: Colors.text, marginBottom: 2 },
  lessonType: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  activeTag: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    color: Colors.secondary,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.md,
  },

  certificateButton: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  certificateButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },

  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM + 1 },
});