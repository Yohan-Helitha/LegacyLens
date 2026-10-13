import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Typography } from '../../../theme';

/** A row of five stars with the first `rating` filled, e.g. 4 -> ★★★★☆. Decorative; the number is read out instead. */
export const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <Text
      style={[s.stars, { fontSize: size, lineHeight: size + 4 }]}
      accessibilityLabel={`${filled} out of 5 stars`}
    >
      {'★'.repeat(filled)}
      <Text style={s.empty}>{'★'.repeat(5 - filled)}</Text>
    </Text>
  );
};

const s = StyleSheet.create({
  stars: { fontFamily: Typography.fontBody, color: '#E8792E', letterSpacing: 2 },
  empty: { color: '#c8dcdc' },
});
