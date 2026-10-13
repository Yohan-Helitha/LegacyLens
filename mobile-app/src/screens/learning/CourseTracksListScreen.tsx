// src/screens/learning/CourseTracksListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { MapPin, Briefcase, Zap, CheckCircle2, Sparkles, Bookmark, ArrowRight, RotateCcw, Trophy, BookOpen, BarChart2, Target, Compass, Library } from 'lucide-react-native';
import { Track } from '../../types/learning';
import { StudySetSummary } from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';
import { studyBuilderApi } from '../../services/api/studyBuilderApi';
import { learningStrings } from '../../constants/learningStrings';
import { mockTracks } from '../../constants/mockLearningData';
import { Header, UserFooter, UserTabKey } from '../../components/common';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'CourseTracksList'>;

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: Colors.secondary,
  Intermediate: Colors.accent,
  Advanced: Colors.secondaryDark,
};

/** Gradient progress bar fill, mango → teal. */
function GradientProgressFill({ percent }: { percent: number }) {
  return (
    <Svg width={`${Math.max(percent, 2)}%`} height={8}>
      <Defs>
        <LinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={Colors.accent} />
          <Stop offset="1" stopColor={Colors.secondary} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="8" rx="4" fill="url(#progressGrad)" />
    </Svg>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrackCard({ item, index, navigation }: { item: Track; index: number; navigation: NavigationProp }) {
  const completed = item.completedLessons ?? 0;
  const progressPercent = item.totalLessons
    ? Math.round((completed / item.totalLessons) * 100)
    : 0;
  const isComplete = progressPercent >= 100;
  const stripeColor = DIFFICULTY_COLOR[item.difficulty] ?? Colors.secondary;

  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <AnimatedPressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => navigation.navigate('TrackDetail', { trackId: String(item.id) })}
        style={[styles.card, animatedStyle]}
      >
        <View style={[styles.accentStripe, { backgroundColor: stripeColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {isComplete && (
              <View style={styles.completeBadge}>
                <CheckCircle2 size={12} color={Colors.secondary} strokeWidth={3} />
                <Text style={styles.completeBadgeText}>Done</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tagWrapper}>
              <MapPin size={12} color={Colors.secondary} />
              <Text style={styles.tag}>{item.region}</Text>
            </View>
            <View style={styles.tagWrapper}>
              <Briefcase size={12} color={Colors.secondary} />
              <Text style={styles.tag}>{item.occupation}</Text>
            </View>
            <View style={[styles.tagWrapper, styles.difficultyTagWrapper]}>
              <Zap size={12} color={stripeColor} />
              <Text style={[styles.tag, { color: stripeColor }]}>{item.difficulty}</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <GradientProgressFill percent={progressPercent} />
          </View>
          <View style={styles.cardFooterRow}>
            <Text style={styles.progressText}>
              {completed} of {item.totalLessons} lessons · {progressPercent}%
            </Text>
            <View style={[styles.resumeActionBadge, { backgroundColor: isComplete ? Colors.secondarySubtle : completed > 0 ? Colors.accent : Colors.secondary }]}>
              <Text style={[styles.resumeActionText, { color: isComplete ? Colors.secondary : Colors.white }]}>
                {isComplete ? 'Review' : completed > 0 ? 'Resume' : 'Start'}
              </Text>
              <ArrowRight size={12} color={isComplete ? Colors.secondary : Colors.white} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function StudySetCard({ item, navigation }: { item: StudySetSummary; navigation: NavigationProp }) {
  return (
    <View style={styles.studySetCard}>
      <View style={styles.studySetCardTopRow}>
        <View style={styles.privatePill}>
          <Text style={styles.privatePillText}>{learningStrings.studySets.privateBadge}</Text>
        </View>
        <Text style={styles.studySetLessonsCount}>
          {item.totalLessons} {item.totalLessons === 1 ? 'lesson' : 'lessons'}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.tagsRow}>
        {item.region ? (
          <View style={styles.tagWrapper}>
            <MapPin size={12} color={Colors.secondary} />
            <Text style={styles.tag}>{item.region}</Text>
          </View>
        ) : null}
        {item.occupation ? (
          <View style={styles.tagWrapper}>
            <Briefcase size={12} color={Colors.secondary} />
            <Text style={styles.tag}>{item.occupation}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.studySetStatsRow}>
        <Text style={styles.statsText}>{learningStrings.studySets.attemptsCount(item.attemptCount)}</Text>
        {item.bestScore !== undefined && item.bestScore !== null ? (
          <View style={styles.bestScoreWrapper}>
            <Trophy size={12} color={Colors.accent} />
            <Text style={styles.bestScoreText}>Best: {item.bestScore} pts</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.studySetActionsRow}>
        <Pressable
          onPress={() => navigation.navigate('TrackDetail', { trackId: String(item.id) })}
          style={styles.openTrackBtn}
          accessibilityRole="button"
          accessibilityLabel={`Open track ${item.title}`}
        >
          <BookOpen size={15} color={Colors.white} />
          <Text style={styles.openTrackBtnText}>{learningStrings.studySets.openTrackCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('StudySetRetake', { trackId: item.id, title: item.title })}
          style={styles.retakeQuizBtn}
          accessibilityRole="button"
          accessibilityLabel={`Retake quiz for ${item.title}`}
        >
          <RotateCcw size={15} color={Colors.secondary} />
          <Text style={styles.retakeQuizBtnText}>{learningStrings.studySets.retakeCta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CourseTracksListScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [studySets, setStudySets] = useState<StudySetSummary[]>([]);
  const [selectedTab, setSelectedTab] = useState<'community' | 'studySets'>('community');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  const loadTracks = async () => {
    try {
      const [tracksData, progressData, studySetsData] = await Promise.all([
        apiGet<Track[]>('/learning/tracks'),
        apiGet<any[]>('/learning/progress/tracks/me').catch(() => []),
        studyBuilderApi.getMyStudySets().catch(() => []),
      ]);

      const progressMap = new Map(progressData.map((p: any) => [p.trackId, p]));
      
      const mergedTracks = tracksData.map((track) => {
        const progress = progressMap.get(track.id);
        if (progress) {
          return {
            ...track,
            completedLessons: progress.completedLessons,
          };
        }
        return {
          ...track,
          completedLessons: 0,
        };
      });

      if (mergedTracks.length > 0) {
        setTracks(mergedTracks);
      } else {
        setTracks(mockTracks);
      }
      setStudySets(studySetsData);
    } catch (error: any) {
      console.log('Failed to load learning tracks, using mock fallback:', error?.message ?? error);
      setTracks(mockTracks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const handleTabSelect = (tab: UserTabKey) => {
    if (tab === 'learn') {
      return;
    }
    if (tab === 'market') {
      (navigation as any).navigate('Creator');
      return;
    }
    if (tab === 'home' || tab === 'map' || tab === 'profile') {
      (navigation as any).navigate('User', { initialTab: tab });
      return;
    }
  };

  const handleHeaderNavigate = (tab: string) => {
    if (tab === 'admin_home') {
      (navigation as any).replace('Admin');
    } else {
      (navigation as any).navigate('User');
    }
  };

  return (
    <View style={styles.rootContainer}>
      <Header
        title="Legacy Lens"
        showBack={true}
        onBackPress={() => (navigation as any).navigate('User', { initialTab: 'home' })}
        onNavigate={handleHeaderNavigate}
      />

      <View style={styles.contentContainer}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>{learningStrings.home.subtitle}</Text>
          <Text style={styles.header}>{learningStrings.home.title}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.progressButton, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('ProgressTracking')}
          accessibilityRole="button"
          accessibilityLabel={learningStrings.home.progressButton}
        >
          <BarChart2 size={16} color={Colors.secondary} />
          <Text style={styles.progressButtonText}>{learningStrings.home.progressButton}</Text>
        </Pressable>
      </Animated.View>

      {/* AI Study Builder Hero Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.aiHeroCard}>
        <View style={styles.aiHeroHeader}>
          <View style={styles.aiIconBadge}>
            <Sparkles size={18} color={Colors.white} />
          </View>
          <View style={styles.aiHeroTextWrapper}>
            <Text style={styles.aiHeroTitle}>{learningStrings.home.aiBuilderCtaTitle}</Text>
            <Text style={styles.aiHeroSubtitle}>{learningStrings.home.aiBuilderCtaSubtitle}</Text>
          </View>
        </View>

        <View style={styles.aiHeroActionsRow}>
          <Pressable
            onPress={() => navigation.navigate('StudyBuilderSelect')}
            style={styles.aiHeroCtaBtn}
            accessibilityRole="button"
            accessibilityLabel={learningStrings.home.aiBuilderButton}
          >
            <Sparkles size={16} color={Colors.white} />
            <Text style={styles.aiHeroCtaText} numberOfLines={1}>{learningStrings.home.aiBuilderButton}</Text>
            <ArrowRight size={16} color={Colors.white} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('WeakWordReview')}
            style={styles.aiHeroReviewBtn}
            accessibilityRole="button"
            accessibilityLabel="Weak Words Review"
          >
            <Target size={16} color={Colors.secondary} />
            <Text style={styles.aiHeroReviewText} numberOfLines={1}>Review</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Segmented Tab Bar */}
      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setSelectedTab('community')}
          style={[styles.segmentedTab, selectedTab === 'community' && styles.segmentedTabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedTab === 'community' }}
          accessibilityLabel={`${learningStrings.home.communityTab}, ${tracks.length} tracks`}
        >
          <Compass size={16} color={selectedTab === 'community' ? Colors.white : Colors.secondary} />
          <Text style={[styles.segmentedTabText, selectedTab === 'community' && styles.segmentedTabTextActive]}>
            {learningStrings.home.communityTab} ({tracks.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('studySets')}
          style={[styles.segmentedTab, selectedTab === 'studySets' && styles.segmentedTabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedTab === 'studySets' }}
          accessibilityLabel={`${learningStrings.home.myStudySetsTab}, ${studySets.length} sets`}
        >
          <Library size={16} color={selectedTab === 'studySets' ? Colors.white : Colors.secondary} />
          <Text style={[styles.segmentedTabText, selectedTab === 'studySets' && styles.segmentedTabTextActive]}>
            {learningStrings.home.myStudySetsTab} ({studySets.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading learning content...</Text>
      ) : selectedTab === 'community' ? (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <TrackCard item={item} index={index} navigation={navigation} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{learningStrings.home.noTracks}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={studySets}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <StudySetCard item={item} navigation={navigation} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={36} color={Colors.accent} />
              <Text style={styles.emptyTitle}>No Study Sets Yet</Text>
              <Text style={styles.emptyText}>{learningStrings.home.noStudySets}</Text>
              <Pressable
                onPress={() => navigation.navigate('StudyBuilderSelect')}
                style={styles.emptyCtaButton}
                accessibilityRole="button"
              >
                <Sparkles size={16} color={Colors.white} />
                <Text style={styles.emptyCtaButtonText}>Build Study Set with AI</Text>
              </Pressable>
            </View>
          }
        />
      )}
      </View>

      <UserFooter activeTab="learn" onTabSelect={handleTabSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
    marginBottom: 2,
  },
  header: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL + 2,
    color: Colors.text,
  },
  progressButton: {
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  progressButtonText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.secondary },
  loadingText: { fontFamily: Typography.fontBody, color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
  list: { paddingBottom: Spacing.xl },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl + 4,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  accentStripe: { width: 6 },
  cardBody: { flex: 1, padding: Spacing.lg },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  cardTitle: {
    flex: 1,
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    lineHeight: 26,
    paddingRight: Spacing.sm,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  completeBadgeText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS },

  cardDescription: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
  },
  difficultyTagWrapper: { backgroundColor: Colors.accentSubtle },
  tag: {
    color: Colors.secondary,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  progressText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resumeActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  resumeActionText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    fontWeight: '700',
  },
  aiHeroCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  aiHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHeroTextWrapper: {
    flex: 1,
  },
  aiHeroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.white,
    lineHeight: 22,
  },
  aiHeroSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 16,
    marginTop: 2,
  },
  aiHeroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  aiHeroCtaBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  aiHeroCtaText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
    fontWeight: '700',
  },
  aiHeroReviewBtn: {
    minHeight: 44,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  aiHeroReviewEmoji: {
    fontSize: 14,
  },
  aiHeroReviewText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  sectionCountText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  myStudySetsPillActive: {
    backgroundColor: Colors.secondaryDark,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentedTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radii.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  segmentedTabActive: {
    backgroundColor: Colors.secondary,
  },
  segmentedTabText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  segmentedTabTextActive: {
    color: Colors.white,
  },
  studySetCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: Colors.accent,
  },
  studySetCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  privatePill: {
    backgroundColor: Colors.secondarySubtle,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  privatePillText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    color: Colors.secondary,
  },
  studySetLessonsCount: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  studySetStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statsText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  bestScoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSubtle,
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestScoreText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    color: Colors.accent,
  },
  studySetActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  openTrackBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openTrackBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
  },
  retakeQuizBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.secondarySubtle,
  },
  retakeQuizBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCtaButton: {
    marginTop: Spacing.md,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyCtaButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
  },
});