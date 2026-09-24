import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Award, BookOpen, Check, ChevronRight, Lock, Star } from 'lucide-react-native';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  TrustProgressRing,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useTrustScore } from '../../hooks/useTrustScore';
import { Typography, Spacing, Radii } from '../../theme';

/**
 * The 3-stories-per-level milestone ladder — mirrors the backend's
 * StoryCountBasedCalculator thresholds (3, 6, 9, 12) exactly. Kept here
 * rather than derived, since the API only returns the *current* level and
 * distance to next, not the full ladder — update both together if the
 * backend formula ever changes.
 */
const MILESTONES = [
  { level: 1, threshold: 3 },
  { level: 2, threshold: 6 },
  { level: 3, threshold: 9 },
  { level: 4, threshold: 12 },
];
const STORIES_PER_LEVEL = 3;

interface TrustScoreDetailProps {
  /** Opens Reviews & Ratings — what people have said, kept separate from this activity-based level. */
  onOpenReviews?: () => void;
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * "Knowledge Keeper" detail — reached from the side drawer's "Trust Score"
 * item, or by tapping the dashboard's trust badge. A personal, honoring
 * record of how much has been shared, not a leaderboard: no ranking against
 * other storytellers appears anywhere here.
 */
export const TrustScoreDetail: React.FC<TrustScoreDetailProps> = ({
  onOpenReviews,
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { detail, loading, loadError } = useTrustScore();

  const isMaxLevel = !!detail && detail.level >= MILESTONES.length;
  const progress = detail
    ? isMaxLevel
      ? 1
      : (STORIES_PER_LEVEL - detail.nextMilestoneStoriesNeeded) / STORIES_PER_LEVEL
    : 0;

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="Trust Score" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={s.centerState}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={s.centerState}>
            <Text style={s.errorText}>Couldn't load your Knowledge Keeper progress.</Text>
          </View>
        )}

        {!loading && !loadError && detail && (
          <>
            <View style={s.knowledgeKeeperPill}>
              <Award size={16} color={D.onSecondaryContainer} strokeWidth={2.5} />
              <Text style={s.knowledgeKeeperPillText}>Knowledge Keeper</Text>
            </View>

            <Text style={s.supportingCopy}>
              Your Knowledge Keeper level grows every time you share a story or someone learns from
              your words.
            </Text>

            <View style={s.ringSection}>
              <TrustProgressRing level={detail.level} progress={progress} />
            </View>

            <View style={s.statCard}>
              <View style={s.statIconWrap}>
                <BookOpen size={22} color={D.onPrimary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.statTitle}>
                  {detail.storiesShared} {detail.storiesShared === 1 ? 'Story Shared' : 'Stories Shared'}
                </Text>
                <Text style={s.statSubtitle}>
                  You are actively preserving knowledge for future generations.
                </Text>
              </View>
            </View>

            <View style={s.milestoneSection}>
              {MILESTONES.map((milestone) => {
                const achieved = detail.level >= milestone.level;
                const isNext = !achieved && detail.level === milestone.level - 1;

                return (
                  <View key={milestone.level} style={s.milestoneRow}>
                    <View style={[s.milestoneBadge, achieved && s.milestoneBadgeAchieved]}>
                      {achieved ? (
                        <Check size={16} color="#ffffff" strokeWidth={3} />
                      ) : (
                        <Lock size={14} color={D.onSurfaceVariant} strokeWidth={2} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.milestoneTitle}>Level {milestone.level}</Text>
                      {isNext && (
                        <Text style={s.milestoneNextText}>
                          {detail.nextMilestoneStoriesNeeded} more{' '}
                          {detail.nextMilestoneStoriesNeeded === 1 ? 'story' : 'stories'} to reach Level{' '}
                          {milestone.level}
                        </Text>
                      )}
                      {achieved && <Text style={s.milestoneAchievedText}>Reached</Text>}
                    </View>
                  </View>
                );
              })}

              {isMaxLevel && (
                <Text style={s.maxLevelText}>
                  You've reached the highest Knowledge Keeper level — thank you for sharing so much
                  with your family and community.
                </Text>
              )}
            </View>

            {!!onOpenReviews && (
              <Pressable
                onPress={onOpenReviews}
                style={({ pressed }) => [s.reviewsLink, pressed && s.reviewsLinkPressed]}
                accessibilityRole="button"
                accessibilityLabel="Reviews and ratings. See what people have said about you."
              >
                <View style={s.reviewsIcon}>
                  <Star size={20} color={D.secondary} fill={D.secondaryContainer} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewsTitle}>Reviews & Ratings</Text>
                  <Text style={s.reviewsSubtitle}>See what people have said about you</Text>
                </View>
                <ChevronRight size={20} color={D.onSurfaceVariant} strokeWidth={2} />
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="trust"
        requestsCount={1}
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

const s = StyleSheet.create({
  reviewsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 64,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
  },
  reviewsLinkPressed: { opacity: 0.85 },
  reviewsIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(254,137,62,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  reviewsSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  safeArea: { flex: 1, backgroundColor: D.surface },

  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },

  centerState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },

  knowledgeKeeperPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: D.secondaryContainer,
    borderRadius: Radii.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  knowledgeKeeperPillText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSecondaryContainer,
  },

  ringSection: { alignItems: 'center' },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: D.primary,
    borderRadius: Radii.xl,
    padding: Spacing.md,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: D.onPrimary,
    marginBottom: 2,
  },
  statSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onPrimary,
    opacity: 0.85,
  },

  milestoneSection: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  milestoneBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surfaceVariant,
  },
  milestoneBadgeAchieved: { backgroundColor: D.primary },
  milestoneTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  milestoneNextText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSecondaryContainer,
    marginTop: 2,
  },
  milestoneAchievedText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    marginTop: 2,
  },
  maxLevelText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    lineHeight: 20,
    textAlign: 'center',
    paddingTop: Spacing.xs,
  },

  supportingCopy: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: Spacing.sm,
  },
});

export default TrustScoreDetail;
