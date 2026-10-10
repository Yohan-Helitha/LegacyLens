import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import {
  ApplicationSummary,
  DeleteApplicationButton,
} from '../../../components/module-specific/marketplace/ApplicationCard';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import { useMyApplications } from '../../../hooks/useMyApplications';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { groupApplications, sentLabel } from '../../../utils/applicationGroups';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Icons for the two section headers
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const BookmarkIcon: React.FC<IconProps> = ({ size = 18, color = D.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

const SendIcon: React.FC<IconProps> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2L11 13" />
    <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

const SectionHeader: React.FC<{
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  tone: 'teal' | 'orange';
}> = ({ title, count, subtitle, icon, tone }) => (
  <View style={s.sectionHeader}>
    <View style={s.sectionHeaderRow}>
      <View style={[s.sectionIcon, tone === 'orange' ? s.sectionIconOrange : s.sectionIconTeal]}>{icon}</View>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={[s.countPill, tone === 'orange' && s.countPillOrange]}>
        <Text style={s.countPillText}>{count}</Text>
      </View>
    </View>
    <Text style={s.sectionSubtitle}>{subtitle}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SavedOpportunityApplication: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onEditDraft: (opportunityId: string) => void;
  onViewOpportunity: (opportunityId: string) => void;
  onOpenRejectedApplications: () => void;
}> = ({ onNavigate, onBack, onEditDraft, onViewOpportunity, onOpenRejectedApplications }) => {
  const { applications, loaded, error: loadError, reload } = useMyApplications();
  const [refreshing, setRefreshing] = useState(false);

  // Every status shown here comes straight from the server. A failed load says so - it must never
  // look like "nothing saved" - and the page can be pulled down to refresh.
  const handleRefresh = () => {
    setRefreshing(true);
    reload().finally(() => setRefreshing(false));
  };

  // A rejected application is still one that was sent, so it counts under "Submitted" - but it is
  // listed on its own Rejected Applications page, so this page only lists what is still waiting.
  // APPROVED is excluded: once approved it moves to the dashboard's Upcoming Booking tab.
  const { saved, waiting, rejected, sentCount } = groupApplications(applications);

  const handleSubmit = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.submit(record.id);
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not submit this application.';
      Alert.alert('Submit failed', message);
    }
  };

  const handleView = (record: OpportunityApplicationResponse) => {
    onViewOpportunity(record.opportunityId);
  };

  // TEMPORARY: self-approve until a real knowledge-holder review UI exists —
  // see OpportunityApplicationController#approve's javadoc on the backend.
  const handleApprove = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.approve(record.id);
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not approve this application.';
      Alert.alert('Approve failed', message);
    }
  };

  // TEMPORARY: self-reject, standing in for the knowledge holder the same way handleApprove does.
  const handleReject = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.reject(record.id);
      reload();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reject this application.';
      Alert.alert('Reject failed', message);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={D.primary} colors={[D.primary]} />}
      >
        {loadError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{loadError}</Text>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [s.retryBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Try loading your applications again"
            >
              <Text style={s.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* Saved Application */}
        <View style={s.section}>
          <SectionHeader
            title="Saved Application"
            count={saved.length}
            subtitle="Drafts you can still edit."
            icon={<BookmarkIcon />}
            tone="teal"
          />

          {!loaded || loadError ? null : saved.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>No saved drafts yet.</Text>
            </View>
          ) : (
            saved.map((record) => (
              <ApplicationSummary
                key={record.id}
                record={record}
                trailing={<DeleteApplicationButton record={record} onDeleted={reload} />}
              >
                <View style={s.actionsRow}>
                  <Pressable
                    onPress={() => onEditDraft(record.opportunityId)}
                    style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${record.title}`}
                  >
                    <Text style={s.outlineBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSubmit(record)}
                    style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Submit ${record.title}`}
                  >
                    <Text style={s.fillBtnText}>Submit</Text>
                  </Pressable>
                </View>
              </ApplicationSummary>
            ))
          )}
        </View>

        {/* Submitted Application */}
        <View style={s.section}>
          <SectionHeader
            title="Submitted Application"
            count={sentCount}
            subtitle="Application already you have sent to the knowledge holder."
            icon={<SendIcon />}
            tone="orange"
          />

          {/* "2 sent · 1 waiting · 1 rejected" - the rejected part opens the Rejected Applications page. */}
          {loaded && !loadError && sentCount > 0 && (
            <View style={s.summaryLine}>
              <Text style={s.summaryText}>{sentLabel(sentCount)}</Text>
              <Text style={s.summaryDot}>{'·'}</Text>
              <Text style={s.summaryText}>{`${waiting.length} waiting`}</Text>
              {rejected.length > 0 && (
                <>
                  <Text style={s.summaryDot}>{'·'}</Text>
                  <Pressable
                    onPress={onOpenRejectedApplications}
                    style={({ pressed }) => [s.rejectedLink, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${rejected.length} rejected - open rejected applications`}
                  >
                    <Text style={s.rejectedLinkText}>{`${rejected.length} rejected  ›`}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {!loaded || loadError ? null : waiting.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>
                {rejected.length > 0 ? 'Nothing is waiting for a reply.' : 'Nothing submitted yet.'}
              </Text>
            </View>
          ) : (
            waiting.map((record) => (
              <ApplicationSummary key={record.id} record={record}>
                <View style={{ gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => handleView(record)}
                    style={({ pressed }) => [s.outlineBtn, s.viewBtnFull, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${record.title}`}
                  >
                    <Text style={s.outlineBtnText}>View Opportunity</Text>
                  </Pressable>
                  {/* TEMPORARY: both stand in for the knowledge holder's own decision until that review UI exists. */}
                  <View style={s.actionsRow}>
                    <Pressable
                      onPress={() => handleReject(record)}
                      style={({ pressed }) => [s.dangerBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Reject ${record.title}`}
                    >
                      <Text style={s.dangerBtnText}>Reject (Test)</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(record)}
                      style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Approve ${record.title}`}
                    >
                      <Text style={s.fillBtnText}>Approve (Test)</Text>
                    </Pressable>
                  </View>
                </View>
              </ApplicationSummary>
            ))
          )}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default SavedOpportunityApplication;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  section: { gap: Spacing.md },
  sectionHeader: { gap: 6, paddingHorizontal: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionIconTeal: { backgroundColor: '#E3F1F0' },
  sectionIconOrange: { backgroundColor: '#FFF0E0' },
  sectionTitle: { flex: 1, fontFamily: Typography.fontDisplay, fontSize: 18, color: D.primary },
  countPill: {
    minWidth: 28, height: 24, paddingHorizontal: 9, borderRadius: 12,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center',
  },
  countPillOrange: { backgroundColor: D.secondary },
  countPillText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: '#ffffff' },
  sectionSubtitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 12.5,
    color: '#5B7A7A',
    lineHeight: 18,
    paddingLeft: 2,
  },

  // ── "2 sent · 1 waiting · 1 rejected" ────────────────────────────────────
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  summaryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  summaryDot: { fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  rejectedLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  rejectedLinkText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#B3261E' },

  emptyState: {
    paddingVertical: Spacing.lg, alignItems: 'center',
    borderRadius: Radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLow,
  },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Actions ──────────────────────────────────────────────────────────────
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, paddingTop: 2 },
  outlineBtn: {
    flex: 1, paddingVertical: 9, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: D.secondary, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  outlineBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: D.secondary },
  fillBtn: {
    flex: 1, paddingVertical: 9, borderRadius: Radii.full,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  fillBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: '#ffffff' },
  viewBtnFull: { flex: 0, alignSelf: 'stretch' },
  // TEMPORARY (see handleReject) — a distinct destructive tone, not otherwise used in this palette.
  dangerBtn: {
    flex: 1, paddingVertical: 9, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: '#C0392B', alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  dangerBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: '#C0392B' },

  // ── Load error ───────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: '#FDECEA', borderRadius: Radii.xl, padding: Spacing.md, gap: Spacing.sm, alignItems: 'center',
  },
  errorText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: '#B3261E', textAlign: 'center' },
  retryBtn: {
    paddingVertical: 8, paddingHorizontal: 20, minHeight: 44, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: '#B3261E', alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#B3261E' },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
