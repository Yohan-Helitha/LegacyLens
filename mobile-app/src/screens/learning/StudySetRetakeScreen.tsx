// mobile-app/src/screens/learning/StudySetRetakeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { studyBuilderApi } from '../../services/api/studyBuilderApi';
import {
  StudySetDetail,
  QuizQuestionDetailDto,
  StudyAttemptResult,
} from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'StudySetRetake'>;
type RouteProps = RouteProp<LearningStackParamList, 'StudySetRetake'>;

export default function StudySetRetakeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { trackId, title } = route.params;

  const [detail, setDetail] = useState<StudySetDetail | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionDetailDto[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<StudyAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudySet();
  }, [trackId]);

  const loadStudySet = async () => {
    setLoading(true);
    try {
      const data = await studyBuilderApi.getMyStudySetDetail(trackId);
      setDetail(data);
      setQuestions(data.quizQuestions || []);
    } catch (error: any) {
      console.log('Failed to load study set detail for retake:', error?.message ?? error);
      Alert.alert(learningStrings.common.errorTitle, 'Could not load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionKey: string) => {
    if (attemptResult) return; // Locked after submitting
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionKey,
    });
  };

  const handleSubmitQuiz = async () => {
    if (questions.length === 0) return;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      Alert.alert('Incomplete', `You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`, [
        { text: 'Keep Answering', style: 'cancel' },
        { text: 'Submit', onPress: proceedSubmit },
      ]);
    } else {
      proceedSubmit();
    }
  };

  const proceedSubmit = async () => {
    const quizLesson = detail?.lessons.find((l) => l.type.toUpperCase() === 'QUIZ');
    if (!quizLesson) {
      Alert.alert('Error', 'Quiz lesson not found for this study set.');
      return;
    }

    setSubmitting(true);
    try {
      const answersList = Object.entries(selectedAnswers).map(([qId, opt]) => ({
        questionId: Number(qId),
        selectedOption: opt,
      }));

      const result = await studyBuilderApi.submitStudyAttempt(trackId, {
        lessonId: quizLesson.id,
        answers: answersList,
      });

      setAttemptResult(result);
    } catch (error: any) {
      console.log('Failed to submit quiz attempt:', error?.message ?? error);
      Alert.alert(learningStrings.common.errorTitle, error?.message || 'Could not evaluate answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetRetake = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setAttemptResult(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButtonLoading}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>{learningStrings.common.loading}</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Quiz Questions</Text>
        <Text style={styles.emptySubtitle}>This study set does not contain interactive quiz questions.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtnPill}>
          <Text style={styles.backBtnPillText}>Back to Study Sets</Text>
        </Pressable>
      </View>
    );
  }

  // Result Mode
  if (attemptResult) {
    return (
      <View style={styles.container}>
        <View style={styles.resultTopBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Study Sets"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.resultHeaderCard}>
            <View style={styles.resultIconWrapper}>
              {attemptResult.passed ? (
                <CheckCircle2 size={48} color={Colors.secondary} />
              ) : (
                <XCircle size={48} color={Colors.accent} />
              )}
            </View>

            <Text style={styles.resultTitle}>{learningStrings.retake.resultsTitle}</Text>
            <Text style={styles.resultScore}>
              {learningStrings.retake.scoreSummary(attemptResult.score, attemptResult.total)}
            </Text>
            <Text style={styles.resultPercentage}>{attemptResult.percentage}%</Text>

            <View style={[styles.badgePill, attemptResult.passed ? styles.badgePassed : styles.badgeFailed]}>
              <Text style={[styles.badgePillText, attemptResult.passed ? styles.badgePassedText : styles.badgeFailedText]}>
                {attemptResult.passed ? learningStrings.retake.passedBadge : learningStrings.retake.needsPracticeBadge}
              </Text>
            </View>

            {/* XP Award Banner or Anti-Farming Notice */}
            {attemptResult.firstAttempt && attemptResult.xpAwarded > 0 ? (
              <View style={styles.xpBanner}>
                <Sparkles size={16} color={Colors.accent} />
                <Text style={styles.xpBannerText}>
                  {learningStrings.retake.xpAwardedBanner(attemptResult.xpAwarded)}
                </Text>
              </View>
            ) : (
              <View style={styles.retakeNoticeBanner}>
                <Award size={16} color={Colors.secondary} />
                <Text style={styles.retakeNoticeText}>{learningStrings.retake.retakeXpNotice}</Text>
              </View>
            )}
          </Animated.View>

          {/* Answer Review Section */}
          <Text style={styles.reviewSectionTitle}>Question Breakdown</Text>
          {questions.map((q, idx) => {
            const userChoice = selectedAnswers[q.id];
            const isCorrect = userChoice && userChoice.toUpperCase() === q.correctOption.toUpperCase();
            return (
              <View key={q.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewIndex}>Q{idx + 1}</Text>
                  {isCorrect ? (
                    <View style={styles.statusPillCorrect}>
                      <CheckCircle2 size={12} color={Colors.secondary} />
                      <Text style={styles.statusTextCorrect}>Correct</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPillWrong}>
                      <XCircle size={12} color={Colors.accent} />
                      <Text style={styles.statusTextWrong}>Incorrect</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.reviewPrompt}>{q.question}</Text>
                <Text style={styles.reviewAnswerLine}>
                  Your Answer: <Text style={styles.boldText}>{userChoice ? `${userChoice}. ${(q as any)[`option${userChoice}`]}` : 'None'}</Text>
                </Text>
                {!isCorrect && (
                  <Text style={styles.reviewAnswerLineCorrect}>
                    Correct: <Text style={styles.boldText}>{q.correctOption}. {(q as any)[`option${q.correctOption}`]}</Text>
                  </Text>
                )}
                {q.evidence ? (
                  <Text style={styles.reviewEvidence}>Story quote: "{q.evidence}"</Text>
                ) : null}
              </View>
            );
          })}

          {/* Action buttons */}
          <View style={styles.resultActionsRow}>
            <Pressable onPress={handleResetRetake} style={styles.retakeAgainBtn}>
              <RotateCcw size={16} color={Colors.secondary} />
              <Text style={styles.retakeAgainBtnText}>{learningStrings.retake.retakeAgainButton}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.goBack()} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{learningStrings.retake.doneButton}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Quiz Taking Mode
  const currentQ = questions[currentIndex];
  const userOption = selectedAnswers[currentQ.id];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerSubtitle}>{title || 'Study Set Quiz'}</Text>
          <Text style={styles.headerTitle}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
        {/* Question Prompt */}
        <Animated.View entering={FadeInDown.duration(300)} key={currentQ.id} style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQ.question}</Text>

          {/* 4 Multiple Choice Options */}
          <View style={styles.optionsContainer}>
            {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
              const optText = (currentQ as any)[`option${optKey}`];
              const isSelected = userOption === optKey;
              return (
                <Pressable
                  key={optKey}
                  onPress={() => handleSelectOption(currentQ.id, optKey)}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.optionIndicator, isSelected && styles.optionIndicatorSelected]}>
                    <Text style={[styles.optionIndicatorText, isSelected && styles.optionIndicatorTextSelected]}>
                      {optKey}
                    </Text>
                  </View>
                  <Text style={[styles.optionString, isSelected && styles.optionStringSelected]}>
                    {optText}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation / Submit Controls */}
      <View style={styles.bottomNav}>
        <Pressable
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={[styles.prevButton, currentIndex === 0 && styles.prevButtonDisabled]}
          accessibilityRole="button"
        >
          <Text style={[styles.prevButtonText, currentIndex === 0 && { color: Colors.surface }]}>
            Previous
          </Text>
        </Pressable>

        {currentIndex < questions.length - 1 ? (
          <Pressable
            onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            style={styles.nextQuestionBtn}
            accessibilityRole="button"
          >
            <Text style={styles.nextQuestionBtnText}>Next</Text>
            <ChevronRight size={18} color={Colors.white} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmitQuiz}
            disabled={submitting}
            style={styles.submitBtn}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
            )}
          </Pressable>
        )}
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
  backButtonLoading: {
    position: 'absolute',
    top: 54,
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  resultTopBar: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
  },
  questionScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  questionText: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: Spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: '#EBF6F6',
    borderColor: Colors.secondary,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndicatorSelected: {
    backgroundColor: Colors.secondary,
  },
  optionIndicatorText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },
  optionIndicatorTextSelected: {
    color: Colors.white,
  },
  optionString: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM + 1,
    color: Colors.text,
    lineHeight: 20,
  },
  optionStringSelected: {
    fontFamily: Typography.fontBodySemi,
    color: Colors.secondaryDark,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  prevButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButtonDisabled: {
    opacity: 0.4,
  },
  prevButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  nextQuestionBtn: {
    minHeight: 48,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextQuestionBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
  },
  submitBtn: {
    minHeight: 48,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.white,
  },
  resultScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  resultHeaderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultIconWrapper: {
    marginBottom: Spacing.sm,
  },
  resultTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
  },
  resultScore: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  resultPercentage: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size3XL,
    color: Colors.secondary,
    marginVertical: Spacing.xs,
  },
  badgePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginBottom: Spacing.md,
  },
  badgePassed: {
    backgroundColor: '#E6F4F4',
  },
  badgeFailed: {
    backgroundColor: '#FFF2EB',
  },
  badgePillText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  badgePassedText: {
    color: Colors.secondary,
  },
  badgeFailedText: {
    color: Colors.accent,
  },
  xpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5EB',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
  },
  xpBannerText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
  },
  retakeNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
  },
  retakeNoticeText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  reviewSectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewIndex: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  statusPillCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4F4',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  statusTextCorrect: {
    color: Colors.secondary,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  statusPillWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF2EB',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  statusTextWrong: {
    color: Colors.accent,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
  },
  reviewPrompt: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM + 1,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewAnswerLine: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
  },
  reviewAnswerLineCorrect: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.secondary,
  },
  boldText: {
    fontFamily: Typography.fontBodySemi,
    color: Colors.text,
  },
  reviewEvidence: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  retakeAgainBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeAgainBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
  },
  doneBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dominant,
  },
  loadingText: {
    fontFamily: Typography.fontBody,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  backBtnPill: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
  },
  backBtnPillText: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
  },
});
