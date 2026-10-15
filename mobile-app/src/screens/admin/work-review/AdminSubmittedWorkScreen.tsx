import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PersonPhoto } from '../../../components/module-specific/marketplace/PersonPhoto';
import { adminWorkReviewApi } from '../../../services/api/adminWorkReviewApi';
import { useWorkReviewList } from '../../../hooks/useWorkReviewList';
import { useLocaleStore } from '../../../store/localeStore';
import { formatTimeAgo } from '../../../utils/timeAgo';
import type { WorkSubmissionSummary } from '../../../types/workReview';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { adminGlobalStyles as g } from '../adminGlobalStyles';

interface AdminSubmittedWorkScreenProps {
  onOpenWork: (jobId: string) => void;
}

/** "Knowledge holder: Approved" - one reviewer's sign-off, green once given. */
const Chip: React.FC<{ who: string; done: boolean }> = ({ who, done }) => (
  <View style={[s.chip, done ? s.chipDone : s.chipWaiting]}>
    <MaterialIcons name={done ? 'check-circle' : 'schedule'} size={13} color={done ? Colors.white : Colors.textMuted} />
    <Text style={[s.chipText, done && { color: Colors.white }]}>
      {who}: {done ? 'Approved' : 'Waiting'}
    </Text>
  </View>
);

const SENT_BACK_BY = { KNOWLEDGE_HOLDER: 'the knowledge holder', ADMIN: 'an admin', BOTH: 'the knowledge holder and an admin' } as const;

const WorkCard: React.FC<{ item: WorkSubmissionSummary; onPress: () => void }> = ({ item, onPress }) => {
  const locale = useLocaleStore((state) => state.locale);
  const ago = formatTimeAgo(item.submittedAt, locale);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} by ${item.creatorName}`}
      style={({ pressed }) => [g.card, s.card, pressed && { opacity: 0.88 }]}
    >
      <PersonPhoto name={item.creatorName} size={46} />
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          By {item.creatorName}
          {item.elderName ? ` · for ${item.elderName}` : ''}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {[item.category, ago ? `Submitted ${ago}` : ''].filter(Boolean).join(' · ')}
        </Text>
        <View style={s.chips}>
          <Chip who="Knowledge holder" done={item.elderApproved} />
          <Chip who="Admin" done={item.adminApproved} />
        </View>
        {item.state === 'CHANGES_REQUESTED' && !!item.sentBackBy && (
          <Text style={s.sentBack}>Sent back by {SENT_BACK_BY[item.sentBackBy]}</Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
    </Pressable>
  );
};

/**
 * Admin > Submitted Work: work content creators have finished, for the admin to approve, send back or publish.
 * Separate from the Moderation queue (that is for stories elders record). Real data only.
 */
export const AdminSubmittedWorkScreen: React.FC<AdminSubmittedWorkScreenProps> = ({ onOpenWork }) => {
  const { items, awaiting, changesRequested, readyToPublish, published, loading, refreshing, loadError, refresh, reload } =
    useWorkReviewList(adminWorkReviewApi.list);

  const group = (title: string, list: WorkSubmissionSummary[]) =>
    list.length > 0 && (
      <View style={s.group}>
        <Text style={s.groupTitle} accessibilityRole="header">
          {title} ({list.length})
        </Text>
        {list.map((item) => (
          <WorkCard key={item.jobId} item={item} onPress={() => onOpenWork(item.jobId)} />
        ))}
      </View>
    );

  return (
    <View style={g.safeArea}>
      <ScrollView
        contentContainerStyle={g.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.secondary} colors={[Colors.secondary]} />}
      >
        <Text style={s.pageTitle} accessibilityRole="header">
          Submitted Work
        </Text>
        <Text style={s.pageSub}>Work content creators have finished. Elder-recorded stories are reviewed in Moderation.</Text>

        {loading && items.length === 0 && <ActivityIndicator size="large" color={Colors.secondary} style={s.state} />}

        {loadError && items.length === 0 && (
          <View style={s.state}>
            <MaterialIcons name="error-outline" size={32} color={Colors.textMuted} />
            <Text style={s.stateText}>Couldn't load the submitted work. Check your connection and try again.</Text>
            <Pressable onPress={reload} style={s.retry} accessibilityRole="button">
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!loading && !loadError && items.length === 0 && (
          <View style={s.state}>
            <MaterialIcons name="assignment-turned-in" size={40} color={Colors.secondary} />
            <Text style={s.stateTitle}>Nothing submitted yet</Text>
            <Text style={s.stateText}>When a creator submits finished work it will appear here.</Text>
          </View>
        )}

        {group('Awaiting review', awaiting)}
        {group('Sent back', changesRequested)}
        {group('Ready to publish', readyToPublish)}
        {group('Published', published)}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  pageTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 32, color: Colors.text },
  pageSub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.textMuted, marginBottom: Spacing.md },
  group: { gap: Spacing.sm, marginBottom: Spacing.md },
  groupTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.text },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  body: { flex: 1, gap: 3 },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: Colors.text },
  sub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, lineHeight: 16, color: Colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radii.full, paddingVertical: 3, paddingHorizontal: 9 },
  chipDone: { backgroundColor: Colors.secondary },
  chipWaiting: { backgroundColor: Colors.surface },
  chipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, lineHeight: 16, color: Colors.text },
  sentBack: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#9b4600', marginTop: 2 },
  state: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  stateTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: Colors.text },
  stateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.textMuted, textAlign: 'center' },
  retry: { backgroundColor: Colors.secondary, borderRadius: Radii.full, paddingVertical: 12, paddingHorizontal: Spacing.lg, minHeight: 44, justifyContent: 'center' },
  retryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.white },
});

export default AdminSubmittedWorkScreen;
