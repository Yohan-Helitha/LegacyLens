import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  Award,
  Mic,
  Clock,
  ChevronDown,
  Wallet,
} from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../theme';
import { ConfirmDialog, Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  StoryCard,
  toStoryCardItem,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useStoriesList } from '../../hooks/useStoriesList';
import type { StoryResponse } from '../../types/story';

/** How many recent stories the dashboard preview shows before "View All". */
const DASHBOARD_STORY_PREVIEW_COUNT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// TrustBadgeSection
// ─────────────────────────────────────────────────────────────────────────────
const TrustBadgeSection: React.FC = () => (
  <View style={s.trustCard}>
    <View style={s.trustIconWrap}>
      <Award size={32} color={D.onSecondaryContainer} strokeWidth={2} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.trustTitle}>Knowledge Keeper</Text>
      <Text style={s.trustSubtitle}>Level 4 • 12 Stories shared</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// BalanceCard — "Your Balance"
// ─────────────────────────────────────────────────────────────────────────────
interface BalanceCardProps {
  onHistoryPress?: () => void;
  onWithdrawPress?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ onHistoryPress, onWithdrawPress }) => {
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  return (
  <View
    style={s.balanceCard}
    onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      setCardSize({ width, height });
    }}
  >
    {cardSize.width > 0 && cardSize.height > 0 && (
      <Svg style={StyleSheet.absoluteFillObject} width={cardSize.width} height={cardSize.height}>
        <Defs>
          <LinearGradient id="balanceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={D.primaryContainer} />
            <Stop offset="100%" stopColor={D.primary} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={cardSize.width} height={cardSize.height} rx={Radii.xl} fill="url(#balanceGrad)" />
      </Svg>
    )}

    <View style={s.balanceTopRow}>
      <View style={s.balanceIconWrap}>
        <Wallet size={24} color={D.onPrimary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.balanceLabel}>YOUR BALANCE</Text>
        <Text style={s.balanceAmount}>LKR 8,400</Text>
      </View>
    </View>

    <View style={s.balancePendingRow}>
      <Clock size={14} color={D.onPrimary} strokeWidth={2} />
      <Text style={s.balancePendingText}>LKR 1,200 pending clearance</Text>
    </View>

    <View style={s.balanceDivider} />

    <View style={s.balanceBtnRow}>
      <Pressable
        onPress={onHistoryPress}
        style={({ pressed }) => [s.balanceBtnOutline, pressed && s.pressedDark]}
        accessibilityRole="button"
      >
        <Text style={s.balanceBtnOutlineText}>History</Text>
      </Pressable>
      <Pressable
        onPress={onWithdrawPress}
        style={({ pressed }) => [s.balanceBtnFill, pressed && s.pressedLight]}
        accessibilityRole="button"
      >
        <Text style={s.balanceBtnFillText}>Withdraw</Text>
      </Pressable>
    </View>
  </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PrimaryActionSection — "Record a new story"
// ─────────────────────────────────────────────────────────────────────────────
const PrimaryActionSection: React.FC<{ onPress?: () => void }> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.recordBtn, pressed && s.pressedLight]}
    accessibilityRole="button"
    accessibilityLabel="Record a new story"
  >
    <View style={s.recordIconWrap}>
      <Mic size={40} color={D.onSecondaryContainer} strokeWidth={2} />
    </View>
    <Text style={s.recordTitle}>Record a new story</Text>
    <Text style={s.recordSubtitle}>Share your memories clearly</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// RequestsSection — "Requests for you"
// ─────────────────────────────────────────────────────────────────────────────
const RequestsSection: React.FC<{ onReplyPress?: () => void }> = ({ onReplyPress }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>Requests for you</Text>

    <View style={s.requestCard}>
      <View style={s.requestHeader}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAItitEXnnv_2DgR2DwDVvYzkRdZv9-QSxy4hMdVrlpwl6huv6zdhPonX7oPm0NhibhZFbpMTIhY8_GkuOd31zmS_nqz0Ia7-zroTgbyI1inmxrx25UqKbSmFVDhYyN9ZiczHDRsij2vY6gPjHZEOvMZncArHmdtLpFDx6w3CYmYnrzzbB1MpRh3hqtnAGlj94hDY9PaoukZrL6ruFN02jFNH4sRDyhR8XHbFzyVTuEVMXEAbKcdwWwLA',
          }}
          style={s.requestAvatar}
          accessibilityLabel="Sarah Jenkins' profile photo"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.requestName}>Sarah Jenkins</Text>
          <Text style={s.requestDesc}>Asked about: Early life in Colombo</Text>
        </View>
      </View>

      <Pressable
        onPress={onReplyPress}
        style={({ pressed }) => [s.replyBtn, pressed && s.pressedLight]}
        accessibilityRole="button"
      >
        <Text style={s.replyBtnText}>Reply with voice</Text>
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// YourStoriesSection — "Your Stories"
// ─────────────────────────────────────────────────────────────────────────────
interface YourStoriesSectionProps {
  stories: StoryResponse[];
  loading: boolean;
  onViewAllPress?: () => void;
  onReview?: (story: StoryResponse) => void;
  onRequestDelete?: (storyId: string) => void;
}

const YourStoriesSection: React.FC<YourStoriesSectionProps> = ({
  stories,
  loading,
  onViewAllPress,
  onReview,
  onRequestDelete,
}) => {
  const preview = stories.slice(0, DASHBOARD_STORY_PREVIEW_COUNT);

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Your Stories</Text>

      {!loading && preview.length === 0 && (
        <Text style={s.emptyStoriesText}>You haven't recorded any stories yet.</Text>
      )}

      <View style={{ gap: Spacing.sm }}>
        {preview.map((story) => (
          <StoryCard
            key={story.id}
            story={toStoryCardItem(story)}
            onReview={() => onReview?.(story)}
            onDelete={() => onRequestDelete?.(story.id)}
          />
        ))}
      </View>

      {stories.length > 0 && (
        <Pressable
          onPress={onViewAllPress}
          style={({ pressed }) => [s.viewAllBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.viewAllText}>View All</Text>
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
  onRecordStory?: () => void;
  onReplyToRequest?: () => void;
  onViewAllStories?: () => void;
  onReviewStory?: (story: StoryResponse) => void;
  onHistoryPress?: () => void;
  onWithdrawPress?: () => void;
  /** Fired when a drawer item other than "Home" is tapped — no screens exist for these yet */
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

export const ElderDashboard: React.FC<ElderDashboardProps> = ({
  onTabPress,
  onRecordStory,
  onReplyToRequest,
  onViewAllStories,
  onReviewStory,
  onHistoryPress,
  onWithdrawPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { stories, loading: storiesLoading, deletingId, deleteStory } = useStoriesList();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteStory(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="Legacy Lens" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TrustBadgeSection />
        <PrimaryActionSection onPress={onRecordStory} />
        <RequestsSection onReplyPress={onReplyToRequest} />
        <YourStoriesSection
          stories={stories}
          loading={storiesLoading}
          onViewAllPress={onViewAllStories}
          onReview={onReviewStory}
          onRequestDelete={setDeleteTargetId}
        />
        <BalanceCard onHistoryPress={onHistoryPress} onWithdrawPress={onWithdrawPress} />
        <View style={{ height: 8 }} />
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="home"
        requestsCount={1}
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />

      <ConfirmDialog
        visible={!!deleteTargetId}
        title="Delete this story?"
        message="This can't be undone — the recording and details will be permanently removed."
        confirmLabel={deletingId ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
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

  // ── Balance card ───────────────────────────────────────────────────────────
  balanceCard: {
    borderRadius: Radii.xl, padding: Spacing.md, overflow: 'hidden',
    shadowColor: D.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 5,
  },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  balanceIconWrap: {
    width: 56, height: 56, borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onPrimary,
    letterSpacing: 1.2, opacity: 0.85, marginBottom: 2,
  },
  balanceAmount: {
    fontFamily: Typography.fontDisplay, fontSize: 28, lineHeight: 34,
    letterSpacing: -0.5, color: D.onPrimary,
  },
  balancePendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm,
  },
  balancePendingText: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onPrimary, opacity: 0.85,
  },
  balanceDivider: {
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: Spacing.md,
  },
  balanceBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  balanceBtnOutline: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 48, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceBtnOutlineText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  balanceBtnFill: {
    flex: 1, backgroundColor: D.onPrimary, borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  balanceBtnFillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },

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
  requestAvatar: { width: 56, height: 56, borderRadius: 28 },
  requestName:   { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface, marginBottom: 2 },
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
  pressedDark:  { backgroundColor: 'rgba(255,255,255,0.14)' },
  pressedLight: { opacity: 0.88 },
});

export default ElderDashboard;
