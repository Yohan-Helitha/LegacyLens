import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, ClipboardCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  HireActionButton,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { WorkSubmissionCard } from '../../components/module-specific/content-capture/WorkSubmissionCard';
import { useWorkReviewList } from '../../hooks/useWorkReviewList';
import type { WorkSubmissionSummary } from '../../types/workReview';
import { Typography, Spacing } from '../../theme';

interface SubmittedWorkScreenProps {
  onOpenWork?: (jobId: string) => void;
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Submitted Work - everything creators have finished for the elder, grouped by what the elder has to do:
 * review it, what was sent back for changes, and what is approved. Real data only; empty and error states
 * are shown instead of any sample content.
 */
export const SubmittedWorkScreen: React.FC<SubmittedWorkScreenProps> = ({ onOpenWork, onTabPress, onDrawerNavigate, onLogout }) => {
  const { t } = useTranslation('contentCapture');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { items, awaiting, changesRequested, approved, loading, refreshing, loadError, refresh, reload } = useWorkReviewList();

  const open = (item: WorkSubmissionSummary) => onOpenWork?.(item.jobId);
  const group = (title: string, list: WorkSubmissionSummary[]) =>
    list.length > 0 && (
      <View style={s.group}>
        <Text style={s.groupTitle} accessibilityRole="header">
          {title} ({list.length})
        </Text>
        {list.map((item) => (
          <WorkSubmissionCard key={item.jobId} item={item} onPress={open} />
        ))}
      </View>
    );

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <Header title={t('submittedWork.headerTitle')} onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={D.primary} colors={[D.primary]} />}
      >
        <Text style={s.title} accessibilityRole="header">
          {t('submittedWork.heading')}
        </Text>
        <Text style={s.subtitle}>{t('submittedWork.subtitle')}</Text>

        {loading && items.length === 0 && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={D.primary} />
          </View>
        )}

        {loadError && items.length === 0 && (
          <View style={s.centered}>
            <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            <Text style={s.stateBody}>{t('submittedWork.loadError')}</Text>
            <HireActionButton label={t('submittedWork.retry')} onPress={reload} style={s.stateBtn} />
          </View>
        )}

        {!loading && !loadError && items.length === 0 && (
          <View style={s.centered}>
            <ClipboardCheck size={44} color={D.primary} strokeWidth={1.75} />
            <Text style={s.stateTitle}>{t('submittedWork.empty')}</Text>
            <Text style={s.stateBody}>{t('submittedWork.emptyBody')}</Text>
          </View>
        )}

        {group(t('submittedWork.awaiting'), awaiting)}
        {group(t('submittedWork.changes'), changesRequested)}
        {group(t('submittedWork.approvedGroup'), approved)}
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="submittedWork"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.size2XL, lineHeight: 42, color: D.onSurface },
  subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurfaceVariant },
  group: { gap: Spacing.sm },
  groupTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSurface },
  centered: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md },
  stateTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 34, color: D.onSurface, textAlign: 'center' },
  stateBody: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurfaceVariant, textAlign: 'center' },
  stateBtn: { alignSelf: 'stretch', marginTop: Spacing.md },
});

export default SubmittedWorkScreen;
