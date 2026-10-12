import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, Star } from 'lucide-react-native';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  HireActionButton,
  RatingStars,
  ReviewCard,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useElderReviews } from '../../hooks/useElderReviews';
import { Typography, Spacing, Radii } from '../../theme';

interface ReviewsRatingsScreenProps {
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Screen 11 — Reviews & Ratings. What the people an elder has worked with
 * said about them: an average-rating summary, then the individual reviews.
 * Read-only reflection, not a comment section. Deliberately styled apart
 * from the Trust Score / Knowledge Keeper ring on Screen 7 — a warm
 * star-rating card here, an activity-based level there — so the two never
 * read as one number.
 */
export const ReviewsRatingsScreen: React.FC<ReviewsRatingsScreenProps> = ({
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { summary, reviews, loading, loadError, reload } = useElderReviews();

  const hasReviews = !!summary && summary.ratingCount > 0 && reviews.length > 0;
  const showEmpty = !loading && !loadError && !hasReviews;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header title="Reviews & Ratings" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={D.primary} colors={[D.primary]} />
        }
      >
        <Text style={s.title} accessibilityRole="header">
          Reviews & Ratings
        </Text>

        {loading && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel="Loading" />
          </View>
        )}

        {loadError && !loading && (
          <View style={s.centered}>
            <View style={[s.iconWrap, s.iconWrapWarn]}>
              <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.stateTitle}>Couldn't load your reviews</Text>
            <Text style={s.stateBody}>Check your connection and try again.</Text>
            <HireActionButton label="Try again" onPress={reload} style={s.stateBtn} />
          </View>
        )}

        {hasReviews && summary && summary.averageRating != null && (
          <>
            <View
              style={s.summary}
              accessible
              accessibilityLabel={`Average rating ${summary.averageRating.toFixed(1)} out of 5, based on ${summary.ratingCount} ${
                summary.ratingCount === 1 ? 'review' : 'reviews'
              }`}
            >
              <Text style={s.summaryCaption}>AVERAGE RATING</Text>
              <Text style={s.summaryNumber}>{summary.averageRating.toFixed(1)}</Text>
              <RatingStars
                rating={summary.averageRating}
                ratingText=""
                emptyText=""
                accessibilityLabel={`${summary.averageRating.toFixed(1)} out of 5 stars`}
                size={30}
              />
              <Text style={s.summaryCount}>
                Based on {summary.ratingCount} {summary.ratingCount === 1 ? 'review' : 'reviews'}
              </Text>
            </View>

            <View style={s.list}>
              {reviews.map((review, index) => (
                <ReviewCard key={`${review.createdAt}-${index}`} review={review} />
              ))}
            </View>
          </>
        )}

        {showEmpty && (
          <View style={s.centered}>
            <View style={s.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Star size={48} color={D.secondary} fill={D.secondaryContainer} strokeWidth={1.75} />
            </View>
            <Text style={s.stateBody}>
              Your reviews will appear here as people you've worked with share their feedback.
            </Text>
          </View>
        )}
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="reviews"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },

  content: {
    flexGrow: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 42,
    color: D.onSurface,
  },

  // Warm mango-tinted card with a big number — visually unlike Screen 7's teal progress ring.
  summary: {
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(254,137,62,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(254,137,62,0.32)',
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  summaryCaption: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    letterSpacing: 1.2,
    color: D.onSecondaryContainer,
  },
  summaryNumber: {
    fontFamily: Typography.fontDisplay,
    fontSize: 56,
    lineHeight: 64,
    color: D.onSurface,
  },
  summaryCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  list: { gap: Spacing.md },

  centered: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapWarn: { backgroundColor: D.secondaryContainer },
  illustration: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(254,137,62,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(254,137,62,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  stateTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 34,
    color: D.onSurface,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  stateBtn: { alignSelf: 'stretch', marginTop: Spacing.md },
});

export default ReviewsRatingsScreen;
