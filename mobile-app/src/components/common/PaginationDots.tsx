import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radii } from '../../theme';

interface PaginationDotsProps {
  /** Total number of steps */
  count?: number;
  /** Zero-based index of the active step */
  active: number;
}

/**
 * Row of pill-shaped step indicators — the active dot widens and turns
 * accent-orange; used on multi-step onboarding flows.
 */
export const PaginationDots: React.FC<PaginationDotsProps> = ({
  count = 3,
  active,
}) => (
  <View
    style={styles.row}
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: count - 1, now: active }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { height: 8, borderRadius: Radii.full },
  dotActive: { width: 28, backgroundColor: Colors.accent },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(107, 113, 120, 0.3)',
  },
});

export default PaginationDots;
