import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { StarRating } from './StarRating';

const D = {
  surfaceContainerLow: '#f0f5f5',
  surfaceVariant:      '#c8dcdc',
  primary:             '#0F5C5C',
  edge:                'rgba(232,121,46,0.30)',
  onSurface:           '#202428',
  onSurfaceVariant:    '#4a5568',
} as const;

const CARD_WIDTH = 280;

export type FeedbackItem = {
  id: string;
  rating: number;
  /** Null when the knowledge holder gave stars only. */
  comment: string | null;
  elderName: string;
  opportunityTitle: string;
};

/**
 * The newest client feedback as cards you swipe sideways (newest first). The caller passes at most the
 * latest four, so it works like a queue: a new review joins the front and the oldest one drops off.
 * Used on the creator's dashboard and on their profile, so both look the same.
 */
export const FeedbackCarousel: React.FC<{ items: FeedbackItem[] }> = ({ items }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={s.row}
    decelerationRate="fast"
    snapToInterval={CARD_WIDTH + Spacing.sm}
  >
    {items.map((item) => (
      <View key={item.id} style={s.card}>
        <View style={s.edge} />
        <StarRating rating={item.rating} size={18} />
        {!!item.comment && <Text style={s.quote} numberOfLines={5}>{`“${item.comment}”`}</Text>}
        <View style={{ flex: 1 }} />
        <Text style={s.author} numberOfLines={1}>{`— ${item.elderName}`}</Text>
        <Text style={s.opportunity} numberOfLines={1}>{item.opportunityTitle}</Text>
      </View>
    ))}
  </ScrollView>
);

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  card: {
    width: CARD_WIDTH, minHeight: 170, gap: Spacing.xs, overflow: 'hidden',
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.xl, padding: Spacing.md,
    paddingLeft: Spacing.md + Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  // The soft side bar the feedback boxes always had.
  edge: { position: 'absolute', left: Spacing.md, top: Spacing.md, bottom: Spacing.md, width: 2, borderRadius: 1, backgroundColor: D.edge },
  quote: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurface, fontStyle: 'italic' },
  author: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary, letterSpacing: 0.3 },
  opportunity: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
});
