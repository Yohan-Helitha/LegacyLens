import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Award, Mic, ChevronDown } from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../theme';
import { Avatar, Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  AnalyticsSummaryCard,
  ElderNavDrawer,
  StoryHeroCard,
  StoryListCard,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useAnalyticsSummary } from '../../hooks/useAnalyticsSummary';
import { useRecentStories } from '../../hooks/useRecentStories';
import { useConversations } from '../../hooks/useConversations';
import { useAwaitingWorkCount } from '../../hooks/useAwaitingWorkCount';
import { resolveImageUrl } from '../../constants/api';
import type { ConversationSummary } from '../../types/messaging';
import type { StoryStatus, StorySummary } from '../../types/story';
import { useTranslation } from 'react-i18next';

/** How many recent stories the dashboard preview shows before "View All". */
const DASHBOARD_STORY_PREVIEW_COUNT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// TrustBadgeSection — tapping it opens the full Trust Score Detail screen
// ─────────────────────────────────────────────────────────────────────────────
const TrustBadgeSection: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { t } = useTranslation('contentCapture');
  return (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.trustCard, pressed && s.pressedLight]}
    accessibilityRole="button"
    accessibilityLabel={t('dashboard.trustAria')}
  >
    <View style={s.trustIconWrap}>
      <Award size={32} color={D.onSecondaryContainer} strokeWidth={2} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.trustTitle}>{t('dashboard.trustTitle')}</Text>
      <Text style={s.trustSubtitle}>{t('dashboard.trustSubtitle', { level: 4, count: 12 })}</Text>
    </View>
  </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PrimaryActionSection — "Record a new story"
// ─────────────────────────────────────────────────────────────────────────────
const PrimaryActionSection: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { t } = useTranslation('contentCapture');
  return (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.recordBtn, pressed && s.pressedLight]}
    accessibilityRole="button"
    accessibilityLabel={t('dashboard.recordTitle')}
  >
    <View style={s.recordIconWrap}>
      <Mic size={40} color={D.onSecondaryContainer} strokeWidth={2} />
    </View>
    <Text style={s.recordTitle}>{t('dashboard.recordTitle')}</Text>
    <Text style={s.recordSubtitle}>{t('dashboard.recordSubtitle')}</Text>
  </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WorkToReviewCard - shown only while creators' submitted work is waiting for this elder
// ─────────────────────────────────────────────────────────────────────────────
const WorkToReviewCard: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { t } = useTranslation('contentCapture');
  const waiting = useAwaitingWorkCount();
  if (waiting === 0) return null;
  const text = t('dashboard.workWaiting', { count: waiting });
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.workCard, pressed && s.pressedLight]}
      accessibilityRole="button"
      accessibilityLabel={`${text}. ${t('dashboard.reviewWork')}`}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.workCardText}>{text}</Text>
        <Text style={s.workCardCta}>{t('dashboard.reviewWork')}</Text>
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RequestsSection — "Requests for you": the creators who have messaged the elder
// ─────────────────────────────────────────────────────────────────────────────
/** How many conversations the dashboard shows before "See all messages". */
const DASHBOARD_MESSAGE_PREVIEW_COUNT = 3;

interface RequestsSectionProps {
  onOpenChat?: (conversationId: string) => void;
  onViewAll?: () => void;
}

const RequestsSection: React.FC<RequestsSectionProps> = ({ onOpenChat, onViewAll }) => {
  const { t } = useTranslation('contentCapture');
  const { conversations, loading, loadError } = useConversations('ALL', '');
  const preview = conversations.slice(0, DASHBOARD_MESSAGE_PREVIEW_COUNT);

  const previewText = (item: ConversationSummary) => {
    if (item.lastMessageType === 'VOICE_NOTE') return t('dashboardMessages.voiceMessage');
    return item.lastMessagePreview?.trim() || t('dashboardMessages.noMessagesYet');
  };

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('dashboard.requestsTitle')}</Text>

      {loading && conversations.length === 0 && <ActivityIndicator color={D.primary} />}

      {loadError && conversations.length === 0 && (
        <Text style={s.emptyStoriesText}>{t('dashboardMessages.loadError')}</Text>
      )}

      {!loading && !loadError && conversations.length === 0 && (
        <Text style={s.emptyStoriesText}>{t('dashboardMessages.empty')}</Text>
      )}

      {preview.map((item) => {
        const name = item.otherParticipant.name;
        return (
          <View key={item.id} style={s.requestCard}>
            <View style={s.requestHeader}>
              <Avatar size={56} uri={resolveImageUrl(item.otherParticipant.avatarUrl)} />
              <View style={{ flex: 1 }}>
                <Text style={s.requestName} numberOfLines={1}>
                  {name}
                </Text>
                {!!item.context?.title && (
                  <Text style={s.requestDesc} numberOfLines={1}>
                    {t('dashboardMessages.about', { title: item.context.title })}
                  </Text>
                )}
                <Text style={s.requestPreview} numberOfLines={2}>
                  {item.lastMessageFromMe ? t('dashboardMessages.you') : ''}
                  {previewText(item)}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View
                  style={s.unreadBadge}
                  accessible
                  accessibilityLabel={t('dashboardMessages.unreadAria', { count: item.unreadCount })}
                >
                  <Text style={s.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => onOpenChat?.(item.id)}
              style={({ pressed }) => [s.replyBtn, pressed && s.pressedLight]}
              accessibilityRole="button"
              accessibilityLabel={`${t('dashboardMessages.openChat')}: ${name}`}
            >
              <Text style={s.replyBtnText}>{t('dashboardMessages.openChat')}</Text>
            </Pressable>
          </View>
        );
      })}

      {conversations.length > 0 && (
        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [s.viewAllBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.viewAllText}>{t('dashboardMessages.viewAll')}</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// YourStoriesSection — "Your Stories"
// ─────────────────────────────────────────────────────────────────────────────
interface YourStoriesSectionProps {
  stories: StorySummary[];
  totalCount: number;
  loading: boolean;
  onViewAllPress?: () => void;
  onOpenStory?: (story: StorySummary) => void;
}

/**
 * The two newest stories, shown with the same cards as My Stories (the newest featured larger, the
 * next as a list row). Like on My Stories, tapping a card is the only interaction — delete and
 * editing live on the story's own screen.
 */
const YourStoriesSection: React.FC<YourStoriesSectionProps> = ({
  stories,
  totalCount,
  loading,
  onViewAllPress,
  onOpenStory,
}) => {
  const { t } = useTranslation('contentCapture');
  const [hero, ...rest] = stories.slice(0, DASHBOARD_STORY_PREVIEW_COUNT);

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('dashboard.yourStories')}</Text>

      {!loading && !hero && <Text style={s.emptyStoriesText}>{t('dashboard.noStories')}</Text>}

      <View style={{ gap: Spacing.sm }}>
        {!!hero && <StoryHeroCard story={hero} onPress={() => onOpenStory?.(hero)} />}
        {rest.map((story) => (
          <StoryListCard key={story.id} story={story} onPress={() => onOpenStory?.(story)} />
        ))}
      </View>

      {totalCount > 0 && (
        <Pressable
          onPress={onViewAllPress}
          style={({ pressed }) => [s.viewAllBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.viewAllText}>{t('dashboard.viewAll')}</Text>
          <ChevronDown size={16} color={D.onSurfaceVariant} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
interface ElderDashboardProps {
  onTabPress?: (tab: UserTabKey) => void;
  onOpenTrustScore?: () => void;
  onRecordStory?: () => void;
  /** Opens the chat with a creator who messaged the elder. */
  onOpenChat?: (conversationId: string) => void;
  /** Opens the full messages inbox. */
  onOpenMessages?: () => void;
  /** Opens Submitted Work, where creators' finished work is approved or declined. */
  onOpenSubmittedWork?: () => void;
  onViewAllStories?: () => void;
  /** Opens My Stories on its Published tab — where the analytics for each story live. */
  onOpenAnalytics?: () => void;
  /** Opens a story that isn't published yet (draft / pending / rejected) in the story form. */
  onOpenStory?: (storyId: string, status: StoryStatus) => void;
  /** Opens a published story's analytics. */
  onOpenPublishedStory?: (storyId: string) => void;
  /** Fired when a drawer item other than "Home" is tapped — no screens exist for these yet */
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

export const ElderDashboard: React.FC<ElderDashboardProps> = ({
  onTabPress,
  onOpenTrustScore,
  onRecordStory,
  onOpenChat,
  onOpenMessages,
  onOpenSubmittedWork,
  onViewAllStories,
  onOpenAnalytics,
  onOpenStory,
  onOpenPublishedStory,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { stories, totalCount, loading: storiesLoading } = useRecentStories(DASHBOARD_STORY_PREVIEW_COUNT);
  const { summary: analytics, loading: analyticsLoading, loadError: analyticsError } = useAnalyticsSummary();
  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="Legacy Lens" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnalyticsSummaryCard
          summary={analytics}
          loading={analyticsLoading}
          loadError={analyticsError}
          onPress={onOpenAnalytics ?? onViewAllStories}
        />
        <TrustBadgeSection onPress={onOpenTrustScore} />
        <PrimaryActionSection onPress={onRecordStory} />
        <WorkToReviewCard onPress={onOpenSubmittedWork} />
        <RequestsSection onOpenChat={onOpenChat} onViewAll={onOpenMessages} />
        <YourStoriesSection
          stories={stories}
          totalCount={totalCount}
          loading={storiesLoading}
          onViewAllPress={onViewAllStories}
          onOpenStory={(story) =>
            story.status === 'PUBLISHED' ? onOpenPublishedStory?.(story.id) : onOpenStory?.(story.id, story.status)
          }
        />
        <View style={{ height: 8 }} />
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="home"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Trust badge ────────────────────────────────────────────────────────────
  trustCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: D.surfaceContainerLow, padding: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  trustIconWrap: {
    width: 64, height: 64, borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.secondaryContainer, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 3,
  },
  trustTitle:    { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onSurface, marginBottom: 2 },
  trustSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },

  // ── Record button ──────────────────────────────────────────────────────────
  recordBtn: {
    backgroundColor: D.primaryContainer, borderRadius: Radii.xl,
    paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.primaryContainer, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 4,
  },
  recordIconWrap: {
    width: 80, height: 80, borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    shadowColor: D.secondaryContainer, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 3,
  },
  recordTitle: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onPrimary,
    marginBottom: Spacing.xs, textAlign: 'center',
  },
  recordSubtitle: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onPrimaryContainer,
    opacity: 0.9, textAlign: 'center',
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section:      { gap: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: D.onSurface },

  // ── Requests ───────────────────────────────────────────────────────────────
  requestCard: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, gap: Spacing.md,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  requestName:   { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface, marginBottom: 2 },
  workCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: D.secondaryContainer, borderRadius: Radii.xl, padding: Spacing.md, minHeight: 72,
  },
  workCardText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSecondaryContainer },
  workCardCta: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSecondaryContainer, textDecorationLine: 'underline', marginTop: 2 },
  requestPreview: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurfaceVariant, marginTop: 2 },
  unreadBadge: {
    minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 8,
    backgroundColor: D.secondary, alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  requestDesc:   { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },
  replyBtn: {
    backgroundColor: D.secondaryContainer, borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48,
  },
  replyBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSecondaryContainer },

  emptyStoriesText: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant,
  },

  // ── View all ───────────────────────────────────────────────────────────────
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
    borderRadius: Radii.full, paddingVertical: 12, marginTop: 4,
  },
  viewAllText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed:      { opacity: 0.75 },
  pressedLight: { opacity: 0.88 },
});

export default ElderDashboard;
