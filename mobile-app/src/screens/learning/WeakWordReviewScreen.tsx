// mobile-app/src/screens/learning/WeakWordReviewScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Target, Check, X, BookOpen } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { weakWordApi } from '../../services/api/weakWordApi';
import {
  WeakWordSummary,
  ReviewSession,
  ReviewQuestion,
  ReviewAnswerItem,
  ReviewResult,
} from '../../types/weakWord';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'WeakWordReview'>;

type ScreenMode = 'list' | 'practicing' | 'completed';

export const WeakWordReviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const strings = learningStrings.review;

  const [mode, setMode] = useState<ScreenMode>('list');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'unmastered' | 'mastered'>('unmastered');
  const [weakWords, setWeakWords] = useState<WeakWordSummary[]>([]);

  // Practice session state
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [recordedAnswers, setRecordedAnswers] = useState<ReviewAnswerItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const fetchWeakWords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await weakWordApi.getMyWeakWords();
      setWeakWords(data || []);
    } catch (err: any) {
      Alert.alert(learningStrings.common.errorTitle, err.message || 'Failed to load weak words');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeakWords();
  }, [fetchWeakWords]);

  const unmasteredWords = weakWords.filter((w) => !w.mastered);
  const masteredWords = weakWords.filter((w) => w.mastered);

  const handleStartSession = async () => {
    if (unmasteredWords.length === 0) {
      Alert.alert('No Words', 'You do not have any unmastered words to practice right now.');
      return;
    }

    try {
      setLoading(true);
      const newSession = await weakWordApi.buildReviewSession(Math.min(10, unmasteredWords.length));
      if (!newSession.questions || newSession.questions.length === 0) {
        Alert.alert('Session Empty', 'Unable to build review questions at this time.');
        return;
      }

      setSession(newSession);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setRecordedAnswers([]);
      setResult(null);
      setMode('practicing');
    } catch (err: any) {
      Alert.alert(learningStrings.common.errorTitle, err.message || 'Failed to start review session');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion: ReviewQuestion | undefined = session?.questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (!isAnswerChecked) {
      setSelectedOption(opt);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsAnswerChecked(true);

    if (currentQuestion) {
      const answerItem: ReviewAnswerItem = {
        questionId: currentQuestion.questionId,
        flashcardId: currentQuestion.flashcardId,
        selectedOption: selectedOption,
      };
      setRecordedAnswers((prev) => [...prev, answerItem]);
    }
  };

  const handleNextOrSubmit = async () => {
    if (!session) return;

    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // Submit all answers to server
      try {
        setSubmitting(true);
        const res = await weakWordApi.submitReviewAnswers({
          sessionId: session.sessionId,
          answers: recordedAnswers,
        });
        setResult(res);
        setMode('completed');
        // Refresh weak words in background
        fetchWeakWords();
      } catch (err: any) {
        Alert.alert(learningStrings.common.errorTitle, err.message || 'Failed to evaluate review answers');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────
  if (loading && mode === 'list') {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButtonLoading}
        >
          <ArrowLeft size={20} color="#202426" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#0F5C5C" />
        <Text style={styles.loadingText}>{learningStrings.common.loading}</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Mode = 'practicing'
  // ─────────────────────────────────────────────────────────────
  if (mode === 'practicing' && currentQuestion) {
    const totalQuestions = session?.questions.length || 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

    const optionsList: { label: string; text: string }[] = [
      { label: 'A', text: currentQuestion.optionA },
      { label: 'B', text: currentQuestion.optionB },
      { label: 'C', text: currentQuestion.optionC },
      { label: 'D', text: currentQuestion.optionD },
    ];

    return (
      <View style={styles.container}>
        {/* Progress Header */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderTop}>
            <Text style={styles.sessionQuestionCount}>
              {strings.questionHeader(currentIndex + 1, totalQuestions)}
            </Text>
            <TouchableOpacity
              onPress={() => setMode('list')}
              accessibilityRole="button"
              accessibilityLabel="Exit review session"
              style={styles.exitBtn}
            >
              <X size={15} color="#70777A" />
              <Text style={styles.exitBtnText}>Exit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.practiceContent} showsVerticalScrollIndicator={false}>
          {/* Term Card */}
          <View style={styles.practiceTermCard}>
            <Text style={styles.practiceTermBadge}>HERITAGE TERM</Text>
            <Text style={styles.practiceTermWord}>{currentQuestion.word}</Text>
            <Text style={styles.practicePrompt}>{currentQuestion.prompt}</Text>
          </View>

          {/* Options */}
          <Text style={styles.optionsLabel}>Select the correct definition:</Text>
          {optionsList.map((opt) => {
            const isSelected = selectedOption === opt.label;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleSelectOption(opt.label)}
                disabled={isAnswerChecked}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Option ${opt.label}: ${opt.text}`}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                  <Text style={[styles.optionBadgeText, isSelected && styles.optionBadgeTextSelected]}>
                    {opt.label}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Checked Feedback */}
          {isAnswerChecked && (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>
                {strings.correctFeedbackTitle}
              </Text>
              <Text style={styles.feedbackHint}>
                Answer recorded. Server will update consecutive correct counts and Leitner review intervals.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.sessionFooter}>
          {!isAnswerChecked ? (
            <TouchableOpacity
              onPress={handleCheckAnswer}
              disabled={!selectedOption}
              accessibilityRole="button"
              accessibilityLabel={strings.checkAnswer}
              style={[styles.primaryActionBtn, !selectedOption && styles.btnDisabled]}
            >
              <Text style={styles.primaryActionBtnText}>{strings.checkAnswer}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNextOrSubmit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={isLastQuestion ? strings.submitSession : strings.nextQuestion}
              style={styles.primaryActionBtn}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryActionBtnText}>
                  {isLastQuestion ? strings.submitSession : strings.nextQuestion}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Mode = 'completed'
  // ─────────────────────────────────────────────────────────────
  if (mode === 'completed' && result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.completedContent}>
        <View style={styles.resultTrophyCard}>
          <View style={styles.resultTrophyIconWrapper}>
            <Target size={44} color="#0F5C5C" />
          </View>
          <Text style={styles.resultTitle}>{strings.resultsTitle}</Text>
          <Text style={styles.resultScore}>
            {strings.scoreSummary(result.correctCount, result.totalQuestions)} ({result.percentage}%)
          </Text>
          <View style={styles.xpPill}>
            <Text style={styles.xpPillText}>{strings.xpAwarded(result.xpEarned)}</Text>
          </View>
        </View>

        {/* Newly Mastered Words */}
        {result.masteredWords && result.masteredWords.length > 0 && (
          <View style={styles.masteredSection}>
            <Text style={styles.masteredSectionTitle}>{strings.newlyMasteredTitle}</Text>
            <View style={styles.masteredBadgesRow}>
              {result.masteredWords.map((w, idx) => (
                <View key={idx} style={styles.masteredWordBadge}>
                  <Check size={14} color="#0F5C5C" strokeWidth={2.5} />
                  <Text style={styles.masteredWordText}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detailed Breakdown */}
        <Text style={styles.breakdownHeader}>Session Review:</Text>
        {result.results.map((item, idx) => (
          <View key={idx} style={styles.breakdownItem}>
            <View style={styles.breakdownItemTop}>
              <Text style={styles.breakdownWord}>{item.word}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.correct ? styles.statusBadgeCorrect : styles.statusBadgeIncorrect,
                ]}
              >
                {item.correct ? (
                  <Check size={12} color="#0F5C5C" strokeWidth={2.5} />
                ) : (
                  <X size={12} color="#E8792E" strokeWidth={2.5} />
                )}
                <Text style={item.correct ? styles.statusTextCorrect : styles.statusTextIncorrect}>
                  {item.correct ? 'Correct' : 'Missed'}
                </Text>
              </View>
            </View>
            <Text style={styles.breakdownMeaning}>Definition: {item.meaning}</Text>
            <Text style={styles.breakdownStreak}>
              Mastery progress: {item.consecutiveCorrect} / 3 consecutive correct
            </Text>
          </View>
        ))}

        {/* Buttons */}
        <View style={styles.completedActions}>
          <TouchableOpacity
            onPress={handleStartSession}
            accessibilityRole="button"
            accessibilityLabel={strings.reviewAgainCta}
            style={styles.completedPrimaryBtn}
          >
            <Text style={styles.completedPrimaryBtnText}>{strings.reviewAgainCta}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('list')}
            accessibilityRole="button"
            accessibilityLabel={strings.doneCta}
            style={styles.completedSecondaryBtn}
          >
            <Text style={styles.completedSecondaryBtnText}>{strings.doneCta}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Mode = 'list' (Overview)
  // ─────────────────────────────────────────────────────────────
  const displayList = activeTab === 'unmastered' ? unmasteredWords : masteredWords;

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to Progress Tracking"
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{strings.title}</Text>
            <Text style={styles.headerSubtitle}>{strings.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('unmastered')}
          accessibilityRole="tab"
          accessibilityLabel={`${strings.unmasteredTab} (${unmasteredWords.length})`}
          style={[styles.tabItem, activeTab === 'unmastered' && styles.tabItemActive]}
        >
          <Text style={[styles.tabItemText, activeTab === 'unmastered' && styles.tabItemTextActive]}>
            {strings.unmasteredTab} ({unmasteredWords.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('mastered')}
          accessibilityRole="tab"
          accessibilityLabel={`${strings.masteredTab} (${masteredWords.length})`}
          style={[styles.tabItem, activeTab === 'mastered' && styles.tabItemActive]}
        >
          <Text style={[styles.tabItemText, activeTab === 'mastered' && styles.tabItemTextActive]}>
            {strings.masteredTab} ({masteredWords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {displayList.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <BookOpen size={36} color="#0F5C5C" />
            </View>
            <Text style={styles.emptyTitle}>{strings.noWeakWordsTitle}</Text>
            <Text style={styles.emptyBody}>{strings.noWeakWordsBody}</Text>
          </View>
        ) : (
          displayList.map((word) => (
            <View key={word.id} style={styles.wordCard}>
              <View style={styles.wordCardHeader}>
                <Text style={styles.wordTitle}>{word.word}</Text>
                <View style={styles.badgeGroup}>
                  <View style={styles.errorCountBadge}>
                    <Text style={styles.errorCountBadgeText}>
                      {strings.errorCountBadge(word.errorCount)}
                    </Text>
                  </View>
                  {word.box !== undefined && (
                    <View style={styles.boxBadge}>
                      <Text style={styles.boxBadgeText}>{strings.boxLevel(word.box)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.wordMeaning}>{word.meaning}</Text>
              {word.culturalNote ? (
                <Text style={styles.wordCulturalNote}>Cultural Note: {word.culturalNote}</Text>
              ) : null}

              <View style={styles.wordFooter}>
                {word.mastered ? (
                  <View style={styles.masteredFooterRow}>
                    <Check size={14} color="#0F5C5C" strokeWidth={2.5} />
                    <Text style={styles.masteredFooterText}>Mastered</Text>
                  </View>
                ) : (
                  <Text style={styles.masteryText}>
                    {strings.masteryProgress(word.consecutiveCorrect, 3)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Bottom Practice CTA */}
      {unmasteredWords.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleStartSession}
            accessibilityRole="button"
            accessibilityLabel={strings.startSessionCta(unmasteredWords.length)}
            style={styles.startSessionBtn}
          >
            <Text style={styles.startSessionBtnText}>
              {strings.startSessionCta(Math.min(10, unmasteredWords.length))}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEFEE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDEFEE',
  },
  backButtonLoading: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#202426',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#0F5C5C',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#EDEFEE',
    opacity: 0.9,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D2D7D6',
  },
  tabItem: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F5C5C',
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#70777A',
  },
  tabItemTextActive: {
    color: '#0F5C5C',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202426',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: '#555C5E',
    textAlign: 'center',
    lineHeight: 20,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  wordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F5C5C',
    flex: 1,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  errorCountBadge: {
    backgroundColor: '#FDEEE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorCountBadgeText: {
    fontSize: 11,
    color: '#E8792E',
    fontWeight: '700',
  },
  boxBadge: {
    backgroundColor: '#E6F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boxBadgeText: {
    fontSize: 11,
    color: '#0F5C5C',
    fontWeight: '600',
  },
  wordMeaning: {
    fontSize: 15,
    color: '#202426',
    marginBottom: 6,
    lineHeight: 20,
  },
  wordCulturalNote: {
    fontSize: 13,
    color: '#555C5E',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  wordFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EDEFEE',
    paddingTop: 8,
    marginTop: 4,
  },
  masteredFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteredFooterText: {
    fontSize: 12,
    color: '#0F5C5C',
    fontWeight: '700',
  },
  masteryText: {
    fontSize: 12,
    color: '#0F5C5C',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#D2D7D6',
  },
  startSessionBtn: {
    backgroundColor: '#0F5C5C',
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startSessionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Practice Mode Styles
  sessionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D2D7D6',
  },
  sessionHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionQuestionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F5C5C',
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#70777A',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EDEFEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F5C5C',
    borderRadius: 3,
  },
  practiceContent: {
    padding: 16,
    paddingBottom: 96,
  },
  practiceTermCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  practiceTermBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8792E',
    letterSpacing: 1,
    marginBottom: 8,
  },
  practiceTermWord: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F5C5C',
    marginBottom: 8,
    textAlign: 'center',
  },
  practicePrompt: {
    fontSize: 14,
    color: '#555C5E',
    textAlign: 'center',
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202426',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#D2D7D6',
  },
  optionCardSelected: {
    borderColor: '#0F5C5C',
    backgroundColor: '#E6F0F0',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDEFEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionBadgeSelected: {
    backgroundColor: '#0F5C5C',
  },
  optionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202426',
  },
  optionBadgeTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    color: '#202426',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#0F5C5C',
  },
  feedbackCard: {
    backgroundColor: '#E6F0F0',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0F5C5C',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F5C5C',
    marginBottom: 4,
  },
  feedbackHint: {
    fontSize: 13,
    color: '#555C5E',
    lineHeight: 18,
  },
  sessionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#D2D7D6',
  },
  primaryActionBtn: {
    backgroundColor: '#0F5C5C',
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#A0B2B2',
  },
  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Completed Mode Styles
  completedContent: {
    padding: 20,
    paddingBottom: 40,
  },
  resultTrophyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  resultTrophyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202426',
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 16,
    color: '#555C5E',
    marginBottom: 14,
  },
  xpPill: {
    backgroundColor: '#E6F0F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0F5C5C',
  },
  xpPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F5C5C',
  },
  masteredSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  masteredSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F5C5C',
    marginBottom: 10,
  },
  masteredBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  masteredWordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  masteredWordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F5C5C',
  },
  breakdownHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202426',
    marginBottom: 10,
  },
  breakdownItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  breakdownItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F5C5C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeCorrect: {
    backgroundColor: '#E6F0F0',
  },
  statusBadgeIncorrect: {
    backgroundColor: '#FDEEE9',
  },
  statusTextCorrect: {
    fontSize: 12,
    color: '#0F5C5C',
    fontWeight: '700',
  },
  statusTextIncorrect: {
    fontSize: 12,
    color: '#E8792E',
    fontWeight: '700',
  },
  breakdownMeaning: {
    fontSize: 14,
    color: '#202426',
    marginBottom: 4,
  },
  breakdownStreak: {
    fontSize: 12,
    color: '#70777A',
  },
  completedActions: {
    marginTop: 20,
    gap: 12,
  },
  completedPrimaryBtn: {
    backgroundColor: '#0F5C5C',
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedPrimaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  completedSecondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202426',
  },
});
