// mobile-app/src/screens/learning/StudyBuilderGenerateScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Trash2,
  Layers,
  HelpCircle,
  BookOpen,
  Quote,
  ArrowLeft,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { studyBuilderApi } from '../../services/api/studyBuilderApi';
import { StudyJobResponse, GeneratedStudySet } from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'StudyBuilderGenerate'>;
type RouteProps = RouteProp<LearningStackParamList, 'StudyBuilderGenerate'>;

export default function StudyBuilderGenerateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { jobRequest } = route.params;

  const [job, setJob] = useState<StudyJobResponse | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [savingSet, setSavingSet] = useState(false);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'course'>('flashcards');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startGeneration();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startGeneration = async () => {
    setLoadingJob(true);
    try {
      const initiatedJob = await studyBuilderApi.createJob(jobRequest);
      setJob(initiatedJob);

      if (initiatedJob.status === 'SUCCEEDED' || initiatedJob.status === 'FAILED') {
        setLoadingJob(false);
        return;
      }

      // Begin polling every 2 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const polled = await studyBuilderApi.getJob(initiatedJob.jobId);
          setJob(polled);
          if (polled.status === 'SUCCEEDED' || polled.status === 'FAILED') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setLoadingJob(false);
          }
        } catch (err: any) {
          console.log('Error polling job status:', err?.message ?? err);
        }
      }, 2000);
    } catch (error: any) {
      console.log('Failed to start generation job:', error?.message ?? error);
      Alert.alert(learningStrings.common.errorTitle, error?.message || 'Could not initiate generation job.');
      setLoadingJob(false);
    }
  };

  const handleCancel = async () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (job?.jobId) {
      try {
        await studyBuilderApi.deleteJob(job.jobId);
      } catch (ignored) {}
    }
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!job?.jobId) return;
    setSavingSet(true);
    try {
      const result = await studyBuilderApi.saveJob(job.jobId);
      Alert.alert('Saved!', 'Your study set has been saved to "My Study Sets".', [
        {
          text: 'Open Track',
          onPress: () => navigation.navigate('TrackDetail', { trackId: String(result.trackId) }),
        },
        {
          text: 'View My Study Sets',
          onPress: () => navigation.navigate('MyStudySets'),
        },
      ]);
    } catch (error: any) {
      console.log('Failed to save study set:', error?.message ?? error);
      Alert.alert(learningStrings.common.errorTitle, error?.message || 'Failed to save study set.');
    } finally {
      setSavingSet(false);
    }
  };

  const handleDiscard = async () => {
    if (job?.jobId) {
      try {
        await studyBuilderApi.deleteJob(job.jobId);
      } catch (ignored) {}
    }
    navigation.navigate('CourseTracksList');
  };

  // State 1: In Progress
  if (loadingJob || (job && job.status !== 'SUCCEEDED' && job.status !== 'FAILED')) {
    return (
      <View style={styles.centerContainer}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.loadingBox}>
          <View style={styles.sparkleRing}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
          <Text style={styles.generatingTitle}>{learningStrings.builder.step3Title}</Text>
          <Text style={styles.generatingSubtitle}>{learningStrings.builder.step3Subtitle}</Text>

          <View style={styles.statusIndicatorCard}>
            <Text style={styles.statusText}>
              {job?.status === 'QUEUED'
                ? learningStrings.builder.progressMsgQueued
                : learningStrings.builder.progressMsgRunning}
            </Text>
          </View>

          <Pressable
            onPress={handleCancel}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel={learningStrings.builder.cancelButton}
          >
            <Text style={styles.cancelBtnText}>{learningStrings.builder.cancelButton}</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // State 2: Failed
  if (job?.status === 'FAILED') {
    return (
      <View style={styles.centerContainer}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.errorBox}>
          <AlertTriangle size={48} color={Colors.accent} />
          <Text style={styles.errorTitle}>{learningStrings.builder.generationFailedTitle}</Text>
          <Text style={styles.errorReason}>
            {job.failureReason || 'Failed to generate grounded content matching your specifications.'}
          </Text>

          <Pressable onPress={startGeneration} style={styles.retryBtn} accessibilityRole="button">
            <Text style={styles.retryBtnText}>{learningStrings.builder.tryAgainButton}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.goBack()} style={styles.backSelectBtn} accessibilityRole="button">
            <Text style={styles.backSelectBtnText}>{learningStrings.builder.chooseDifferentContent}</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // State 3: Succeeded (Preview & Save)
  const preview: GeneratedStudySet | undefined = job?.preview;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
        {/* Top Back Row & AI Badge */}
        <View style={styles.topBackRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Configure"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.aiBadgeRow}>
            <Sparkles size={14} color={Colors.secondary} />
            <Text style={styles.aiBadgeText}>{learningStrings.builder.previewBadge}</Text>
          </Animated.View>
        </View>

        {/* Course Header */}
        <Text style={styles.courseTitle}>{preview?.courseTitle ?? 'Custom Study Set'}</Text>
        {preview?.courseDescription ? (
          <Text style={styles.courseDescription}>{preview.courseDescription}</Text>
        ) : null}

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('flashcards')}
            style={[styles.tabButton, activeTab === 'flashcards' && styles.tabButtonActive]}
          >
            <Layers size={16} color={activeTab === 'flashcards' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'flashcards' && styles.tabTextActive]}>
              {learningStrings.builder.flashcardsTab} ({preview?.flashcards?.length ?? 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('quiz')}
            style={[styles.tabButton, activeTab === 'quiz' && styles.tabButtonActive]}
          >
            <HelpCircle size={16} color={activeTab === 'quiz' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'quiz' && styles.tabTextActive]}>
              {learningStrings.builder.quizTab} ({preview?.quizQuestions?.length ?? 0})
            </Text>
          </Pressable>

          {preview?.lessons && preview.lessons.length > 0 && (
            <Pressable
              onPress={() => setActiveTab('course')}
              style={[styles.tabButton, activeTab === 'course' && styles.tabButtonActive]}
            >
              <BookOpen size={16} color={activeTab === 'course' ? Colors.white : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'course' && styles.tabTextActive]}>
                {learningStrings.builder.courseTab}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tab 1: Flashcards Preview */}
        {activeTab === 'flashcards' && (
          <View style={styles.cardsContainer}>
            {preview?.flashcards && preview.flashcards.length > 0 ? (
              preview.flashcards.map((fc, idx) => (
                <View key={idx} style={styles.previewCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.wordTitle}>{fc.word}</Text>
                    <View style={styles.verifiedPill}>
                      <CheckCircle2 size={12} color={Colors.secondary} />
                      <Text style={styles.verifiedText}>Grounded</Text>
                    </View>
                  </View>
                  <Text style={styles.meaningText}>{fc.meaning}</Text>
                  {fc.culturalNote ? (
                    <Text style={styles.culturalNoteText}>Note: {fc.culturalNote}</Text>
                  ) : null}
                  {fc.evidence ? (
                    <View style={styles.evidenceBox}>
                      <Quote size={12} color={Colors.textMuted} />
                      <Text style={styles.evidenceText}>"{fc.evidence}"</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyTabText}>No flashcards generated for this set.</Text>
            )}
          </View>
        )}

        {/* Tab 2: Quiz Preview */}
        {activeTab === 'quiz' && (
          <View style={styles.cardsContainer}>
            {preview?.quizQuestions && preview.quizQuestions.length > 0 ? (
              preview.quizQuestions.map((q, idx) => (
                <View key={idx} style={styles.previewCard}>
                  <Text style={styles.questionPrompt}>
                    Q{idx + 1}. {q.question}
                  </Text>
                  <View style={styles.optionsList}>
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const optText = (q as any)[`option${optKey}`];
                      const isCorrect = q.correctOption === optKey;
                      return (
                        <View
                          key={optKey}
                          style={[styles.optionItem, isCorrect && styles.optionItemCorrect]}
                        >
                          <Text style={[styles.optionKey, isCorrect && styles.optionKeyCorrect]}>
                            {optKey}.
                          </Text>
                          <Text style={[styles.optionVal, isCorrect && styles.optionValCorrect]}>
                            {optText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {q.evidence ? (
                    <View style={styles.evidenceBox}>
                      <Quote size={12} color={Colors.textMuted} />
                      <Text style={styles.evidenceText}>Evidence: "{q.evidence}"</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyTabText}>No quiz questions generated for this set.</Text>
            )}
          </View>
        )}

        {/* Tab 3: Course Outline Preview */}
        {activeTab === 'course' && (
          <View style={styles.cardsContainer}>
            {preview?.lessons?.map((les, idx) => (
              <View key={idx} style={styles.previewCard}>
                <Text style={styles.wordTitle}>
                  Lesson {idx + 1}: {les.title}
                </Text>
                <Text style={styles.meaningText}>{les.description}</Text>
                <View style={styles.tagWrapper}>
                  <Text style={styles.tagText}>{les.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Save / Discard Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleDiscard}
          style={styles.discardBtn}
          accessibilityRole="button"
          accessibilityLabel={learningStrings.builder.previewDiscardCta}
        >
          <Trash2 size={18} color={Colors.textMuted} />
          <Text style={styles.discardBtnText}>{learningStrings.builder.previewDiscardCta}</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={savingSet}
          style={styles.saveBtn}
          accessibilityRole="button"
          accessibilityLabel={learningStrings.builder.previewSaveCta}
        >
          {savingSet ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Bookmark size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>{learningStrings.builder.previewSaveCta}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 54,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.dominant,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingBox: {
    alignItems: 'center',
    width: '100%',
  },
  sparkleRing: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  generatingTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  generatingSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statusIndicatorCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  statusText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    width: '100%',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  errorTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorReason: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  retryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.white,
  },
  backSelectBtn: {
    paddingVertical: Spacing.sm,
  },
  backSelectBtnText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  previewScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  topBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondarySubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  aiBadgeText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
  courseTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL - 2,
    color: Colors.text,
    lineHeight: 34,
    marginBottom: Spacing.xs,
  },
  courseDescription: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
  },
  cardsContainer: {
    gap: Spacing.md,
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  wordTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD + 2,
    color: Colors.text,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  verifiedText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS - 1,
    color: Colors.secondary,
  },
  meaningText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  culturalNoteText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  evidenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginTop: Spacing.xs,
  },
  evidenceText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  questionPrompt: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  optionsList: {
    gap: 6,
    marginBottom: Spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  optionItemCorrect: {
    backgroundColor: '#E6F4F4',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  optionKey: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  optionKeyCorrect: {
    color: Colors.secondary,
  },
  optionVal: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },
  optionValCorrect: {
    fontFamily: Typography.fontBodySemi,
    color: Colors.secondary,
  },
  tagWrapper: {
    backgroundColor: Colors.secondarySubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.md,
    marginTop: Spacing.xs,
  },
  tagText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
  emptyTabText: {
    fontFamily: Typography.fontBody,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  discardBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.surface,
    gap: Spacing.xs,
  },
  discardBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  saveBtn: {
    flex: 2,
    minHeight: 48,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    gap: Spacing.xs,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.white,
  },
});
