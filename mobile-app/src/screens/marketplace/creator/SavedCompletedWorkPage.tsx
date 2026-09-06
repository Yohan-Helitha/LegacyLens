import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import type { JobResponse } from '../../../types/creatorDashboard';
import { useMyWorkProgressStore } from '../../../store/myWorkProgressStore';

// Same bundled photo used as every job's workspace hero on ContinueMyWorkPage
// — there's no per-job image field on the backend Job entity yet.
const HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

/** Shown for an elder with no uploaded profile photo. */
const PLACEHOLDER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdukQOb20lmYsNjgSC79bwk6nR11u86Bj87jNIlc_ZQzQ97BxLNMhydins5gSF08W2CSQyNGsh4guyGBVX0htKvkNTzRAY76Yfv8jK-W-9Z-cW30fTc-tVqTE_3MXVnOr3daWdokTEReYQUt-ciXqQB8LF7qkH10d4SgSRvnxi4hdlzLG5RUNcZvLxKkHwfHK5wXsfSfaNkQJdZelcgow41KGgsq77Fkd9zgLSrunJwEJsg3U5ZQcTdg';

// Demo seed matching the fallback job id myWorkProgressStore pre-seeds with
// materials/notes/draft status — shown only if that id isn't a real backend job.
const DEMO_JOB: JobResponse = {
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
};

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

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const ChevronIcon: React.FC<{ direction: 'left' | 'right'; size?: number; color?: string }> = ({
  direction,
  size = 22,
  color = D.secondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </Svg>
);

const TrashIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7h16M9 4h6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SavedCompletedWorkPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onEditDraft: (jobId: string, currentSteps: number) => void;
}> = ({ onNavigate, onBack, onEditDraft }) => {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [index, setIndex] = useState(0);

  const savedDraftJobIds = useMyWorkProgressStore((st) => st.savedDraftJobIds);
  const completedStepsByJobId = useMyWorkProgressStore((st) => st.completedStepsByJobId);
  const submitDraftForReview = useMyWorkProgressStore((st) => st.submitDraftForReview);
  const deleteDraft = useMyWorkProgressStore((st) => st.deleteDraft);

  useEffect(() => {
    creatorDashboardApi.getJobs('ACTIVE').then(setJobs).catch(() => {});
  }, []);

  const drafts = useMemo(() => {
    return savedDraftJobIds
      .map((id) => jobs.find((j) => j.id === id) ?? (id === DEMO_JOB.id ? DEMO_JOB : null))
      .filter((j): j is JobResponse => j != null);
  }, [savedDraftJobIds, jobs]);

  useEffect(() => {
    if (index > 0 && index >= drafts.length) setIndex(Math.max(0, drafts.length - 1));
  }, [drafts.length, index]);

  const current = drafts[index];
  const steps = current ? (completedStepsByJobId[current.id] ?? 0) : 0;

  const handleSubmitForReview = () => {
    if (!current) return;
    Alert.alert('Submit for review?', `"${current.title}" will be sent to ${current.elderName} to review.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => submitDraftForReview(current.id) },
    ]);
  };

  const handleDelete = () => {
    if (!current) return;
    Alert.alert('Delete this draft?', `All progress on "${current.title}" will be discarded.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDraft(current.id) },
    ]);
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
        <View style={s.carouselNavRow}>
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            style={({ pressed }) => [s.arrowBtn, pressed && s.pressed, index === 0 && s.arrowBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Previous draft"
          >
            <ChevronIcon direction="left" />
          </Pressable>
          <Pressable
            onPress={() => setIndex((i) => Math.min(drafts.length - 1, i + 1))}
            disabled={index >= drafts.length - 1}
            style={({ pressed }) => [s.arrowBtn, pressed && s.pressed, index >= drafts.length - 1 && s.arrowBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Next draft"
          >
            <ChevronIcon direction="right" />
          </Pressable>
        </View>

        <Text style={s.pageHeading}>Saved Drafts...</Text>

        {!current ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No saved drafts yet.</Text>
          </View>
        ) : (
          <View style={s.card}>
            <View style={s.heroWrapper}>
              <Image source={HERO_IMAGE} style={s.heroImage} resizeMode="cover" accessibilityLabel={current.title} />
            </View>

            <Text style={s.cardTitle} numberOfLines={2}>{current.title}</Text>

            <View style={s.elderRow}>
              <Image source={{ uri: PLACEHOLDER_AVATAR }} style={s.elderAvatar} accessibilityLabel={`${current.elderName} portrait`} />
              <Text style={s.elderName}>{current.elderName}</Text>
            </View>

            <View style={s.actionsRow}>
              <Pressable
                onPress={() => onEditDraft(current.id, steps)}
                style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`View and edit ${current.title}`}
              >
                <Text style={s.outlineBtnText}>View & Edit</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitForReview}
                style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Submit ${current.title} for review`}
              >
                <Text style={s.fillBtnText}>Submit for Review</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Delete draft ${current.title}`}
              >
                <TrashIcon />
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default SavedCompletedWorkPage;

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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Carousel nav ─────────────────────────────────────────────────────────
  carouselNavRow: { flexDirection: 'row', justifyContent: 'space-between' },
  arrowBtn: { width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  arrowBtnDisabled: { opacity: 0.3 },

  pageHeading: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },

  emptyState: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroWrapper: { width: '100%', aspectRatio: 16 / 10, borderRadius: Radii.lg, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },
  elderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  elderAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: D.surfaceVariant },
  elderName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: 4 },
  outlineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: D.secondary, alignItems: 'center', justifyContent: 'center', minHeight: 42,
  },
  outlineBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondary },
  fillBtn: {
    flex: 1.3, paddingVertical: 10, borderRadius: Radii.full,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', minHeight: 42,
  },
  fillBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff' },
  trashBtn: { padding: 4 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
