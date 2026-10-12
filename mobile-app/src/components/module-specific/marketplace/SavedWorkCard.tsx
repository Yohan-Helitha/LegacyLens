import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import type { JobResponse } from '../../../types/creatorDashboard';
import type { WorkProgressResponse } from '../../../types/workProgress';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';

// Only for jobs with no photo of their own and no linked opportunity either.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

const D = {
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',
  primary:                '#0F5C5C',
  secondary:              '#E8792E',
  onSurface:              '#202428',
  onSurfaceVariant:       '#4a5568',
} as const;

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

const TrashIcon: React.FC<IconProps> = ({ size = 20, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <Line x1="9" y1="4" x2="15" y2="4" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TextAnswer: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => {
  if (!value?.trim()) return null;
  return (
    <View style={s.answerBlock}>
      <Text style={s.answerLabel}>{label}</Text>
      <Text style={s.answerText} numberOfLines={6}>{value}</Text>
    </View>
  );
};

/** What the creator has written and collected so far, so a saved edit can be seen on the card. */
const YourContent: React.FC<{ progress: WorkProgressResponse | undefined }> = ({ progress }) => {
  const [open, setOpen] = useState(true);
  const keywords = progress?.seoKeywords ?? [];
  const materials = progress?.materials ?? [];
  const nothingYet = !progress?.introduction?.trim() && !progress?.story?.trim() && !progress?.seoSummary?.trim()
    && keywords.length === 0 && materials.length === 0;

  return (
    <View style={s.answers}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={s.answersHeader}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Hide your saved content' : 'Show your saved content'}
      >
        <Text style={s.answersTitle}>Your content</Text>
        <Text style={s.answersToggle}>{open ? 'Hide ▴' : 'Show ▾'}</Text>
      </Pressable>
      {open && (
        <View style={{ gap: Spacing.sm }}>
          {nothingYet && <Text style={s.answerEmpty}>Nothing written or collected yet.</Text>}
          <TextAnswer label="Introduction" value={progress?.introduction} />
          <TextAnswer label="Story / main content" value={progress?.story} />
          <TextAnswer label="Search summary" value={progress?.seoSummary} />
          {keywords.length > 0 && (
            <View style={s.answerBlock}>
              <Text style={s.answerLabel}>Keywords</Text>
              <View style={s.chipWrap}>
                {keywords.map((k) => (
                  <View key={k} style={s.chip}>
                    <Text style={s.chipText}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {materials.length > 0 && (
            <View style={s.answerBlock}>
              <Text style={s.answerLabel}>{`Materials (${materials.length})`}</Text>
              {materials.map((m) => (
                <Text key={m.id} style={s.answerText} numberOfLines={1}>{m.fileName}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * One saved draft of a piece of work: the opportunity, when and for how much, what has been written so
 * far, and the three things to do with it - edit it, submit it for review, or delete it.
 */
export const SavedWorkCard: React.FC<{
  job: JobResponse;
  progress: WorkProgressResponse | undefined;
  onEdit: () => void;
  onSubmit: () => void;
  onDelete: () => void;
}> = ({ job, progress, onEdit, onSubmit, onDelete }) => {
  const scheduledOn = formatDate(job.scheduledAt);

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.badgeRow}>
          <View style={s.savedBadge}>
            <Text style={s.savedBadgeText}>Saved</Text>
          </View>
          {!!progress && <Text style={s.percent}>{`${progress.progressPercentage}% complete`}</Text>}
        </View>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Delete the draft ${job.title}`}
          hitSlop={4}
        >
          <TrashIcon />
        </Pressable>
      </View>

      <View style={s.summaryRow}>
        <Image
          source={resolveOpportunityImage(progress?.heroImageUrl ?? null) ?? GENERIC_HERO_IMAGE}
          style={s.thumb}
          resizeMode="cover"
          accessibilityLabel={job.title}
        />
        <View style={s.summaryText}>
          <Text style={s.title} numberOfLines={3}>{job.title}</Text>
          <Text style={s.elder} numberOfLines={1}>{job.elderName}</Text>
          {!!job.location && (
            <View style={s.inline}>
              <PinIcon />
              <Text style={s.inlineText} numberOfLines={1}>{job.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.strip}>
        <View style={s.stripRow}>
          {!!scheduledOn && (
            <View style={s.inline}>
              <CalendarIcon />
              <Text style={s.stripText}>{scheduledOn}</Text>
            </View>
          )}
          <View style={s.inline}>
            <CardIcon />
            <Text style={s.stripText}>{`LKR ${Math.round(job.offeredAmount).toLocaleString('en-US')}`}</Text>
          </View>
        </View>
        {!!job.timeWindowText && (
          <View style={s.inline}>
            <ClockIcon />
            <Text style={s.stripText}>{job.timeWindowText}</Text>
          </View>
        )}
      </View>

      <YourContent progress={progress} />

      <View style={s.actionsRow}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${job.title}`}
        >
          <Text style={s.outlineBtnText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Submit ${job.title} for review`}
        >
          <Text style={s.fillBtnText}>Submit for Review</Text>
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant, gap: Spacing.sm,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  savedBadge: { borderRadius: Radii.full, backgroundColor: '#E3F1F0', paddingHorizontal: 12, paddingVertical: 4 },
  savedBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary, letterSpacing: 0.3 },
  percent: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },
  trashBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumb: {
    width: 84, height: 84, borderRadius: Radii.lg, backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  summaryText: { flex: 1, gap: 4 },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  elder: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineText: { flex: 1, fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  strip: {
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
  },
  stripRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stripText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },

  answers: { borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant, padding: 10, gap: Spacing.sm },
  answersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  answersTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },
  answersToggle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary },
  answerBlock: { gap: 4 },
  answerLabel: { fontFamily: Typography.fontBodySemi, fontSize: 11, color: D.onSurfaceVariant, letterSpacing: 0.3 },
  answerText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, lineHeight: 18, color: D.onSurface },
  answerEmpty: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: Radii.full, backgroundColor: D.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: 11.5, color: D.primary },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  outlineBtn: {
    flex: 1, minHeight: 48, borderRadius: Radii.full, borderWidth: 1.5, borderColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  outlineBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  fillBtn: {
    flex: 1.4, minHeight: 48, borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fillBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  pressed: { opacity: 0.75 },
});
