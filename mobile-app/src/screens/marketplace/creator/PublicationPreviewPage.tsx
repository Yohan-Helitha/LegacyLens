import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import type { JobResponse } from '../../../types/creatorDashboard';

const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:   '#0F5C5C',
  secondary: '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

function formatPublishedOn(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Where the structured publication content goes - laid out the same way the admin's Publish Content
 * page arranges it. That structure is built by another part of the team, so this is only the empty
 * slot: when it is ready, render it here from `job` and nothing around it needs to change.
 */
const PublicationContent: React.FC<{ job: JobResponse }> = () => (
  <View style={s.slot}>
    <Text style={s.slotTitle}>Publication content</Text>
    <Text style={s.slotText}>The published content will be shown here.</Text>
  </View>
);

/**
 * A read-only look at one published job from the creator's side, so a creator can review what was
 * published from their work at any time. Opened from "View Publication" on a completed job in My Work.
 */
export const PublicationPreviewPage: React.FC<{
  job: JobResponse;
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
}> = ({ job, onNavigate, onBack }) => {
  const publishedOn = formatPublishedOn(job.completedAt);

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.previewPill}>
            <Text style={s.previewPillText}>Preview</Text>
          </View>
          <Text style={s.title}>{job.title}</Text>
          <Text style={s.meta}>{job.elderName}</Text>
          {!!publishedOn && <Text style={s.meta}>{`Published ${publishedOn}`}</Text>}
        </View>

        <PublicationContent job={job} />

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default PublicationPreviewPage;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },

  header: { gap: 6, paddingHorizontal: 2 },
  previewPill: {
    alignSelf: 'flex-start', borderRadius: Radii.full, backgroundColor: '#E3F1F0',
    paddingHorizontal: 12, paddingVertical: 4,
  },
  previewPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary, letterSpacing: 0.3 },
  title: { fontFamily: Typography.fontDisplay, fontSize: 22, lineHeight: 28, color: D.primary },
  meta: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  slot: {
    minHeight: 220, borderRadius: Radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, gap: 6,
  },
  slotTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  slotText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center' },
});
