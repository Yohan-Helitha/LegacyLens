import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

interface StatCardProps {
  value: string | number;
  label: string;
}

/** Small number+label stat block — used in a row for quick activity stats. */
export const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <View style={styles.card}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    borderRadius: Radii.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  value: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: 28,
    color: Colors.accent,
    marginBottom: 2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default StatCard;
