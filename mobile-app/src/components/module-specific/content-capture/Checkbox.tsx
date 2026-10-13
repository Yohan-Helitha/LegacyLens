import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Typography, Spacing } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Shown as a red-ish helper line under the row when the elder tried to proceed without checking it. */
  errorText?: string;
}

/**
 * Labelled checkbox row used wherever this module gates an action behind an
 * explicit acknowledgement (story submission's two confirmations, the hire
 * flow's deletion-window notice). A 44dp+ touch target covers the whole
 * row, not just the box, and the label is the accessible name.
 */
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onToggle, children, errorText }) => (
  <View style={s.wrap}>
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [s.row, pressed && s.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[s.box, checked && s.boxChecked, !!errorText && s.boxError]}>
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </View>
      <Text style={s.label}>{children}</Text>
    </Pressable>
    {!!errorText && <Text style={s.errorText}>{errorText}</Text>}
  </View>
);

const s = StyleSheet.create({
  wrap: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, minHeight: 44 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: D.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: { backgroundColor: D.primary, borderColor: D.primary },
  boxError: { borderColor: '#ba1a1a' },
  label: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
    marginStart: 22 + Spacing.sm,
  },
  pressed: { opacity: 0.85 },
});

export default Checkbox;
