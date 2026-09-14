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
import { WorkProgressResponse } from '../../../types/workProgress';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';

// Only for jobs with no photo of their own and no linked opportunity either —
// same fallback/convention as MyWorkList/ContinueMyWorkPage.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:   '#0F5C5C',
  secondary: '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',

  danger:          '#C0392B',
  dangerContainer: 'rgba(192, 57, 43, 0.10)',
} as const;

/** "20 Sep 2026 · 10:00 AM - 2:00 PM" — same pieces CreatorDashboard/MyWorkList already show separately, combined here. */
function formatDateTime(iso: string | null, timeWindowText: string | null): string | null {
  if (!iso && !timeWindowText) return null;
  const datePart = iso
    ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  if (datePart && timeWindowText) return `${datePart}  ·  ${timeWindowText}`;
  return datePart ?? timeWindowText;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const PersonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const PinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 13, color = D.onSurfaceVariant }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" />
    <Circle cx="12" cy="10" r="2.5" />
  </Svg>
);

const ClockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 13, color = D.onSurfaceVariant }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3 3" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// RejectedCard
// ─────────────────────────────────────────────────────────────────────────────
const RejectedCard: React.FC<{
  job: JobResponse;
  heroImageUrl: string | null;
  rejectionReason: string | null;
  onEdit: () => void;
}> = ({ job, heroImageUrl, rejectionReason, onEdit }) => {
  const dateTimeText = formatDateTime(job.scheduledAt, job.timeWindowText);

  return (
    <View style={s.card}>
      <View style={s.cardPhotoWrapper}>
        <Image
          source={resolveOpportunityImage(heroImageUrl) ?? GENERIC_HERO_IMAGE}
          style={s.cardPhoto}
          resizeMode="cover"
          accessibilityLabel={job.title}
        />
      </View>

      <Text style={s.cardTitle} numberOfLines={2}>{job.title}</Text>

      <View style={s.metaRow}>
        <PersonIcon />
        <Text style={s.metaText}>{job.elderName}</Text>
      </View>
      {job.location && (
        <View style={s.metaRow}>
          <PinIcon />
          <Text style={s.metaText}>{job.location}</Text>
        </View>
      )}
      {dateTimeText && (
        <View style={s.metaRow}>
          <ClockIcon />
          <Text style={s.metaText}>{dateTimeText}</Text>
        </View>
      )}

      <View style={s.reasonBox}>
        <Text style={s.reasonTitle}>What needs to be fixed</Text>
        <Text style={s.reasonText}>{rejectionReason ?? 'An admin sent this back — please review and resubmit.'}</Text>
      </View>

      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [s.editBtn, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View and edit ${job.title}`}
      >
        <Text style={s.editBtnText}>{'View & Edit  →'}</Text>
      </Pressable>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const RejectedWorkPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onEditWork: (jobId: string, title: string, elderName: string, location: string | null) => void;
}> = ({ onNavigate, onBack, onEditWork }) => {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [progressByJobId, setProgressByJobId] = useState<Record<string, WorkProgressResponse>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([creatorDashboardApi.getJobs('UPCOMING'), creatorDashboardApi.getJobs('ACTIVE')])
      .then(async ([upcoming, active]) => {
        const candidates = [...upcoming, ...active];
        const progressList = await Promise.all(candidates.map((job) => workProgressApi.getProgress(job.id)));
        if (cancelled) return;

        const progressMap: Record<string, WorkProgressResponse> = {};
        progressList.forEach((p) => {
          progressMap[p.jobId] = p;
        });

        setJobs(candidates);
        setProgressByJobId(progressMap);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load your rejected submissions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rejectedJobs = useMemo(
    () => jobs.filter((job) => progressByJobId[job.id]?.rejected),
    [jobs, progressByJobId],
  );

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
        <Text style={s.pageHeading}>Rejected Submissions</Text>
        <Text style={s.pageSubheading}>Fix what the admin flagged, then resubmit for review.</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {rejectedJobs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Nothing sent back right now — great work!</Text>
          </View>
        ) : (
          rejectedJobs.map((job) => {
            const progress = progressByJobId[job.id];
            return (
              <RejectedCard
                key={job.id}
                job={job}
                heroImageUrl={progress?.heroImageUrl ?? null}
                rejectionReason={progress?.rejectionReason ?? null}
                onEdit={() => onEditWork(job.id, job.title, job.elderName, job.location)}
              />
            );
          })
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default RejectedWorkPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  headerSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs, gap: 4 },
  pageHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: Typography.sizeXL * 1.2,
    color: D.primary,
    letterSpacing: -0.3,
  },
  pageSubheading: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

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
  cardPhotoWrapper: {
    alignSelf: 'stretch', width: '100%',
    borderRadius: Radii.lg, overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  cardPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface, marginTop: Spacing.sm },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  reasonBox: {
    backgroundColor: D.dangerContainer, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: D.danger,
    padding: Spacing.sm, marginTop: Spacing.md, gap: 2,
  },
  reasonTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.danger },
  reasonText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurface },

  editBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full, marginTop: Spacing.md,
    paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  editBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },

  pressed: { opacity: 0.75 },
});
