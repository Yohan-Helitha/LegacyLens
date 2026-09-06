import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import type { JobResponse } from '../../../types/creatorDashboard';
import { useMyWorkProgressStore, TOTAL_WORK_STEPS } from '../../../store/myWorkProgressStore';

/**
 * This is the same underlying data MyWorkList.tsx's "Submitted" and
 * "Completed" tabs already track (a job's local step-progress reaching
 * TOTAL_WORK_STEPS, plus the backend's own COMPLETED status) — those tabs
 * just showed an "Awaiting Review" pill / stubbed "View" button instead of
 * a dedicated detail list. This page is that missing detail view: every
 * submitted job across both tabs, as "Pending" (submitted, backend hasn't
 * marked it COMPLETED yet — a real admin/knowledge-holder review flow
 * doesn't exist) or "Published" (backend already reports COMPLETED).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

type SubmittedStatus = 'Pending' | 'Published';

interface SubmittedWorkItem {
  job: JobResponse;
  status: SubmittedStatus;
  submittedAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown only if /api/creator-dashboard/jobs fails, so the
// screen never renders blank. Matches the same demo job (fallback-1) used
// throughout ContinueMyWorkPage/SavedCompletedWorkPage/MyWorkList.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_PENDING_JOB: JobResponse = {
  id: 'fallback-1',
  title: 'Traditional Recipe Documentation',
  description: '',
  elderName: 'Mrs. Kamala Wijesinghe',
  location: 'Matara',
  offeredAmount: 3000,
  status: 'ACTIVE',
  scheduledAt: null,
  completedAt: null,
};

const FALLBACK_PUBLISHED_JOB: JobResponse = {
  id: 'fallback-2',
  title: 'Documentation Of Oral history of Sri Lanka',
  description: '',
  elderName: 'Mrs. Nimala Wijesinghe',
  location: 'Galle',
  offeredAmount: 3500,
  status: 'COMPLETED',
  scheduledAt: null,
  completedAt: '2026-08-15T12:30:00',
};

const FALLBACK_SUBMITTED_AT = '2026-09-01T10:30:00';

/** "1 September 2026, 10.30 A.M" — matches the mockup's date/time style. */
function formatSubmittedAt(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'P.M' : 'A.M';
  hours = hours % 12 || 12;
  return `${datePart}, ${hours}.${minutes} ${ampm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const CalendarIcon: React.FC<IconProps> = ({ size = 15, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
  </Svg>
);

const PersonIcon: React.FC<IconProps> = ({ size = 15, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const PinIcon: React.FC<IconProps> = ({ size = 15, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 21s-7-6.5-7-11.5a7 7 0 0 1 14 0c0 5-7 11.5-7 11.5z" />
    <Circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);

const DocumentIcon: React.FC<IconProps> = ({ size = 15, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </Svg>
);

const ArrowRightIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
      <Text style={s.backArrow}>{'←'}</Text>
    </Pressable>
    <Text style={s.appBarTitle}>Legacy Lens</Text>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// WorkDetailCard
// ─────────────────────────────────────────────────────────────────────────────
const WorkDetailCard: React.FC<{ item: SubmittedWorkItem; onViewDetails: () => void }> = ({ item, onViewDetails }) => (
  <View style={s.card}>
    <View style={s.statusPill}>
      <Text style={s.statusPillText}>{item.status}</Text>
    </View>

    <View style={s.detailRows}>
      <View style={s.detailRow}>
        <View style={s.detailIcon}><CalendarIcon /></View>
        <View style={s.detailTextCol}>
          <Text style={s.detailLabel}>Submitted at</Text>
          <Text style={s.detailValue}>{item.submittedAt ? formatSubmittedAt(item.submittedAt) : 'Not available'}</Text>
        </View>
      </View>

      <View style={s.detailRowInline}>
        <View style={s.detailIcon}><PersonIcon /></View>
        <Text style={s.detailValueBold}>{item.job.elderName}</Text>
      </View>

      <View style={s.detailRowInline}>
        <View style={s.detailIcon}><PinIcon /></View>
        <Text style={s.detailValueBold}>{item.job.location ?? 'Not specified'}</Text>
      </View>

      <View style={s.detailRow}>
        <View style={s.detailIcon}><DocumentIcon /></View>
        <View style={s.detailTextCol}>
          <Text style={s.detailLabel}>Worked Type</Text>
          <Text style={s.detailValueMedium}>{item.job.title}</Text>
        </View>
      </View>
    </View>

    <Pressable
      onPress={onViewDetails}
      style={({ pressed }) => [s.viewDetailsRow, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.job.title}`}
    >
      <Text style={s.viewDetailsText}>View Details</Text>
      <ArrowRightIcon />
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SubmittedWorkDetailPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
}> = ({ onNavigate, onBack }) => {
  const [activeJobs, setActiveJobs] = useState<JobResponse[]>([FALLBACK_PENDING_JOB]);
  const [completedJobs, setCompletedJobs] = useState<JobResponse[]>([FALLBACK_PUBLISHED_JOB]);

  const completedStepsByJobId = useMyWorkProgressStore((st) => st.completedStepsByJobId);
  const submittedAtByJobId = useMyWorkProgressStore((st) => st.submittedAtByJobId);

  useEffect(() => {
    creatorDashboardApi.getJobs('ACTIVE').then(setActiveJobs).catch(() => {});
    creatorDashboardApi.getJobs('COMPLETED').then(setCompletedJobs).catch(() => {});
  }, []);

  const pending: SubmittedWorkItem[] = activeJobs
    .filter((job) => (completedStepsByJobId[job.id] ?? (job.id === FALLBACK_PENDING_JOB.id ? TOTAL_WORK_STEPS : 0)) >= TOTAL_WORK_STEPS)
    .map((job) => ({
      job,
      status: 'Pending',
      submittedAt: submittedAtByJobId[job.id] ?? (job.id === FALLBACK_PENDING_JOB.id ? FALLBACK_SUBMITTED_AT : null),
    }));

  const published: SubmittedWorkItem[] = completedJobs.map((job) => ({
    job,
    status: 'Published',
    submittedAt: submittedAtByJobId[job.id] ?? job.completedAt,
  }));

  const items = [...pending, ...published];

  const handleViewDetails = (title: string) => {
    // No per-submission review/detail endpoint exists yet — same stopgap
    // used by MyWorkList's own "View" affordance.
    Alert.alert(title, 'Full review details aren’t available yet.');
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No submitted work yet.</Text>
          </View>
        ) : (
          items.map((item) => (
            <WorkDetailCard key={item.job.id} item={item} onViewDetails={() => handleViewDetails(item.job.title)} />
          ))
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default SubmittedWorkDetailPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ──────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  bellWrapper:  { alignItems: 'center' },
  bellTop:      { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:     { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:  { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  emptyState: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  statusPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff', letterSpacing: 0.3 },

  detailRows: { gap: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  detailRowInline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailIcon: { width: 16, alignItems: 'center', marginTop: 2 },
  detailTextCol: { flex: 1, gap: 1 },
  detailLabel: { fontFamily: Typography.fontBodySemi, fontSize: 11, color: D.onSurface },
  detailValue: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  detailValueMedium: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, lineHeight: 17 },
  detailValueBold: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },

  viewDetailsRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  viewDetailsText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondary },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
