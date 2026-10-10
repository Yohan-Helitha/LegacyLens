import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { formatStamp } from '../../../utils/applicationDates';

// Shown when an opportunity has no picture of its own, or its picture cannot be loaded.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

/** Colours for each stage of an application, so the status reads at a glance. */
const STATUS_STYLES: Record<string, { label: string; background: string; text: string }> = {
  SAVED:    { label: 'Saved',    background: '#E3F1F0', text: '#0F5C5C' },
  PENDING:  { label: 'Pending',  background: '#FFF0E0', text: '#9E4A0D' },
  REJECTED: { label: 'Rejected', background: '#FDECEA', text: '#B3261E' },
};

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style/colour used across the opportunity screens
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <Line x1="9" y1="4" x2="15" y2="4" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const look = STATUS_STYLES[status] ?? STATUS_STYLES.SAVED;
  return (
    <View style={[s.badge, { backgroundColor: look.background }]}>
      <Text style={[s.badgeText, { color: look.text }]}>{look.label}</Text>
    </View>
  );
};

/** The opportunity's picture, or the default photo when it has none or it cannot load. */
const Thumb: React.FC<{ heroImageUrl: string | null; title: string }> = ({ heroImageUrl, title }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={(failed ? undefined : resolveOpportunityImage(heroImageUrl)) ?? GENERIC_HERO_IMAGE}
      style={s.thumb}
      resizeMode="cover"
      accessibilityLabel={title}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * One application, laid out like the opportunity card on the Apply screen: picture, title, elder
 * and place, then a date / payment strip - plus when it was saved or submitted.
 */
const ApplicationSummary: React.FC<{
  record: OpportunityApplicationResponse;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ record, trailing, children }) => {
  const isDraft = record.status === 'SAVED';
  const stamp = formatStamp(isDraft ? record.savedAt : record.submittedAt ?? record.savedAt);

  return (
    <View style={s.card}>
      <View style={s.cardTopRow}>
        <StatusBadge status={record.status} />
        {trailing}
      </View>

      <View style={s.summaryRow}>
        <Thumb heroImageUrl={record.heroImageUrl} title={record.title} />
        <View style={s.summaryText}>
          <Text style={s.cardTitle} numberOfLines={3}>{record.title}</Text>
          <Text style={s.elderName} numberOfLines={1}>{record.elderName}</Text>
          {!!record.location && (
            <View style={s.inline}>
              <PinIcon />
              <Text style={s.inlineText} numberOfLines={1}>{record.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.strip}>
        <View style={s.stripRow}>
          <View style={s.inline}>
            <CalendarIcon />
            <Text style={s.stripText}>{formatScheduledDate(record.scheduledDate)}</Text>
          </View>
          <View style={s.inline}>
            <CardIcon />
            <Text style={s.stripText}>{`LKR ${Math.round(record.offeredAmount).toLocaleString('en-US')}`}</Text>
          </View>
        </View>
        {!!record.timeWindowText && (
          <View style={s.inline}>
            <ClockIcon />
            <Text style={s.stripText}>{record.timeWindowText}</Text>
          </View>
        )}
      </View>

      {!!stamp && (
        <View style={s.stampRow}>
          <ClockIcon size={12} color={D.onSurfaceVariant} />
          <Text style={s.stampText}>{`${isDraft ? 'Saved' : 'Submitted'} on ${stamp}`}</Text>
        </View>
      )}

      {children}
    </View>
  );
};

const SectionHeader: React.FC<{ title: string; count: number; subtitle?: string }> = ({ title, count, subtitle }) => (
  <View style={s.sectionHeader}>
    <View style={s.sectionHeaderRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.countPill}>
        <Text style={s.countPillText}>{count}</Text>
      </View>
    </View>
    {!!subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
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
}> = ({ onNavigate, onBack, onEditDraft, onViewOpportunity }) => {
  const [applications, setApplications] = useState<OpportunityApplicationResponse[]>([]);

  const loadApplications = useCallback(() => {
    opportunityApplicationApi.getMyApplications().then(setApplications).catch(() => {});
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const saved = applications.filter((a) => a.status === 'SAVED');
  // APPROVED deliberately excluded — once approved it moves to the
  // dashboard's Upcoming Booking tab and no longer shows here.
  const submitted = applications.filter((a) => a.status === 'PENDING' || a.status === 'REJECTED');

  const confirmDelete = (record: OpportunityApplicationResponse) => {
    Alert.alert(
      'Delete this application?',
      `"${record.title}" will be removed${record.status === 'SAVED' ? ' from your saved drafts' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await opportunityApplicationApi.remove(record.id);
              loadApplications();
            } catch (err) {
              const message = err instanceof ApiError ? err.message : 'Could not delete this application.';
              Alert.alert('Delete failed', message);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.submit(record.id);
      loadApplications();
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
      loadApplications();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not approve this application.';
      Alert.alert('Approve failed', message);
    }
  };

  // TEMPORARY: self-reject, standing in for the knowledge holder the same way handleApprove does.
  const handleReject = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.reject(record.id);
      loadApplications();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reject this application.';
      Alert.alert('Reject failed', message);
    }
  };

  const deleteButton = (record: OpportunityApplicationResponse) => (
    <Pressable
      onPress={() => confirmDelete(record)}
      style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${record.title}`}
    >
      <TrashIcon />
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saved Application */}
        <View style={s.section}>
          <SectionHeader title="Saved Application" count={saved.length} subtitle="Drafts you can still edit." />

          {saved.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>No saved drafts yet.</Text>
            </View>
          ) : (
            saved.map((record) => (
              <ApplicationSummary key={record.id} record={record} trailing={deleteButton(record)}>
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
            count={submitted.length}
            subtitle="Application already you have sent to the knowledge holder."
          />

          {submitted.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>Nothing submitted yet.</Text>
            </View>
          ) : (
            submitted.map((record) => (
              <ApplicationSummary
                key={record.id}
                record={record}
                // Only a rejected request is the creator's to remove — while
                // pending, the decision belongs to the knowledge holder.
                trailing={record.status === 'REJECTED' ? deleteButton(record) : undefined}
              >
                {record.status === 'PENDING' ? (
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
                ) : (
                  <Pressable
                    onPress={() => handleView(record)}
                    style={({ pressed }) => [s.fillBtn, s.viewBtnFull, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${record.title}`}
                  >
                    <Text style={s.fillBtnText}>View Opportunity</Text>
                  </Pressable>
                )}
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

  section: { gap: Spacing.sm },
  sectionHeader: { gap: 2, paddingHorizontal: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: 16, color: D.onSurface },
  countPill: {
    minWidth: 24, height: 22, paddingHorizontal: 8, borderRadius: 11,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center',
  },
  countPillText: { fontFamily: Typography.fontBodySemi, fontSize: 11, color: '#ffffff' },
  sectionSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    lineHeight: 16,
  },

  emptyState: {
    paddingVertical: Spacing.lg, alignItems: 'center',
    borderRadius: Radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLow,
  },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Card (same look as the opportunity card on the Apply screen) ─────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  badge: { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, letterSpacing: 0.3 },

  summaryRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumb: {
    width: 84, height: 84, borderRadius: Radii.lg,
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  summaryText: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  elderName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineText: { flex: 1, fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },

  strip: {
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
  },
  stripRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stripText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },

  stampRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  stampText: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },

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
  trashBtn: { padding: 6 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
