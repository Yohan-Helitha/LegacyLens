import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import type { WorkMaterialResponse, WorkProgressResponse } from '../../../types/workProgress';
import { MaterialViewer } from './MaterialViewer';

const D = {
  surfaceContainerLow: '#f0f5f5',
  surfaceVariant:      '#c8dcdc',
  primary:             '#0F5C5C',
  secondary:           '#E8792E',
  onSurface:           '#202428',
  onSurfaceVariant:    '#4a5568',
} as const;

/** One part of the content: a thin, bold heading set apart by a rule, then the text below it in a large size. */
const Part: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
  <View style={s.part}>
    <Text style={s.heading}>{heading}</Text>
    <View style={s.rule} />
    {children}
  </View>
);

const Body: React.FC<{ value: string | null | undefined; heading: string }> = ({ value, heading }) => {
  if (!value?.trim()) return null;
  return (
    <Part heading={heading}>
      <Text style={s.body}>{value}</Text>
    </Part>
  );
};

/**
 * "My content": what the creator wrote and collected - introduction, story, search summary, keywords
 * and materials - with a Hide / Show button. The text is deliberately large and well spaced, because
 * the knowledge holders and admins who read it are often older and need to read it comfortably.
 */
export const WorkContent: React.FC<{
  progress: WorkProgressResponse | undefined;
  defaultOpen?: boolean;
}> = ({ progress, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [viewing, setViewing] = useState<WorkMaterialResponse | null>(null);
  const keywords = progress?.seoKeywords ?? [];
  const materials = progress?.materials ?? [];
  const nothingYet = !progress?.introduction?.trim() && !progress?.story?.trim() && !progress?.seoSummary?.trim()
    && keywords.length === 0 && materials.length === 0;

  return (
    <View style={s.box}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={s.header}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Hide my content' : 'Show my content'}
      >
        <Text style={s.title}>My content</Text>
        <Text style={s.toggle}>{open ? 'Hide ▴' : 'Show ▾'}</Text>
      </Pressable>

      {open && (
        <View style={s.parts}>
          {nothingYet && <Text style={s.empty}>Nothing written or collected yet.</Text>}
          <Body heading="Introduction" value={progress?.introduction} />
          <Body heading="Story / Main content" value={progress?.story} />
          <Body heading="Search summary" value={progress?.seoSummary} />
          {keywords.length > 0 && (
            <Part heading="Keywords">
              <View style={s.chipWrap}>
                {keywords.map((k) => (
                  <View key={k} style={s.chip}>
                    <Text style={s.chipText}>{k}</Text>
                  </View>
                ))}
              </View>
            </Part>
          )}
          {materials.length > 0 && (
            <Part heading={`Materials (${materials.length})`}>
              {materials.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setViewing(m)}
                  style={({ pressed }) => [s.materialRow, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${m.fileName}`}
                >
                  <Text style={s.materialName} numberOfLines={2}>{m.fileName}</Text>
                  <Text style={s.materialOpen}>Open ›</Text>
                </Pressable>
              ))}
            </Part>
          )}
        </View>
      )}
      <MaterialViewer material={viewing} onClose={() => setViewing(null)} />
    </View>
  );
};

const s = StyleSheet.create({
  box: {
    borderRadius: Radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  toggle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.secondary },
  parts: { gap: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  part: { gap: 8 },
  heading: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, letterSpacing: 0.4, color: D.primary },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: D.surfaceVariant },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 26, color: D.onSurface },
  materialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, minHeight: 48,
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg, paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  materialName: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurface },
  materialOpen: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  empty: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radii.full, backgroundColor: D.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.primary },
});
