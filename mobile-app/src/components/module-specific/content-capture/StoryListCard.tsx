import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Radii, Spacing, Typography } from '../../../theme';
import { formatShortDate } from '../../../utils/dateFormat';
import type { StorySummary } from '../../../types/story';
import { StatusPill } from './StatusPill';
import { StoryMediaThumb } from './StoryMediaThumb';
import { ContentCaptureColors as D } from './tokens';

interface StoryListCardProps {
  story: StorySummary;
  onPress?: () => void;
}

/**
 * One row in the regular (non-hero) part of the My Stories list. The only
 * interaction is tapping the whole card open — no per-row actions, per the
 * screen's design (search + tap + "+ New Story" is the entire interaction
 * surface).
 */
export const StoryListCard: React.FC<StoryListCardProps> = ({ story, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.card, pressed && s.pressed]}
    accessibilityRole="button"
    accessibilityLabel={`Open story: ${story.title}`}
  >
    <StoryMediaThumb mediaType={story.mediaType} variant="list" />

    <View style={s.body}>
      <Text style={s.title} numberOfLines={1}>{story.title}</Text>
      <Text style={s.date}>{formatShortDate(story.createdAt)}</Text>
      <StatusPill status={story.status} />
    </View>
  </Pressable>
);

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  body: { flex: 1, gap: 4 },
  title: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  date: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  pressed: { opacity: 0.85 },
});

export default StoryListCard;
