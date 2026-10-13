// mobile-app/src/screens/learning/StudyBuilderConfigureScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { CreateStudyJobRequest } from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'StudyBuilderConfigure'>;
type RouteProps = RouteProp<LearningStackParamList, 'StudyBuilderConfigure'>;

export default function StudyBuilderConfigureScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { selectedSourceIds } = route.params;

  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [includeMiniCourse, setIncludeMiniCourse] = useState(false);
  const [includeCertificate, setIncludeCertificate] = useState(false);

  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
  const [flashcardCount, setFlashcardCount] = useState<number>(5);

  const handleGenerate = () => {
    if (!includeQuiz && !includeFlashcards && !includeMiniCourse) {
      Alert.alert('Configuration Error', learningStrings.builder.minOptionRequired);
      return;
    }

    const payload: CreateStudyJobRequest = {
      sourceIds: selectedSourceIds,
      includeQuiz,
      includeFlashcards,
      includeMiniCourse,
      includeCertificate,
      quizQuestionCount,
      flashcardCount,
      courseLessonCount: includeMiniCourse ? 2 : 1,
    };

    navigation.navigate('StudyBuilderGenerate', { jobRequest: payload });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to Content Selection"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <View>
          <Text style={styles.stepSubtitle}>{learningStrings.builder.step2Subtitle}</Text>
          <Text style={styles.headerTitle}>{learningStrings.builder.step2Title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Grounding Guarantee Banner */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.groundingBanner}>
          <View style={styles.bannerIconWrapper}>
            <ShieldCheck size={24} color={Colors.secondary} />
          </View>
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>{learningStrings.builder.groundingBannerTitle}</Text>
            <Text style={styles.bannerBody}>{learningStrings.builder.groundingBannerBody}</Text>
          </View>
        </Animated.View>

        {/* Selected Sources Badge */}
        <View style={styles.sourcesSummaryCard}>
          <Text style={styles.sourcesSummaryTitle}>
            Selected Sources: {selectedSourceIds.length} Stories
          </Text>
          <Text style={styles.sourcesSummaryBody}>
            Vocabulary, quizzes, and lessons will be derived strictly from these {selectedSourceIds.length} approved community entries.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Select Artifacts to Generate</Text>

        {/* Option 1: Quiz */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.optionCard}>
          <View style={styles.optionTopRow}>
            <View style={styles.optionIconContainer}>
              <CheckCircle2 size={20} color={Colors.secondary} />
            </View>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>{learningStrings.builder.optionQuiz}</Text>
              <Text style={styles.optionDesc}>{learningStrings.builder.optionQuizDesc}</Text>
            </View>
            <Switch
              value={includeQuiz}
              onValueChange={setIncludeQuiz}
              trackColor={{ false: Colors.surface, true: Colors.secondary }}
              thumbColor={Colors.white}
              accessibilityLabel="Include Quiz"
            />
          </View>

          {includeQuiz && (
            <View style={styles.subConfigRow}>
              <Text style={styles.subConfigLabel}>{learningStrings.builder.questionCountLabel}:</Text>
              <View style={styles.pillGroup}>
                {[5, 10].map((count) => {
                  const isSelected = quizQuestionCount === count;
                  return (
                    <Pressable
                      key={count}
                      onPress={() => setQuizQuestionCount(count)}
                      style={[styles.countPill, isSelected && styles.countPillActive]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.countPillText, isSelected && styles.countPillTextActive]}>
                        {count} Questions
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Option 2: Flashcards */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.optionCard}>
          <View style={styles.optionTopRow}>
            <View style={styles.optionIconContainer}>
              <Layers size={20} color={Colors.secondary} />
            </View>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>{learningStrings.builder.optionFlashcards}</Text>
              <Text style={styles.optionDesc}>{learningStrings.builder.optionFlashcardsDesc}</Text>
            </View>
            <Switch
              value={includeFlashcards}
              onValueChange={setIncludeFlashcards}
              trackColor={{ false: Colors.surface, true: Colors.secondary }}
              thumbColor={Colors.white}
              accessibilityLabel="Include Flashcards"
            />
          </View>

          {includeFlashcards && (
            <View style={styles.subConfigRow}>
              <Text style={styles.subConfigLabel}>{learningStrings.builder.cardCountLabel}:</Text>
              <View style={styles.pillGroup}>
                {[5, 10].map((count) => {
                  const isSelected = flashcardCount === count;
                  return (
                    <Pressable
                      key={count}
                      onPress={() => setFlashcardCount(count)}
                      style={[styles.countPill, isSelected && styles.countPillActive]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.countPillText, isSelected && styles.countPillTextActive]}>
                        {count} Cards
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Option 3: Mini Course */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.optionCard}>
          <View style={styles.optionTopRow}>
            <View style={styles.optionIconContainer}>
              <BookOpen size={20} color={Colors.secondary} />
            </View>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>{learningStrings.builder.optionMiniCourse}</Text>
              <Text style={styles.optionDesc}>{learningStrings.builder.optionMiniCourseDesc}</Text>
            </View>
            <Switch
              value={includeMiniCourse}
              onValueChange={setIncludeMiniCourse}
              trackColor={{ false: Colors.surface, true: Colors.secondary }}
              thumbColor={Colors.white}
              accessibilityLabel="Include Mini Course"
            />
          </View>
        </Animated.View>

        {/* Option 4: Certificate */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.optionCard}>
          <View style={styles.optionTopRow}>
            <View style={styles.optionIconContainer}>
              <Award size={20} color={Colors.secondary} />
            </View>
            <View style={styles.optionTitleContainer}>
              <Text style={styles.optionTitle}>{learningStrings.builder.optionCertificate}</Text>
              <Text style={styles.optionDesc}>{learningStrings.builder.optionCertificateDesc}</Text>
            </View>
            <Switch
              value={includeCertificate}
              onValueChange={setIncludeCertificate}
              trackColor={{ false: Colors.surface, true: Colors.secondary }}
              thumbColor={Colors.white}
              accessibilityLabel="Include Certificate"
            />
          </View>
        </Animated.View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleGenerate}
          style={styles.generateButton}
          accessibilityRole="button"
          accessibilityLabel={learningStrings.builder.generateCta}
        >
          <Sparkles size={20} color={Colors.white} />
          <Text style={styles.generateButtonText}>{learningStrings.builder.generateCta}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
  stepSubtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  groundingBanner: {
    flexDirection: 'row',
    backgroundColor: '#E6F4F4',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BFE4E4',
    gap: Spacing.sm,
  },
  bannerIconWrapper: {
    marginTop: 2,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
    marginBottom: 2,
  },
  bannerBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.secondaryDark,
    lineHeight: 18,
  },
  sourcesSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  sourcesSummaryTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.text,
    marginBottom: 2,
  },
  sourcesSummaryBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  sectionHeader: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.secondarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
  },
  optionDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
  subConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  subConfigLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
  },
  countPillActive: {
    backgroundColor: Colors.secondary,
  },
  countPillText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },
  countPillTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  generateButton: {
    minHeight: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  generateButtonText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.white,
  },
});
