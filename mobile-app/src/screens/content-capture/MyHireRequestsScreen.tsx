import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, HandHeart, Plus, Sparkles, X } from 'lucide-react-native';
import { ConfirmDialog, Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  CreatorApplicationCard,
  ElderNavDrawer,
  HireActionButton,
  HireRequestCard,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useHireRequests } from '../../hooks/useHireRequests';
import type { HireRequestItem } from '../../hooks/useHireRequests';
import { useHireStrings } from '../../hooks/useHireStrings';
import { useElderApplications } from '../../hooks/useElderApplications';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radii } from '../../theme';

interface MyHireRequestsScreenProps {
  /** True right after posting — shows a dismissible "we're reviewing it" banner. */
  justPosted?: boolean;
  onPostRequest?: () => void;
  onViewApplicants?: (request: HireRequestItem) => void;
  onMessageCreator?: (request: HireRequestItem) => void;
  /** Opens the chat with a creator whose application the elder accepted. */
  onOpenChat?: (conversationId: string) => void;
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Screen 9 — My Requests. The elder's posted hire requests, newest first,
 * each with a status pill and the one action that makes sense for it. An
 * empty list gets a warm nudge back to Screen 8 instead of a blank page.
 */
export const MyHireRequestsScreen: React.FC<MyHireRequestsScreenProps> = ({
  justPosted = false,
  onPostRequest,
  onViewApplicants,
  onMessageCreator,
  onOpenChat,
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { t } = useHireStrings();
  const { t: tc } = useTranslation('contentCapture');
  const creatorApps = useElderApplications();
  const { requests, loading, refreshing, loadError, deletingId, deleteError, refresh, reload, removeRequest } =
    useHireRequests();

  const handleChat = async (application: Parameters<typeof creatorApps.openChat>[0]) => {
    const conversationId = await creatorApps.openChat(application);
    if (conversationId) onOpenChat?.(conversationId);
  };

  const refreshAll = () => {
    refresh();
    creatorApps.refresh();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    if (await removeRequest(deleteTargetId)) setDeleteTargetId(null);
    // On failure, leave the dialog open with removeRequest's own `deleting`
    // state cleared — the elder sees the inline deleteError text and can retry.
  };

  const showNotice = justPosted && !noticeDismissed;
  const showEmpty = !loading && !loadError && requests.length === 0;
  const showList = requests.length > 0;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header
        title={t('requests.headerTitle')}
        onMenuPress={() => setDrawerVisible(true)}
        menuLabel={t('common.openMenu')}
        notificationLabel={t('common.notifications')}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || creatorApps.refreshing}
            onRefresh={refreshAll}
            tintColor={D.primary}
            colors={[D.primary]}
          />
        }
      >
        <Text style={s.title} accessibilityRole="header">
          {t('requests.heading')}
        </Text>

        {showNotice && (
          <View style={s.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Sparkles size={20} color={D.secondary} strokeWidth={2} />
            <Text style={s.noticeText}>{t('requests.postedNotice')}</Text>
            <Pressable
              onPress={() => setNoticeDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel={t('requests.postedNoticeDismiss')}
              style={s.noticeClose}
            >
              <X size={18} color={D.onSurfaceVariant} strokeWidth={2} />
            </Pressable>
          </View>
        )}

        {loading && !showList && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel={t('common.loading')} />
          </View>
        )}

        {loadError && !showList && (
          <View style={s.centered}>
            <View style={[s.iconWrap, s.iconWrapWarn]}>
              <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.stateTitle}>{t('requests.loadError.title')}</Text>
            <Text style={s.stateBody}>{t('requests.loadError.body')}</Text>
            <HireActionButton label={t('common.retry')} onPress={reload} style={s.stateBtn} />
          </View>
        )}

        {showEmpty && (
          <View style={s.centered}>
            {/* Simple illustration: a soft teal disc holding a helping-hand, with a mango spark */}
            <View style={s.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={s.illustrationDisc}>
                <HandHeart size={56} color={D.primary} strokeWidth={1.75} />
              </View>
              <View style={s.illustrationSpark}>
                <Sparkles size={18} color={D.onSecondaryContainer} strokeWidth={2} />
              </View>
            </View>
            <Text style={s.stateTitle}>{t('requests.empty.title')}</Text>
            <Text style={s.stateBody}>{t('requests.empty.body')}</Text>
            <HireActionButton
              label={t('requests.empty.cta')}
              size="large"
              icon={Plus}
              onPress={onPostRequest}
              style={s.stateBtn}
            />
          </View>
        )}

        {showList && (
          <View style={s.list}>
            {requests.map((request) => (
              <HireRequestCard
                key={request.id}
                item={request}
                onViewApplicants={onViewApplicants}
                onMessage={onMessageCreator}
                onRequestDelete={(item) => setDeleteTargetId(item.id)}
                deleting={deletingId === request.id}
              />
            ))}

            <HireActionButton
              label={t('requests.newRequest')}
              variant="neutral"
              icon={Plus}
              onPress={onPostRequest}
            />
          </View>
        )}

        {/* Creators who applied to this elder's marketplace opportunities — accept one, then chat. */}
        <View style={s.applicantsSection}>
          <Text style={s.sectionTitle} accessibilityRole="header">
            {tc('creatorApps.title')}
          </Text>
          <Text style={s.sectionSubtitle}>{tc('creatorApps.subtitle')}</Text>

          {creatorApps.loading && creatorApps.applications.length === 0 && (
            <ActivityIndicator size="small" color={D.primary} accessibilityLabel={t('common.loading')} />
          )}

          {creatorApps.loadError && creatorApps.applications.length === 0 && (
            <View style={s.inlineState}>
              <Text style={s.stateBody}>{tc('creatorApps.loadError')}</Text>
              <HireActionButton label={t('common.retry')} variant="neutral" onPress={creatorApps.reload} />
            </View>
          )}

          {!creatorApps.loading && !creatorApps.loadError && creatorApps.applications.length === 0 && (
            <Text style={s.stateBody}>{tc('creatorApps.empty')}</Text>
          )}

          {creatorApps.actionError !== null && (
            <Text style={s.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {creatorApps.actionError || tc('creatorApps.actionError')}
            </Text>
          )}

          {creatorApps.applications.map((application) => (
            <CreatorApplicationCard
              key={application.id}
              application={application}
              busy={creatorApps.busyId === application.id}
              locked={creatorApps.busyId !== null}
              onAccept={(item) => creatorApps.approve(item.id)}
              onDecline={(item) => creatorApps.reject(item.id)}
              onChat={handleChat}
            />
          ))}
        </View>
      </ScrollView>

      {/* Persistent shortcut to post a new request — the drawer no longer has
          a direct "Hire a Creator" item, so this (plus the inline button at
          the end of the list, and the empty state's own CTA) is how a new
          request gets started from here. */}
      <Pressable
        onPress={onPostRequest}
        style={({ pressed }) => [
          s.fab,
          // UserFooter's own container is a fixed 64px tall, plus whatever
          // bottom safe-area inset this device needs under it (its own
          // SafeAreaView adds that padding) — bottom:76 alone undershot that
          // inset on a phone with a tall gesture bar, so the button sat
          // right on the footer instead of floating above it.
          { bottom: 64 + insets.bottom + Spacing.md },
          pressed && s.pressedLight,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('requests.askForHelp')}
      >
        <HandHeart size={22} color={D.onPrimary} strokeWidth={2} />
        <Text style={s.fabText}>{t('requests.askForHelp')}</Text>
      </Pressable>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="myRequests"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />

      <ConfirmDialog
        visible={!!deleteTargetId}
        title={t('requests.deleteConfirmTitle')}
        message={deleteError ? `${t('requests.deleteConfirmBody')}\n\n${t('requests.deleteError')}` : t('requests.deleteConfirmBody')}
        confirmLabel={deletingId === deleteTargetId ? t('requests.deleting') : t('requests.deleteAction')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
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
    // Clears the floating "Ask for help" button so the last card's actions stay tappable.
    paddingBottom: 160,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 42,
    color: D.onSurface,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(254,137,62,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(254,137,62,0.4)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  noticeText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurface,
  },
  // 44dp touch target; negative margin keeps the banner compact around the 18dp glyph.
  noticeClose: { width: 44, height: 44, margin: -10, alignItems: 'center', justifyContent: 'center' },

  list: { gap: Spacing.md },

  applicantsSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 34,
    color: D.onSurface,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 21,
    color: D.onSurfaceVariant,
  },
  inlineState: { gap: Spacing.sm },
  errorText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: '#ba1a1a',
  },

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
  illustration: { width: 132, height: 132, marginBottom: Spacing.md },
  illustrationDisc: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(15,92,92,0.10)',
    borderWidth: 2,
    borderColor: 'rgba(15,92,92,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationSpark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Matches your_stories.tsx's own FAB positioning (bottom: 76 clears the
  // UserFooter without overlapping it) — mango/secondary instead of teal so
  // it reads as a distinct action from "New Request".
  fab: {
    position: 'absolute',
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: D.secondary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    shadowColor: D.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  pressedLight: { opacity: 0.88 },
});

export default MyHireRequestsScreen;
