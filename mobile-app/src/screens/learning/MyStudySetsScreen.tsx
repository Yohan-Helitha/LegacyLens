// mobile-app/src/screens/learning/MyStudySetsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Sparkles,
  ArrowLeft,
  MapPin,
  Briefcase,
  RotateCcw,
  BookOpen,
  Trash2,
  Lock,
  Trophy,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { studyBuilderApi } from '../../services/api/studyBuilderApi';
import { StudySetSummary } from '../../types/studyBuilder';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { learningStrings } from '../../constants/learningStrings';

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'MyStudySets'>;

export default function MyStudySetsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [sets, setSets] = useState<StudySetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudySets = async () => {
    try {
      const data = await studyBuilderApi.getMyStudySets();
      setSets(data);
    } catch (error: any) {
      console.log('Failed to fetch study sets:', error?.message ?? error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudySets();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStudySets();
  };

  const handleDelete = (trackId: number, title: string) => {
    Alert.alert(
      learningStrings.studySets.deleteConfirmTitle,
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: learningStrings.studySets.deleteConfirmCancel, style: 'cancel' },
        {
          text: learningStrings.studySets.deleteConfirmYes,
          style: 'destructive',
          onPress: async () => {
            try {
              await studyBuilderApi.deleteMyStudySet(trackId);
              setSets((prev) => prev.filter((item) => item.id !== trackId));
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete study set.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover Tracks"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitle}>{learningStrings.studySets.subtitle}</Text>
          <Text style={styles.title}>{learningStrings.studySets.title}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('StudyBuilderSelect')}
          style={styles.newBtn}
          accessibilityRole="button"
          accessibilityLabel="New Study Set"
        >
          <Sparkles size={16} color={Colors.white} />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>{learningStrings.common.loading}</Text>
        </View>
      ) : sets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Sparkles size={36} color={Colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No study sets yet</Text>
          <Text style={styles.emptySubtitle}>{learningStrings.home.noStudySets}</Text>
          <Pressable
            onPress={() => navigation.navigate('StudyBuilderSelect')}
            style={styles.createFirstBtn}
            accessibilityRole="button"
          >
            <Sparkles size={18} color={Colors.white} />
            <Text style={styles.createFirstBtnText}>Create Study Set with AI</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.secondary}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 70).duration(300)}>
              <View style={styles.card}>
                {/* Header row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.privatePill}>
                    <Lock size={12} color={Colors.secondary} />
                    <Text style={styles.privatePillText}>{learningStrings.studySets.privateBadge}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(item.id, item.title)}
                    style={styles.deleteIconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.title}`}
                  >
                    <Trash2 size={16} color={Colors.textMuted} />
                  </Pressable>
                </View>

                {/* Title & Description */}
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {item.region ? (
                    <View style={styles.tagWrapper}>
                      <MapPin size={12} color={Colors.secondary} />
                      <Text style={styles.tagText}>{item.region}</Text>
                    </View>
                  ) : null}
                  {item.occupation ? (
                    <View style={styles.tagWrapper}>
                      <Briefcase size={12} color={Colors.secondary} />
                      <Text style={styles.tagText}>{item.occupation}</Text>
                    </View>
                  ) : null}
                  <View style={styles.tagWrapper}>
                    <Text style={styles.tagText}>
                      {item.totalLessons} {item.totalLessons === 1 ? 'lesson' : 'lessons'}
                    </Text>
                  </View>
                </View>

                {/* Performance stats row */}
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>
                    {learningStrings.studySets.attemptsCount(item.attemptCount)}
                  </Text>
                  {item.bestScore !== undefined && item.bestScore !== null ? (
                    <View style={styles.bestScoreWrapper}>
                      <Trophy size={12} color={Colors.accent} />
                      <Text style={styles.bestScoreText}>Best: {item.bestScore} pts</Text>
                    </View>
                  ) : null}
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cardActionButtonsRow}>
                  <Pressable
                    onPress={() => navigation.navigate('TrackDetail', { trackId: String(item.id) })}
                    style={styles.openBtn}
                    accessibilityRole="button"
                  >
                    <BookOpen size={16} color={Colors.white} />
                    <Text style={styles.openBtnText}>{learningStrings.studySets.openTrackCta}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('StudySetRetake', { trackId: item.id, title: item.title })}
                    style={styles.retakeBtn}
                    accessibilityRole="button"
                  >
                    <RotateCcw size={16} color={Colors.secondary} />
                    <Text style={styles.retakeBtnText}>{learningStrings.studySets.retakeCta}</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}
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
  headerTextContainer: {
    flex: 1,
  },
  subtitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
  },
  newBtn: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  newBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS + 1,
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondarySubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  privatePillText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    color: Colors.secondary,
  },
  deleteIconButton: {
    padding: 6,
  },
  cardTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.md,
  },
  tagText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
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
  },
  bestScoreText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
  },
  cardActionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  openBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.white,
  },
  retakeBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontBody,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  createFirstBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM + 1,
    color: Colors.white,
  },
});
