import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface MethodChoiceCardProps {
  /** Icon (or icon group) rendered above the label */
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Selectable card used on the "how would you like to share" screen —
 * one per capture method (voice/video, writing, …).
 */
export const MethodChoiceCard: React.FC<MethodChoiceCardProps> = ({
  icon,
  label,
  onPress,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.card, pressed && s.pressed]}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
  >
    <View style={s.iconRow}>{icon}</View>
    <Text style={s.label}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pressed: { opacity: 0.85, backgroundColor: D.surfaceContainerLow },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    textAlign: 'center',
  },
});

export default MethodChoiceCard;
