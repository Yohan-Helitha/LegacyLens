import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';

const C = {
  primary: '#0F5C5C',
  outline: '#718096',
  onSurface: '#202428',
} as const;

/** A tick-box row with a 44pt touch target - used by the creator application form and the language editor. */
export const CheckboxRow: React.FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.optionRow, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
  >
    <View style={[s.checkbox, checked && s.checkboxChecked]}>
      {checked && <Text style={s.checkMark}>{'✓'}</Text>}
    </View>
    <Text style={s.optionText}>{label}</Text>
  </Pressable>
);

/** A pick-one row with a 44pt touch target. */
export const RadioRow: React.FC<{
  label: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ label, selected, onSelect }) => (
  <Pressable
    onPress={onSelect}
    style={({ pressed }) => [s.optionRow, pressed && s.pressed]}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
  >
    <View style={[s.radio, selected && s.radioSelected]}>
      {selected && <View style={s.radioDot} />}
    </View>
    <Text style={s.optionText}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
  },
  optionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: C.onSurface,
    flexShrink: 1,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.outline,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
  checkMark: { fontSize: 14, color: '#ffffff', fontWeight: '700', lineHeight: 16 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: C.outline,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioSelected: { borderColor: C.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.primary },
  pressed: { opacity: 0.75 },
});
