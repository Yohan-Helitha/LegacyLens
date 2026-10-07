import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import { workProgressApi } from '../../../services/api/workProgressApi';
import type { JobResponse } from '../../../types/creatorDashboard';
import { ApiError } from '../../../services/api/client';
import { WorkProgressResponse, stepsForStage } from '../../../types/workProgress';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { groupCompletedByMonth } from '../../../utils/completedWork';

// Only for jobs with no photo of their own and no linked opportunity either
// (directly-seeded rows) — see resolveOpportunityImage/Job.heroImageUrl.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer:       '#e4efef',
  surfaceVariant:         '#c8dcdc',
  outline:                '#a0aab0',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

const STEP_LABELS = ['Prep', 'Record', 'Edit', 'Submit'];

/** Same "Due in N days" phrasing as CreatorDashboard's job cards. */
function formatDueText(iso: string | null): string | null {
  if (!iso) return null;
  const diffDays = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays === 0) return 'Due today';
  return 'Overdue';
}

function formatDoneDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLkr(amount: number): string {
  return `LKR ${Math.round(amount).toLocaleString('en-US')}`;
}

type WorkTab = 'active' | 'submitted' | 'completed';

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

const PinIcon: React.FC<IconProps> = ({ size = 14, color = D.onSurfaceVariant }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CheckIcon: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────

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
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
  <View style={s.progressBarTrack}>
    <View style={[s.progressBarFill, { width: `${Math.max(0, Math.min(100, percentage))}%` }]} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Stepper — 4-stage progress row (Prep / Record / Edit / Submit). The step at
// `completedSteps` (the next one up) gets a bold ring to mark it as current,
// distinct from the plain grey outline on steps that haven't started yet.
// ─────────────────────────────────────────────────────────────────────────────
const Stepper: React.FC<{ completedSteps: number }> = ({ completedSteps }) => (
  <View style={s.stepperRow}>
    {STEP_LABELS.map((label, i) => {
      const done = i < completedSteps;
      const isCurrent = i === completedSteps;
      const connectorDone = i < completedSteps - 1;
      return (
        <React.Fragment key={label}>
          <View style={s.stepItem}>
            <View
              style={[
                s.stepCircle,
                done ? s.stepCircleDone : isCurrent ? s.stepCircleCurrent : s.stepCircleTodo,
              ]}
            >
              {done && <CheckIcon />}
            </View>
            <Text style={[s.stepLabel, (done || isCurrent) && s.stepLabelActive]}>{label}</Text>
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
  heroImageUrl: string | null;
  materialsCount: number;
  progressPercentage: number;
  completedSteps: number;
  variant: 'continue' | 'submitted';
  onContinue: () => void;
}> = ({ job, heroImageUrl, materialsCount, progressPercentage, completedSteps, variant, onContinue }) => {
  const dueText = formatDueText(job.scheduledAt);

  return (
    <View style={s.card}>
      {dueText && (
        <View style={s.chipsRow}>
          <View style={s.dueChip}>
            <Text style={s.dueChipText}>{dueText}</Text>
          </View>
        </View>
      )}

      <Text style={s.cardTitle} numberOfLines={2}>{job.title}</Text>
      <View style={s.contributorRow}>
        <PersonIcon />
        <Text style={s.contributorText}>{job.elderName}</Text>
      </View>

      <View style={s.progressCard}>
        <View style={s.progressHeaderRow}>
          <Text style={s.progressLabel}>Overall Progress</Text>
          <Text style={s.progressValue}>{progressPercentage}%</Text>
        </View>
        <ProgressBar percentage={progressPercentage} />
        <Stepper completedSteps={completedSteps} />
      </View>

      <View style={s.cardPhotoWrapper}>
        <Image
          source={resolveOpportunityImage(heroImageUrl) ?? GENERIC_HERO_IMAGE}
          style={s.cardPhoto}
          resizeMode="cover"
          accessibilityLabel={job.title}
        />
        {materialsCount > 0 && (
          <View style={s.materialsBadge}>
            <Text style={s.materialsBadgeText}>{materialsCount} file{materialsCount === 1 ? '' : 's'}</Text>
          </View>
        )}
      </View>

      {variant === 'continue' && (
        <Pressable onPress={onContinue} style={({ pressed }) => [s.continueBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel={`Continue work on ${job.title}`}>
          <Text style={s.continueBtnText}>{'Continue Work  →'}</Text>
        </Pressable>
      )}
      {variant === 'submitted' && (
        <View style={s.awaitingPill}>
          <Text style={s.awaitingPillText}>Awaiting Review</Text>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CompletedCard - a finished job: what it was, for whom, when, and what it earned.
// (No progress bar or stepper - those only mean something while work is under way.)
// ─────────────────────────────────────────────────────────────────────────────
const CompletedCard: React.FC<{ job: JobResponse; onView: () => void }> = ({ job, onView }) => {
  const doneOn = formatDoneDate(job.completedAt);

  return (
    <View style={s.doneCard}>
      <View style={s.doneTopRow}>
        <View style={s.donePill}>
          <View style={s.doneCheck}>
            <CheckIcon size={9} />
          </View>
          <Text style={s.donePillText}>Completed</Text>
        </View>
        {doneOn && <Text style={s.doneDate}>{doneOn}</Text>}
      </View>

      <View style={s.doneBody}>
        <Image source={GENERIC_HERO_IMAGE} style={s.doneThumb} resizeMode="cover" accessibilityLabel={job.title} />
        <View style={s.doneInfo}>
          <Text style={s.cardTitle} numberOfLines={2}>{job.title}</Text>
          <View style={s.contributorRow}>
            <PersonIcon />
            <Text style={s.contributorText} numberOfLines={1}>{job.elderName}</Text>
          </View>
          {!!job.location && (
            <View style={s.contributorRow}>
              <PinIcon />
              <Text style={s.contributorText} numberOfLines={1}>{job.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.doneFooter}>
        <View>
          <Text style={s.doneEarnedLabel}>Earned</Text>
          <Text style={s.doneEarnedValue}>{formatLkr(job.offeredAmount)}</Text>
        </View>
        <Pressable
          onPress={onView}
          style={({ pressed }) => [s.doneViewBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`View ${job.title}`}
        >
          <Text style={s.doneViewBtnText}>{'View  →'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const MyWorkList: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onContinueWork: (jobId: string, title: string, elderName: string, location: string | null) => void;
  onViewSubmittedWork: () => void;
}> = ({ onNavigate, onBack, onContinueWork, onViewSubmittedWork }) => {
  const [workJobs, setWorkJobs] = useState<JobResponse[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobResponse[]>([]);
  const [progressByJobId, setProgressByJobId] = useState<Record<string, WorkProgressResponse>>({});
  const [activeTab, setActiveTab] = useState<WorkTab>('active');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      creatorDashboardApi.getJobs('UPCOMING'),
      creatorDashboardApi.getJobs('ACTIVE'),
      creatorDashboardApi.getJobs('COMPLETED'),
    ])
      .then(async ([upcoming, active, completed]) => {
        const jobsInProgress = [...upcoming, ...active];
        const progressList = await Promise.all(
          jobsInProgress.map((job) => workProgressApi.getProgress(job.id)),
        );
        if (cancelled) return;

        const progressMap: Record<string, WorkProgressResponse> = {};
        progressList.forEach((p) => {
          progressMap[p.jobId] = p;
        });

        setWorkJobs(jobsInProgress);
        setProgressByJobId(progressMap);
        setCompletedJobs(completed);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your work.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeWithProgress = useMemo(
    () =>
      workJobs.map((job) => {
        const progress = progressByJobId[job.id];
        return {
          job,
          heroImageUrl: progress?.heroImageUrl ?? null,
          materialsCount: progress?.materials.length ?? 0,
          percentage: progress?.progressPercentage ?? 0,
          steps: stepsForStage(progress?.currentStage ?? 'PREP'),
          // A job only counts as "Submitted" once it's actually been sent for
          // review — not just because its checklist happens to read 100%,
          // since a creator can submit early or keep polishing after 100%.
          submitted: Boolean(progress?.submittedAt) && !progress?.draft,
        };
      }),
    [workJobs, progressByJobId],
  );

  const completedByMonth = useMemo(() => groupCompletedByMonth(completedJobs), [completedJobs]);

  const stillInProgress = activeWithProgress.filter((x) => !x.submitted);
  const submitted = activeWithProgress.filter((x) => x.submitted);

  // Held back until every fetch above settles — real data only, no
  // fallback/mock content, and a genuine failure shows as an error state.
  if (loadError) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>{loadError}</Text>
        </View>
        <BottomNavBar activeTab="home" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>Loading…</Text>
        </View>
        <BottomNavBar activeTab="home" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

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
            stillInProgress.map(({ job, heroImageUrl, materialsCount, percentage, steps }) => (
              <WorkCard
                key={job.id}
                job={job}
                heroImageUrl={heroImageUrl}
                materialsCount={materialsCount}
                progressPercentage={percentage}
                completedSteps={steps}
                variant="continue"
                onContinue={() => onContinueWork(job.id, job.title, job.elderName, job.location)}
              />
            ))
          )
        )}

        {activeTab === 'submitted' && (
          submitted.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>Nothing submitted yet.</Text></View>
          ) : (
            submitted.map(({ job, heroImageUrl, materialsCount, percentage, steps }) => (
              <WorkCard
                key={job.id}
                job={job}
                heroImageUrl={heroImageUrl}
                materialsCount={materialsCount}
                progressPercentage={percentage}
                completedSteps={steps}
                variant="submitted"
                onContinue={() => {}}
              />
            ))
          )
        )}

        {activeTab === 'completed' && (
          completedJobs.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>No completed work yet.</Text></View>
          ) : (
            <>
              <View style={s.doneSummary}>
                <Text style={s.doneSummaryText}>
                  {`${completedJobs.length} completed ${completedJobs.length === 1 ? 'job' : 'jobs'}`}
                </Text>
                <Text style={s.doneSummaryTotal}>
                  {`${formatLkr(completedJobs.reduce((sum, job) => sum + job.offeredAmount, 0))} earned`}
                </Text>
              </View>
              {completedByMonth.map((month) => (
                <View key={month.key} style={s.monthSection}>
                  <View style={s.monthHeader}>
                    <Text style={s.monthLabel}>{month.label}</Text>
                    <Text style={s.monthStats}>
                      {`${month.jobs.length} ${month.jobs.length === 1 ? 'job' : 'jobs'} · ${formatLkr(month.total)}`}
                    </Text>
                  </View>
                  <View style={s.kindRow}>
                    {month.kinds.map((kind) => (
                      <View key={kind.name} style={s.kindChip}>
                        <Text style={s.kindChipText}>{`${kind.name} × ${kind.count}`}</Text>
                      </View>
                    ))}
                  </View>
                  {month.jobs.map((job) => (
                    <CompletedCard key={job.id} job={job} onView={onViewSubmittedWork} />
                  ))}
                </View>
              ))}
            </>
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
  headerSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: Spacing.md },
  pageHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: Typography.sizeXL * 1.2,
    color: D.primary,
    letterSpacing: -0.3,
  },
  tabsRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  tabPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radii.full },
  tabPillActive: {
    backgroundColor: D.secondary,
    shadowColor: D.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  tabPillInactive: { backgroundColor: D.surfaceContainer, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant },
  tabPillText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.3 },
  tabPillTextActive: { color: D.onSecondary },

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

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  loadingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center' },

  // ── Card ─────────────────────────────────────────────────────────────────
  // A softer, wider shadow plus a faint white top edge gives the card a
  // subtle "glass" lift off the page background, instead of the flat
  // hairline-bordered look every other list card here uses.
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface, marginTop: 2 },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contributorText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  // ── Chips ────────────────────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', gap: Spacing.xs },
  dueChip: {
    backgroundColor: D.secondaryContainer, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  dueChipText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSecondaryContainer, letterSpacing: 0.3 },

  // ── Progress card ────────────────────────────────────────────────────────
  progressCard: {
    alignSelf: 'stretch', width: '100%',
    backgroundColor: D.surface, borderRadius: Radii.lg, padding: Spacing.sm,
    marginTop: Spacing.md, gap: Spacing.sm,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  progressValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },

  // ── Progress bar ─────────────────────────────────────────────────────────
  progressBarTrack: { height: 6, borderRadius: Radii.full, backgroundColor: D.surfaceVariant, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: Radii.full, backgroundColor: D.secondary },

  // ── Stepper ──────────────────────────────────────────────────────────────
  stepperRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
    marginTop: Spacing.xs, paddingHorizontal: Spacing.xs,
  },
  stepItem: { alignItems: 'center', gap: 4, width: 44 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { backgroundColor: D.secondary },
  stepCircleCurrent: { backgroundColor: '#ffffff', borderWidth: 2.5, borderColor: D.secondary },
  stepCircleTodo: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: D.outline },
  stepLabel: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: D.onSurfaceVariant },
  stepLabelActive: { color: D.onSurface },
  stepConnector: { flex: 1, height: 1.5, backgroundColor: D.outline, marginTop: 10 },
  stepConnectorDone: { backgroundColor: D.secondary, height: 2 },

  // ── Card photo ───────────────────────────────────────────────────────────
  cardPhotoWrapper: {
    alignSelf: 'stretch', width: '100%',
    marginTop: Spacing.md, borderRadius: Radii.lg, overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  cardPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  materialsBadge: {
    position: 'absolute', right: 8, bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  materialsBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: '#ffffff' },

  // ── Buttons ──────────────────────────────────────────────────────────────
  continueBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full, marginTop: Spacing.md,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  continueBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },
  awaitingPill: {
    backgroundColor: '#f0f5f5', borderRadius: Radii.full, borderWidth: 1, borderColor: D.surfaceVariant,
    marginTop: Spacing.md, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  awaitingPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, letterSpacing: 0.3 },

  // ── Completed tab ────────────────────────────────────────────────────────
  doneSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 4,
  },
  doneSummaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  doneSummaryTotal: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },
  monthSection: { gap: Spacing.sm },
  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 4, marginTop: Spacing.sm,
  },
  monthLabel: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface },
  monthStats: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 },
  kindChip: {
    backgroundColor: D.surfaceContainer, borderRadius: Radii.full,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  kindChipText: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },
  doneCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    gap: Spacing.md,
  },
  doneTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  donePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E3F1E6', borderRadius: Radii.full,
    paddingVertical: 4, paddingLeft: 6, paddingRight: 10,
  },
  doneCheck: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#2F6B3F',
    alignItems: 'center', justifyContent: 'center',
  },
  donePillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#2F6B3F' },
  doneDate: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  doneBody: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  doneThumb: { width: 76, height: 76, borderRadius: Radii.lg, backgroundColor: D.surfaceContainer },
  doneInfo: { flex: 1 },
  doneFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: D.surfaceVariant, paddingTop: Spacing.sm,
  },
  doneEarnedLabel: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant },
  doneEarnedValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  doneViewBtn: {
    borderRadius: Radii.full, borderWidth: 1.5, borderColor: D.secondary,
    paddingVertical: 8, paddingHorizontal: 18, minHeight: 40, alignItems: 'center', justifyContent: 'center',
  },
  doneViewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
