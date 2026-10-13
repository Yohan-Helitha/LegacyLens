import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import type { JobResponse } from '../../../types/creatorDashboard';
import { PublicationBlogPreview } from './PublicationBlogPreview';
import { PublicationVideoPreview } from './PublicationVideoPreview';

import { workProgressApi } from '../../../services/api/workProgressApi';
import type { WorkProgressResponse } from '../../../types/workProgress';

const VIDEO = /\.(mp4|mov|m4v|webm|3gp|mkv)$/i;

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
 * A read-only look at one published job from the creator's side, so a creator can review what was
 * published from their work at any time. Opened from "View Publication" on a completed job in My Work.
 */
export const PublicationPreviewPage: React.FC<{
  job: JobResponse;
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
}> = ({ job, onNavigate, onBack }) => {
  const publishedOn = formatPublishedOn(job.completedAt);
  const [progress, setProgress] = useState<WorkProgressResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    workProgressApi.getProgress(job.id).then(p => alive && setProgress(p)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [job.id]);

  // The format follows what the creator uploaded: a video file means the video layout, otherwise the blog layout.
  const hasVideo = !!progress?.materials.some(m => VIDEO.test(m.fileName) || VIDEO.test(m.fileUrl));
  // Starts on the detected layout; the creator can flip it (e.g. to see a dance or cooking job as a blog).
  const [chosen, setChosen] = useState<'blog' | 'video' | null>(null);
  const isVideo = (chosen ?? (hasVideo ? 'video' : 'blog')) === 'video';

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.previewPill}>
            <Text style={s.previewPillText}>Preview</Text>
          </View>
        </View>

        {failed ? (
          <Text style={s.note}>Could not load this publication. Please try again.</Text>
        ) : !progress ? (
          <ActivityIndicator color={D.primary} style={{ marginTop: Spacing.lg }} />
        ) : (
          <>
            <View style={s.switchRow}>
              {(['blog', 'video'] as const).map(f => (
                <TouchableOpacity key={f} style={[s.switchBtn, (f === 'video') === isVideo && s.switchBtnActive]} onPress={() => setChosen(f)} activeOpacity={0.8}>
                  <Text style={[s.switchText, (f === 'video') === isVideo && s.switchTextActive]}>{f === 'blog' ? 'Blog' : 'Video'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          <View style={s.frame}>
            {isVideo
              ? <PublicationVideoPreview job={job} progress={progress} publishedOn={publishedOn} />
              : <PublicationBlogPreview job={job} progress={progress} publishedOn={publishedOn} />}
          </View>
          </>
        )}

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

  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center', marginTop: Spacing.lg },

  switchRow: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#dfe5e4', borderRadius: Radii.full, padding: 3 },
  switchBtn: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: Radii.full },
  switchBtnActive: { backgroundColor: D.surfaceContainerLowest },
  switchText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  switchTextActive: { color: D.primary, fontFamily: Typography.fontBodySemi },

  frame: { borderRadius: Radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: D.surfaceVariant },
});
