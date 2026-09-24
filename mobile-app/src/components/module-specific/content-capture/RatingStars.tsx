import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Typography } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface RatingStarsProps {
  /** 0–5, or null when the creator has no rating yet. */
  rating: number | null;
  /** Pre-formatted number shown beside the stars (locale-aware, e.g. "4.5"). Pass '' to show the stars alone. */
  ratingText: string;
  /** Shown instead of the stars when `rating` is null. */
  emptyText: string;
  /** Full spoken description, e.g. "Rated 4.5 out of 5". The stars themselves are hidden from screen readers. */
  accessibilityLabel: string;
  size?: number;
}

/**
 * Read-only star rating. Filled stars are rounded to the nearest whole star;
 * the exact figure is always printed next to them, so the meaning never
 * depends on the icons alone.
 */
export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  ratingText,
  emptyText,
  accessibilityLabel,
  size = 16,
}) => {
  if (rating == null) {
    return <Text style={s.emptyText}>{emptyText}</Text>;
  }

  const filledCount = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <View style={s.row} accessible accessibilityLabel={accessibilityLabel}>
      <View style={s.stars} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = index < filledCount;
          return (
            <Star
              key={index}
              size={size}
              color={filled ? D.secondary : D.outlineVariant}
              fill={filled ? D.secondaryContainer : 'transparent'}
              strokeWidth={2}
            />
          );
        })}
      </View>
      {!!ratingText && <Text style={s.ratingText}>{ratingText}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },
});

export default RatingStars;
