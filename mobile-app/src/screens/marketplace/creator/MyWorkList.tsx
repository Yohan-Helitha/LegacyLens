import React, { useEffect, useMemo, useState } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',
  outline:                '#a0aab0',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

const STEP_LABELS = ['Prep', 'Record', 'Edit', 'Submit'];

type WorkTab = 'active' | 'submitted' | 'completed';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown only if /api/creator-dashboard/jobs fails, so the
// screen never renders blank.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_ACTIVE_JOBS: JobResponse[] = [
  {
    id: 'fallback-1',
    title: 'Traditional Recipe Documentation',
    description: '',
    elderName: 'Mrs. Kamala Wijesinghe',
    location: 'Matara',
    offeredAmount: 3000,
    status: 'ACTIVE',
    urgent: false,
    scheduledAt: null,
    completedAt: null,
  },
  {
    id: 'fallback-2',
    title: 'Fishing Terms Documentation',
    description: '',
    elderName: 'Mr. Sunil Perera',
    location: 'Negombo',
    offeredAmount: 2500,
    status: 'ACTIVE',
    urgent: false,
    scheduledAt: null,
    completedAt: null,
  },
];

/** Staggers the starting demo progress (2/4 then 1/4) so the list isn't all 0% on first load. */
function defaultStepsForIndex(index: number): number {
  return index % 2 === 0 ? 2 : 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PersonIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const CheckIcon: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
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
// TabPill
// ─────────────────────────────────────────────────────────────────────────────
const TabPill: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.tabPill, active ? s.tabPillActive : s.tabPillInactive, pressed && s.pressed]}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
  >
    <Text style={[s.tabPillText, active && s.tabPillTextActive]}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Stepper — 4-stage progress row (Prep / Record / Edit / Submit)
// ─────────────────────────────────────────────────────────────────────────────
const Stepper: React.FC<{ completedSteps: number }> = ({ completedSteps }) => (
  <View style={s.stepperRow}>
    {STEP_LABELS.map((label, i) => {
      const done = i < completedSteps;
      const connectorDone = i < completedSteps - 1;
      return (
        <React.Fragment key={label}>
          <View style={s.stepItem}>
            <View style={[s.stepCircle, done ? s.stepCircleDone : s.stepCircleTodo]}>
              {done && <CheckIcon />}
            </View>
            <Text style={s.stepLabel}>{label}</Text>
          </View>
          {i < STEP_LABELS.length - 1 && (
            <View style={[s.stepConnector, connectorDone && s.stepConnectorDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// WorkCard
// ─────────────────────────────────────────────────────────────────────────────
const WorkCard: React.FC<{
  job: JobResponse;
  completedSteps: number;
  variant: 'continue' | 'submitted' | 'completed';
  onContinue: () => void;
  onView: () => void;
}> = ({ job, completedSteps, variant, onContinue, onView }) => (
  <View style={s.card}>
    <Text style={s.cardTitle} numberOfLines={2}>{job.title}</Text>
    <View style={s.contributorRow}>
      <PersonIcon />
      <Text style={s.contributorText}>{job.elderName}</Text>
    </View>

    <View style={s.progressHeaderRow}>
      <Text style={s.progressLabel}>Overall Progress</Text>
      <Text style={s.progressValue}>{Math.round((completedSteps / TOTAL_WORK_STEPS) * 100)}%</Text>
    </View>

    <Stepper completedSteps={completedSteps} />

    {variant === 'continue' && (
      <Pressable onPress={onContinue} style={({ pressed }) => [s.continueBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel={`Continue work on ${job.title}`}>
        <Text style={s.continueBtnText}>Continue Work</Text>
      </Pressable>
    )}
    {variant === 'submitted' && (
      <View style={s.awaitingPill}>
        <Text style={s.awaitingPillText}>Awaiting Review</Text>
      </View>
    )}
    {variant === 'completed' && (
      <Pressable onPress={onView} style={({ pressed }) => [s.viewBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel={`View ${job.title}`}>
        <Text style={s.viewBtnText}>View</Text>
      </Pressable>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const MyWorkList: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onContinueWork: (jobId: string, currentSteps: number) => void;
  onViewSubmittedWork: () => void;
}> = ({ onNavigate, onBack, onContinueWork, onViewSubmittedWork }) => {
  const [activeJobs, setActiveJobs] = useState<JobResponse[]>(FALLBACK_ACTIVE_JOBS);
  const [completedJobs, setCompletedJobs] = useState<JobResponse[]>([]);
  const [activeTab, setActiveTab] = useState<WorkTab>('active');

  const completedStepsByJobId = useMyWorkProgressStore((st) => st.completedStepsByJobId);

  useEffect(() => {
    creatorDashboardApi.getJobs('ACTIVE').then(setActiveJobs).catch(() => {});
    creatorDashboardApi.getJobs('COMPLETED').then(setCompletedJobs).catch(() => {});
  }, []);

  const activeWithSteps = useMemo(
    () =>
      activeJobs.map((job, i) => ({
        job,
        steps: completedStepsByJobId[job.id] ?? defaultStepsForIndex(i),
      })),
    [activeJobs, completedStepsByJobId],
  );

  const stillInProgress = activeWithSteps.filter((x) => x.steps < TOTAL_WORK_STEPS);
  const submitted = activeWithSteps.filter((x) => x.steps >= TOTAL_WORK_STEPS);

  const handleView = (title: string) => {
    // No per-job detail screen exists yet — same stopgap as the Dashboard's
    // own "View Details" affordance and the Schedule page's "View".
    Alert.alert(title, 'Full work details aren’t available yet.');
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <View style={s.headerSection}>
        <Text style={s.pageHeading}>My work</Text>
        <View style={s.tabsRow}>
          <TabPill label="Active" active={activeTab === 'active'} onPress={() => setActiveTab('active')} />
          <TabPill label="Submitted" active={activeTab === 'submitted'} onPress={() => setActiveTab('submitted')} />
          <TabPill label="Completed" active={activeTab === 'completed'} onPress={() => setActiveTab('completed')} />
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' && (
          stillInProgress.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>No work in progress right now.</Text></View>
          ) : (
            stillInProgress.map(({ job, steps }) => (
              <WorkCard
                key={job.id}
                job={job}
                completedSteps={steps}
                variant="continue"
                onContinue={() => onContinueWork(job.id, steps)}
                onView={() => handleView(job.title)}
              />
            ))
          )
        )}

        {activeTab === 'submitted' && (
          submitted.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>Nothing submitted yet.</Text></View>
          ) : (
            submitted.map(({ job }) => (
              <WorkCard
                key={job.id}
                job={job}
                completedSteps={TOTAL_WORK_STEPS}
                variant="submitted"
                onContinue={() => {}}
                onView={onViewSubmittedWork}
              />
            ))
          )
        )}

        {activeTab === 'completed' && (
          completedJobs.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>No completed work yet.</Text></View>
          ) : (
            completedJobs.map((job) => (
              <WorkCard
                key={job.id}
                job={job}
                completedSteps={TOTAL_WORK_STEPS}
                variant="completed"
                onContinue={() => {}}
                onView={onViewSubmittedWork}
              />
            ))
          )
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default MyWorkList;

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
    backgroundColor: D.surface,
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

  // ── Header / Tabs ────────────────────────────────────────────────────────
  headerSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.sm },
  pageHeading: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  tabsRow: { flexDirection: 'row', gap: Spacing.sm },
  tabPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radii.md },
  tabPillActive: { backgroundColor: D.primary },
  tabPillInactive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: D.outline },
  tabPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  tabPillTextActive: { color: '#ffffff' },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contributorText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  progressLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  progressValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },

  // ── Stepper ──────────────────────────────────────────────────────────────
  stepperRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
    marginTop: Spacing.md, marginBottom: Spacing.lg, paddingHorizontal: Spacing.xs,
  },
  stepItem: { alignItems: 'center', gap: 4, width: 44 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { backgroundColor: D.secondary },
  stepCircleTodo: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: D.secondary },
  stepLabel: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: D.onSurfaceVariant },
  stepConnector: { flex: 1, height: 1.5, backgroundColor: D.outline, marginTop: 10 },
  stepConnectorDone: { backgroundColor: D.secondary, height: 2 },

  // ── Buttons ──────────────────────────────────────────────────────────────
  continueBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  continueBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },
  viewBtn: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.full, borderWidth: 1.5, borderColor: D.secondary,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  viewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  awaitingPill: {
    backgroundColor: '#f0f5f5', borderRadius: Radii.full, borderWidth: 1, borderColor: D.surfaceVariant,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  awaitingPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, letterSpacing: 0.3 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
