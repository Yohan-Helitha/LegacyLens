import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { SavedWorkCard } from '../../../components/module-specific/marketplace/SavedWorkCard';
import { WorkContent } from '../../../components/module-specific/marketplace/WorkContent';
import { appAlert } from '../../../components/common/AppDialog';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import { workProgressApi } from '../../../services/api/workProgressApi';
import type { JobResponse } from '../../../types/creatorDashboard';
import { ApiError } from '../../../services/api/client';
import { WorkProgressResponse, stepFlags } from '../../../types/workProgress';
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

function formatScheduleDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLkr(amount: number): string {
  return `LKR ${Math.round(amount).toLocaleString('en-US')}`;
}

export type WorkTab = 'active' | 'saved' | 'submitted' | 'completed';

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

const CalendarIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
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
const Stepper: React.FC<{ done: boolean[] }> = ({ done: doneSteps }) => (
  <View style={s.stepperRow}>
    {STEP_LABELS.map((label, i) => {
      const done = doneSteps[i];
      const isCurrent = !done && doneSteps.slice(0, i).every(Boolean);
      const connectorDone = done && doneSteps[i + 1];
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
  doneSteps: boolean[];
  variant: 'continue' | 'submitted';
  /** The full progress record - the submitted card shows what was written from it. */
  progress?: WorkProgressResponse;
  onContinue: () => void;
}> = ({ job, heroImageUrl, materialsCount, progressPercentage, doneSteps, variant, progress, onContinue }) => {
  // A job already sent for review is no longer "due" - the chip would only mislead.
  const dueText = variant === 'submitted' ? null : formatDueText(job.scheduledAt);
  const overdue = dueText === 'Overdue';
  const scheduledOn = formatScheduleDate(job.scheduledAt);

  return (
    <View style={s.card}>
      {dueText && (
        <View style={s.chipsRow}>
          <View style={[s.dueChip, overdue && s.dueChipOverdue]}>
            <Text style={[s.dueChipText, overdue && s.dueChipTextOverdue]}>{dueText}</Text>
          </View>
        </View>
      )}

      <Text style={s.cardTitle} numberOfLines={2}>{job.title}</Text>
      <View style={s.contributorRow}>
        <PersonIcon />
        <Text style={s.contributorText}>{job.elderName}</Text>
      </View>

      {/* Where, when and how much - the same details the opportunity page showed. */}
      <View style={s.factsStrip}>
        <View style={s.factsRow}>
          {!!scheduledOn && (
            <View style={s.factItem}>
              <CalendarIcon />
              <Text style={s.factText}>{scheduledOn}</Text>
            </View>
          )}
          <View style={s.factItem}>
            <CardIcon />
            <Text style={s.factText}>{formatLkr(job.offeredAmount)}</Text>
          </View>
        </View>
        {!!job.timeWindowText && (
          <View style={s.factItem}>
            <ClockIcon />
            <Text style={s.factText}>{job.timeWindowText}</Text>
          </View>
        )}
        {!!job.location && (
          <View style={s.factItem}>
            <PinIcon color={D.secondary} />
            <Text style={s.factText} numberOfLines={1}>{job.location}</Text>
          </View>
        )}
      </View>

      <View style={s.progressCard}>
        <View style={s.progressHeaderRow}>
          <Text style={s.progressLabel}>Overall Progress</Text>
          <Text style={s.progressValue}>{progressPercentage}%</Text>
        </View>
        <ProgressBar percentage={progressPercentage} />
        <Stepper done={doneSteps} />
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
        <View style={{ marginTop: Spacing.md }}>
          <WorkContent progress={progress} />
        </View>
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
const CompletedCard: React.FC<{ job: JobResponse; heroImageUrl: string | null; onView: () => void }> = ({ job, heroImageUrl, onView }) => {
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
      </View>

      <View style={s.doneBody}>
        <Image
          source={resolveOpportunityImage(heroImageUrl) ?? GENERIC_HERO_IMAGE}
          style={s.doneThumb}
          resizeMode="cover"
          accessibilityLabel={job.title}
        />
        <View style={s.doneInfo}>
          <Text style={s.cardTitle} numberOfLines={3}>{job.title}</Text>
          <Text style={s.doneElder} numberOfLines={1}>{job.elderName}</Text>
          {!!job.location && (
            <View style={s.doneInline}>
              <PinIcon color={D.secondary} />
              <Text style={s.doneElderPlace} numberOfLines={1}>{job.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.factsStrip}>
        <View style={s.factsRow}>
          {!!doneOn && (
            <View style={s.factItem}>
              <CalendarIcon />
              <Text style={s.factText}>{doneOn}</Text>
            </View>
          )}
          <View style={s.factItem}>
            <CardIcon />
            <Text style={s.factText}>{formatLkr(job.offeredAmount)}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onView}
        style={({ pressed }) => [s.doneLink, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View publication of ${job.title}`}
      >
        <Text style={s.doneLinkText}>{'View Publication  →'}</Text>
      </Pressable>
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
  onViewPublication: (job: JobResponse) => void;
  /** Which tab to open on - Saved right after "Save As a Draft", Active from the menu. */
  initialTab?: WorkTab;
  /** Told when the creator switches tab, so coming back from Continue Work lands on the same one. */
  onTabChange?: (tab: WorkTab) => void;
}> = ({ onNavigate, onBack, onContinueWork, onViewPublication, initialTab = 'active', onTabChange }) => {
  const [workJobs, setWorkJobs] = useState<JobResponse[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobResponse[]>([]);
  const [progressByJobId, setProgressByJobId] = useState<Record<string, WorkProgressResponse>>({});
  const [completedPictures, setCompletedPictures] = useState<Record<string, string | null>>({});
  const [activeTab, setActiveTab] = useState<WorkTab>(initialTab);
  const selectTab = (tab: WorkTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadWork = useCallback((isCancelled: () => boolean = () => false) => {
    setLoading(true);
    setLoadError(null);

    return Promise.all([
      creatorDashboardApi.getJobs('UPCOMING'),
      creatorDashboardApi.getJobs('ACTIVE'),
      creatorDashboardApi.getJobs('COMPLETED'),
    ])
      .then(async ([upcoming, active, completed]) => {
        const jobsInProgress = [...upcoming, ...active];
        const progressList = await Promise.all(
          jobsInProgress.map((job) => workProgressApi.getProgress(job.id)),
        );
        // Completed cards show the opportunity's picture too; a missing one just falls back to the default photo.
        const completedProgress = await Promise.all(
          completed.map((job) => workProgressApi.getProgress(job.id).catch(() => null)),
        );
        if (isCancelled()) return;

        const progressMap: Record<string, WorkProgressResponse> = {};
        progressList.forEach((p) => {
          progressMap[p.jobId] = p;
        });

        setWorkJobs(jobsInProgress);
        setProgressByJobId(progressMap);
        setCompletedJobs(completed);
        const pictures: Record<string, string | null> = {};
        completedProgress.forEach((p, i) => {
          pictures[completed[i].id] = p?.heroImageUrl ?? null;
        });
        setCompletedPictures(pictures);
      })
      .catch((err) => {
        if (isCancelled()) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your work.');
      })
      .finally(() => {
        if (!isCancelled()) setLoading(false);
      });

  }, []);

  useEffect(() => {
    let cancelled = false;
    loadWork(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadWork]);

  const activeWithProgress = useMemo(
    () =>
      workJobs.map((job) => {
        const progress = progressByJobId[job.id];
        return {
          job,
          heroImageUrl: progress?.heroImageUrl ?? null,
          materialsCount: progress?.materials.length ?? 0,
          percentage: progress?.progressPercentage ?? 0,
          steps: progress ? stepFlags(progress) : [false, false, false, false],
          // A job only counts as "Submitted" once it's actually been sent for
          // review — not just because its checklist happens to read 100%,
          // since a creator can submit early or keep polishing after 100%.
          submitted: Boolean(progress?.submittedAt) && !progress?.draft,
          // Saved with "Save As a Draft" - lives on the Saved tab until it is submitted.
          draft: Boolean(progress?.draft),
        };
      }),
    [workJobs, progressByJobId],
  );

  const completedByMonth = useMemo(() => groupCompletedByMonth(completedJobs), [completedJobs]);

  // Active is everything not yet submitted - saving a draft does not take a job off it, so the creator
  // can always see how far along it is. Saved is the same jobs filtered to the ones saved as a draft.
  const stillInProgress = activeWithProgress.filter((x) => !x.submitted);
  const savedDrafts = activeWithProgress.filter((x) => x.draft);
  const submitted = activeWithProgress.filter((x) => x.submitted);

  // A step the creator has not finished yet is worth a warning before submitting, not a block.
  const unfinishedSteps = (progress: WorkProgressResponse | undefined): string[] => {
    if (!progress) return [];
    const missing: string[] = [];
    if (!progress.prepDone) missing.push('Prep');
    if (!progress.recordDone) missing.push('Record');
    if (!progress.editDone) missing.push('Edit content');
    return missing;
  };

  const submitDraft = (job: JobResponse) => {
    appAlert('Submit for review?', `"${job.title}" will be sent to ${job.elderName} and the admin to review.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            await workProgressApi.submitDraft(job.id);
            await loadWork();
            selectTab('submitted');
          } catch (err) {
            appAlert('Submit failed', err instanceof ApiError ? err.message : 'Could not submit this draft.');
          }
        },
      },
    ]);
  };

  const handleSubmitForReview = (job: JobResponse) => {
    const missing = unfinishedSteps(progressByJobId[job.id]);
    if (missing.length === 0) {
      submitDraft(job);
      return;
    }
    appAlert('Not everything is finished', `${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} not done yet. Submit anyway?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => submitDraft(job) },
    ]);
  };

  const handleDeleteDraft = (job: JobResponse) => {
    appAlert('Delete this draft?', `All progress on "${job.title}" will be discarded.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await workProgressApi.resetProgress(job.id);
            await loadWork();
          } catch (err) {
            appAlert('Delete failed', err instanceof ApiError ? err.message : 'Could not delete this draft.');
          }
        },
      },
    ]);
  };

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
          <TabPill label="Active" active={activeTab === 'active'} onPress={() => selectTab('active')} />
          <TabPill label={savedDrafts.length > 0 ? `Saved (${savedDrafts.length})` : 'Saved'} active={activeTab === 'saved'} onPress={() => selectTab('saved')} />
          <TabPill label="Submitted" active={activeTab === 'submitted'} onPress={() => selectTab('submitted')} />
          <TabPill label="Completed" active={activeTab === 'completed'} onPress={() => selectTab('completed')} />
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
                doneSteps={steps}
                variant="continue"
                onContinue={() => onContinueWork(job.id, job.title, job.elderName, job.location)}
              />
            ))
          )
        )}

        {activeTab === 'saved' && (
          savedDrafts.length === 0 ? (
            <View style={s.emptyState}><Text style={s.emptyStateText}>No saved drafts yet.</Text></View>
          ) : (
            savedDrafts.map(({ job }) => (
              <SavedWorkCard
                key={job.id}
                job={job}
                progress={progressByJobId[job.id]}
                onEdit={() => onContinueWork(job.id, job.title, job.elderName, job.location)}
                onSubmit={() => handleSubmitForReview(job)}
                onDelete={() => handleDeleteDraft(job)}
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
                doneSteps={steps}
                variant="submitted"
                progress={progressByJobId[job.id]}
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
                      {`${month.jobs.length} ${month.jobs.length === 1 ? 'job' : 'jobs'} · ${formatLkr(month.total)} earned for this month`}
                    </Text>
                  </View>
                  {month.jobs.map((job) => (
                    <CompletedCard key={job.id} job={job} heroImageUrl={completedPictures[job.id] ?? null} onView={() => onViewPublication(job)} />
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
  dueChipOverdue: { backgroundColor: '#FDECEA' },
  dueChipTextOverdue: { color: '#B3261E' },
  dueChipText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSecondaryContainer, letterSpacing: 0.3 },

  // ── Where / when / how much ──────────────────────────────────────────────
  factsStrip: {
    marginTop: Spacing.sm, backgroundColor: '#f0f5f5', borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
  },
  factsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  factItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },

  // ── Progress card ────────────────────────────────────────────────────────
  progressCard: {
    alignSelf: 'stretch', width: '100%',
    backgroundColor: '#ffffff', borderRadius: Radii.lg, padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    marginTop: Spacing.sm, gap: Spacing.sm,
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
    marginTop: Spacing.sm, borderRadius: Radii.lg, overflow: 'hidden',
    aspectRatio: 2.3,
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
  monthHeader: { paddingHorizontal: 4, marginTop: Spacing.sm, marginBottom: Spacing.sm, gap: 2 },
  monthLabel: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface },
  monthStats: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary },
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
  doneBody: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  doneThumb: { width: 84, height: 84, borderRadius: Radii.lg, backgroundColor: D.surfaceContainer },
  doneInfo: { flex: 1, gap: 4 },
  doneElder: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  doneInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneElderPlace: { flex: 1, fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  doneLink: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  doneLinkText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
