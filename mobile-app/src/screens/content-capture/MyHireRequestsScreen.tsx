import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, HandHeart, Plus, Sparkles, X } from 'lucide-react-native';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  HireActionButton,
  HireRequestCard,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useHireRequests } from '../../hooks/useHireRequests';
import type { HireRequestItem } from '../../hooks/useHireRequests';
import { useHireStrings } from '../../hooks/useHireStrings';
import { Typography, Spacing, Radii } from '../../theme';

interface MyHireRequestsScreenProps {
  /** True right after posting — shows a dismissible "we're reviewing it" banner. */
  justPosted?: boolean;
  onPostRequest?: () => void;
  onViewApplicants?: (request: HireRequestItem) => void;
  onMessageCreator?: (request: HireRequestItem) => void;
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
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const { t } = useHireStrings();
  const { requests, loading, refreshing, loadError, refresh, reload } = useHireRequests();

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
            refreshing={refreshing}
            onRefresh={refresh}
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
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="myRequests"
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
});

export default MyHireRequestsScreen;
