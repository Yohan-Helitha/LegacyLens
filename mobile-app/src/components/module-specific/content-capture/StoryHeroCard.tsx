import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Radii, Spacing, Typography } from '../../../theme';
import { formatShortDate } from '../../../utils/dateFormat';
import type { StorySummary } from '../../../types/story';
import { StatusPill } from './StatusPill';
import { StoryMediaThumb } from './StoryMediaThumb';
import { ContentCaptureColors as D } from './tokens';

interface StoryHeroCardProps {
  story: StorySummary;
  onPress?: () => void;
}

/**
 * The single most recent story, featured larger than the rest of the list
 * directly beneath the search bar — a focal point before the regular list
 * begins (Screen 6, My Stories).
 */
export const StoryHeroCard: React.FC<StoryHeroCardProps> = ({ story, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.card, pressed && s.pressed]}
    accessibilityRole="button"
    accessibilityLabel={`Open story: ${story.title}`}
  >
    <StoryMediaThumb mediaType={story.mediaType} variant="hero" />

    <View style={s.body}>
      <Text style={s.title} numberOfLines={2}>{story.title}</Text>
      <View style={s.metaRow}>
        <Text style={s.date}>{formatShortDate(story.createdAt)}</Text>
        <StatusPill status={story.status} />
      </View>
    </View>
  </Pressable>
);

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  body: { padding: Spacing.md, gap: Spacing.sm },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  pressed: { opacity: 0.9 },
});

export default StoryHeroCard;
