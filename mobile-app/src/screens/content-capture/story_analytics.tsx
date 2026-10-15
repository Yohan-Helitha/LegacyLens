import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowDown, ArrowUp, Eye, Heart, MessageCircle } from 'lucide-react-native';
import { Header, TranslatedText, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  RatingStars,
  StoryListenerPreview,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useStoryAnalytics } from '../../hooks/useStoryAnalytics';
import { formatCount } from '../../utils/formatCount';
import { resolveUploadUrl } from '../../constants/api';
import type { DailyViews, StoryReview } from '../../types/story';
import { Typography, Spacing, Radii } from '../../theme';
import { useTranslation } from 'react-i18next';
import { LOCALE_DATE_TAG } from '../../constants/hireStrings';
import { useLocaleStore } from '../../store/localeStore';

interface StoryAnalyticsProps {
  storyId: string;
  onBack?: () => void;
  onTabPress?: (tab: UserTabKey) => void;
}

const UP = { icon: D.primaryContainer, tint: 'rgba(15,92,92,0.12)', text: D.primaryContainer };
const DOWN = { icon: D.secondaryContainer, tint: 'rgba(254,137,62,0.2)', text: D.secondary };

const CHART_HEIGHT = 110;

/** BCP-47 tag for formatting dates in the elder's chosen language (not the phone's). */
function useDateTag(): string {
  return LOCALE_DATE_TAG[useLocaleStore((state) => state.locale)];
}

function formatDate(iso: string | null, tag: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
}

function weekdayLabel(isoDate: string, tag: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(tag, { weekday: 'short' });
}

/**
 * How one of the elder's published stories is doing: views, likes, comments, the last 7 days of views,
 * and what listeners said. Reached by tapping a story on My Stories' "Published" tab.
 */
export const StoryAnalytics: React.FC<StoryAnalyticsProps> = ({ storyId, onBack, onTabPress }) => {
  const { t } = useTranslation('contentCapture');
  const dateTag = useDateTag();
  const { analytics, loading, loadError } = useStoryAnalytics(storyId);

  const tone = analytics?.trending ? UP : DOWN;
  const Arrow = analytics?.trending ? ArrowUp : ArrowDown;

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title={t('analytics.title')} showBack onBackPress={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={s.centerState}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}

        {!loading && loadError && (
          <View style={s.centerState}>
            <Text style={s.mutedText}>{t('analytics.loadError')}</Text>
          </View>
        )}

        {!loading && !loadError && analytics && (
          <>
            <View style={{ gap: 4 }}>
              <Text style={s.storyTitle}>{analytics.title}</Text>
              {!!analytics.publishedAt && (
                <Text style={s.mutedText}>{t('analytics.publishedOn', { date: formatDate(analytics.publishedAt, dateTag) })}</Text>
              )}
            </View>

            <StoryListenerPreview storyId={analytics.storyId} />

            <View style={s.card}>
              <View style={s.trendRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.bigNumber}>{formatCount(analytics.viewCount)}</Text>
                  <Text style={s.mutedText}>{t('analytics.totalViews')}</Text>
                </View>
                <View style={[s.trendPill, { backgroundColor: tone.tint }]}>
                  <Arrow size={20} color={tone.icon} strokeWidth={3} />
                  <Text style={[s.trendText, { color: tone.text }]}>{Math.abs(analytics.trendPercent)}%</Text>
                </View>
              </View>
              <Text style={s.mutedText}>
                {t(analytics.trending ? 'analytics.summaryUp' : 'analytics.summaryDown', {
                  views: formatCount(analytics.viewsLast7Days),
                  previous: formatCount(analytics.viewsPrevious7Days),
                })}
              </Text>
            </View>

            <View style={s.statsRow}>
              <StatCard icon={<Eye size={20} color={D.primaryContainer} />} value={analytics.viewCount} label={t('analytics.views')} />
              <StatCard icon={<Heart size={20} color={D.primaryContainer} />} value={analytics.likesCount} label={t('analytics.likes')} />
              <StatCard
                icon={<MessageCircle size={20} color={D.primaryContainer} />}
                value={analytics.commentsCount}
                label={t('analytics.comments')}
              />
            </View>

            <View style={s.card}>
              <Text style={s.sectionTitle}>{t('analytics.last7Days')}</Text>
              <ViewsChart days={analytics.dailyViews} />
            </View>

            <View style={s.card}>
              <Text style={s.sectionTitle}>{t('analytics.reviewsTitle')}</Text>

              <View style={s.ratingBlock}>
                <RatingStars
                  rating={analytics.averageRating}
                  ratingText={analytics.averageRating != null ? analytics.averageRating.toFixed(1) : ''}
                  emptyText={t('analytics.noRatings')}
                  accessibilityLabel={
                    analytics.averageRating != null
                      ? t('analytics.ratedAria', { rating: analytics.averageRating.toFixed(1) })
                      : t('analytics.noRatings')
                  }
                  size={22}
                />
                {analytics.averageRating != null && (
                  <Text style={s.mutedText}>{t('analytics.overallRating', { count: analytics.ratingCount })}</Text>
                )}
              </View>

              <View style={s.divider} />

              {analytics.reviews.length === 0 ? (
                <Text style={s.mutedText}>{t('analytics.noComments')}</Text>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {analytics.reviews.map((review, index) => (
                    <ReviewRow key={`${review.createdAt}-${index}`} review={review} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />
    </View>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <View style={s.statCard}>
    {icon}
    <Text style={s.statValue}>{formatCount(value)}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const ViewsChart: React.FC<{ days: DailyViews[] }> = ({ days }) => {
  const { t } = useTranslation('contentCapture');
  const dateTag = useDateTag();
  const max = Math.max(1, ...days.map((d) => d.views));
  return (
    <View style={s.chart} accessible accessibilityLabel={t('analytics.dailyViewsAria', { values: days.map((d) => d.views).join(', ') })}>
      {days.map((day) => (
        <View key={day.date} style={s.chartColumn}>
          <Text style={s.chartValue}>{day.views > 0 ? day.views : ''}</Text>
          <View style={s.chartTrack}>
            <View
              style={[
                s.chartBar,
                { height: Math.max(day.views > 0 ? 6 : 3, (day.views / max) * CHART_HEIGHT) },
                day.views === 0 && s.chartBarEmpty,
              ]}
            />
          </View>
          <Text style={s.chartLabel}>{weekdayLabel(day.date, dateTag)}</Text>
        </View>
      ))}
    </View>
  );
};

const ReviewRow: React.FC<{ review: StoryReview }> = ({ review }) => {
  const { t } = useTranslation('contentCapture');
  const dateTag = useDateTag();
  const avatar = resolveUploadUrl(review.reviewerAvatarUrl);
  const initial = review.reviewerName?.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={s.reviewRow}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} accessibilityLabel={t('analytics.reviewerPhoto', { name: review.reviewerName })} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.reviewHeader}>
          <Text style={s.reviewerName} numberOfLines={1}>
            {review.reviewerName}
          </Text>
          <Text style={s.reviewDate}>{formatDate(review.createdAt, dateTag)}</Text>
        </View>
        <TranslatedText text={review.text} style={s.reviewText} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  centerState: { paddingVertical: Spacing.xl, alignItems: 'center' },

  storyTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onSurface },
  mutedText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },

  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigNumber: { fontFamily: Typography.fontDisplay, fontSize: 40, lineHeight: 46, color: D.onSurface },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  trendText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
  },
  statValue: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onSurface },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: Spacing.xs },
  chartColumn: { flex: 1, alignItems: 'center', gap: 4 },
  chartValue: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: D.onSurface, height: 16 },
  chartTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  chartBar: { width: 22, borderRadius: 6, backgroundColor: D.primaryContainer },
  chartBarEmpty: { backgroundColor: D.surfaceVariant },
  chartLabel: { fontFamily: Typography.fontBody, fontSize: 12, color: D.onSurfaceVariant },

  ratingBlock: { gap: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: D.outlineVariant, marginVertical: Spacing.xs },

  reviewRow: { flexDirection: 'row', gap: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: D.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSecondaryContainer },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  reviewerName: { flex: 1, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  reviewDate: { fontFamily: Typography.fontBody, fontSize: 12, color: D.onSurfaceVariant },
  reviewText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurface },
});

export default StoryAnalytics;
